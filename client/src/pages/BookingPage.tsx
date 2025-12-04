import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { format, addDays, setHours, setMinutes, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

type BookingQuestion = {
  id: string;
  question: string;
  questionType: string;
  options?: string;
  isRequired: boolean;
  order: number;
};

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

type FounderSettings = {
  timeFormat: string;
  meetingDuration: number;
  bufferTime: number;
  timezone: string;
};

type Guest = {
  name: string;
  email: string;
};

type Appointment = {
  id: string;
  appointmentTime: string;
};

export default function BookingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [step, setStep] = useState<"date" | "time" | "form">("date");
  const [formData, setFormData] = useState<Record<string, any>>({
    attendeeName: "",
    attendeeEmail: "",
  });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");

  const { data: questions = [] } = useQuery<BookingQuestion[]>({
    queryKey: ["/api/scheduling/questions"],
  });

  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/scheduling/availability"],
  });

  const { data: settings } = useQuery<FounderSettings>({
    queryKey: ["/api/founder/scheduling/settings"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/founder/scheduling/appointments"],
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/scheduling/appointments", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked!",
        description: "You'll receive a confirmation email shortly.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const getAvailableSlots = () => {
    if (!selectedDate || !settings) return [];

    const founderTimezone = settings.timezone || "America/Toronto";
    
    // Treat selected date as a date in founder's timezone (not visitor's timezone)
    // Extract just the year, month, day from the selected date
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    // Create a date object representing this day at midnight in founder's timezone
    // Then convert to UTC for proper handling
    const dayStartInFounderTz = new Date(year, month, day, 0, 0, 0);
    const dayStartUtc = fromZonedTime(dayStartInFounderTz, founderTimezone);
    
    // Get the day of week in founder's timezone
    const dayInFounderTz = toZonedTime(dayStartUtc, founderTimezone);
    const dayOfWeek = dayInFounderTz.getDay();
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek && a.isEnabled);

    if (!dayAvailability) return [];

    const [startHour, startMinute] = dayAvailability.startTime.split(":").map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(":").map(Number);

    // Create start and end times in founder's timezone for this specific day
    const startTimeFounderTz = new Date(year, month, day, startHour, startMinute, 0);
    const endTimeFounderTz = new Date(year, month, day, endHour, endMinute, 0);

    const slots: string[] = [];
    let currentTimeFounderTz = startTimeFounderTz;
    const totalSlotTime = settings.meetingDuration + settings.bufferTime;

    // Get all existing appointments and convert to founder's timezone for filtering
    const dayEndUtc = fromZonedTime(new Date(year, month, day, 23, 59, 59), founderTimezone);
    const existingAppointments = appointments.filter(apt => {
      const aptTimeUtc = new Date(apt.appointmentTime);
      return aptTimeUtc >= dayStartUtc && aptTimeUtc <= dayEndUtc;
    });

    while (isBefore(currentTimeFounderTz, endTimeFounderTz)) {
      // Calculate when this slot would end (meeting duration, not including buffer)
      const slotEndFounderTz = new Date(currentTimeFounderTz.getTime() + settings.meetingDuration * 60000);
      
      // Make sure slot end doesn't exceed availability window
      if (isAfter(slotEndFounderTz, endTimeFounderTz)) break;

      // Convert slot times to UTC for conflict checking
      const slotStartUtc = fromZonedTime(currentTimeFounderTz, founderTimezone);
      const slotEndUtc = fromZonedTime(slotEndFounderTz, founderTimezone);

      // Check if this slot conflicts with any existing appointment
      // Include buffer time: a new slot cannot start until meeting + buffer time after previous appointment
      const hasConflict = existingAppointments.some(apt => {
        const aptStartUtc = new Date(apt.appointmentTime);
        // Appointment occupies time until meeting duration + buffer
        const aptEndWithBufferUtc = new Date(aptStartUtc.getTime() + (settings.meetingDuration + settings.bufferTime) * 60000);
        
        // Conflict if:
        // 1. New slot starts during existing appointment (including buffer)
        // 2. New slot ends during existing appointment (including buffer)
        // 3. New slot completely contains existing appointment
        return (
          (slotStartUtc >= aptStartUtc && slotStartUtc < aptEndWithBufferUtc) ||
          (slotEndUtc > aptStartUtc && slotEndUtc <= aptEndWithBufferUtc) ||
          (slotStartUtc <= aptStartUtc && slotEndUtc >= aptEndWithBufferUtc)
        );
      });

      if (!hasConflict) {
        slots.push(format(currentTimeFounderTz, "HH:mm"));
      }

      // Move to next slot (meeting duration + buffer)
      currentTimeFounderTz = new Date(currentTimeFounderTz.getTime() + totalSlotTime * 60000);
    }

    return slots;
  };

  const formatTimeSlot = (time: string) => {
    if (!settings) return time;

    if (settings.timeFormat === "12h") {
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    }

    return time;
  };

  const handleAddGuest = () => {
    if (newGuestName && newGuestEmail) {
      setGuests([...guests, { name: newGuestName, email: newGuestEmail }]);
      setNewGuestName("");
      setNewGuestEmail("");
    }
  };

  const handleRemoveGuest = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !settings) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const localAppointmentTime = setMinutes(setHours(selectedDate, hours), minutes);
    
    // Convert from founder's timezone to UTC for storage
    const founderTimezone = settings.timezone || "America/Toronto";
    const appointmentTimeUtc = fromZonedTime(localAppointmentTime, founderTimezone);

    const urlParams = new URLSearchParams(window.location.search);
    const referralId = urlParams.get("ref");

    createAppointmentMutation.mutate({
      attendeeName: formData.attendeeName,
      attendeeEmail: formData.attendeeEmail,
      guests: guests.length > 0 ? JSON.stringify(guests) : undefined,
      appointmentTime: appointmentTimeUtc.toISOString(),
      formResponses: JSON.stringify(formData),
      referralId: referralId || undefined,
    });
  };

  const renderFormField = (question: BookingQuestion) => {
    const fieldValue = formData[question.id] || "";

    switch (question.questionType) {
      case "short_answer":
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
              required={question.isRequired}
              data-testid={`input-question-${question.id}`}
            />
          </div>
        );

      case "paragraph":
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
              required={question.isRequired}
              rows={4}
              data-testid={`textarea-question-${question.id}`}
            />
          </div>
        );

      case "multiple_choice":
        const mcOptions = question.options?.split(",").map(o => o.trim()) || [];
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => setFormData({ ...formData, [question.id]: value })}
              data-testid={`radio-group-question-${question.id}`}
            >
              {mcOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "checkboxes":
        const cbOptions = question.options?.split(",").map(o => o.trim()) || [];
        const selectedOptions = fieldValue ? (Array.isArray(fieldValue) ? fieldValue : [fieldValue]) : [];
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2" data-testid={`checkbox-group-question-${question.id}`}>
              {cbOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((o: string) => o !== option);
                      setFormData({ ...formData, [question.id]: newValue });
                    }}
                  />
                  <Label htmlFor={`${question.id}-${index}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "dropdown":
        const dropdownOptions = question.options?.split(",").map(o => o.trim()) || [];
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => setFormData({ ...formData, [question.id]: value })}
            >
              <SelectTrigger data-testid={`select-question-${question.id}`}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
              required={question.isRequired}
              data-testid={`input-date-question-${question.id}`}
            />
          </div>
        );

      case "time":
        return (
          <div key={question.id} className="space-y-2">
            <Label>
              {question.question}
              {question.isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="time"
              value={fieldValue}
              onChange={(e) => setFormData({ ...formData, [question.id]: e.target.value })}
              required={question.isRequired}
              data-testid={`input-time-question-${question.id}`}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const availableSlots = getAvailableSlots();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/85 to-secondary/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link href="/">
            <button className="font-bold text-2xl flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="inline-block">
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Kaba
                </span>
                <span className="text-white">Content</span>
              </span>
            </button>
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Schedule a Strategy Call</h1>
            <p className="text-muted-foreground">
              Book your 30-minute strategy call to discuss the mass-content system
            </p>
            {settings && (
              <p className="text-sm text-muted-foreground mt-2">
                All times shown in {settings.timezone} timezone
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {step === "date" && "Select Date"}
                  {step === "time" && "Select Time"}
                  {step === "form" && "Enter Details"}
                </CardTitle>
                {step !== "date" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (step === "time") setStep("date");
                      if (step === "form") setStep("time");
                    }}
                    data-testid="button-back"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {step === "date" && (
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) setStep("time");
                    }}
                    disabled={(date) => {
                      const dayOfWeek = date.getDay();
                      const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);
                      return !dayAvailability?.isEnabled || date < new Date();
                    }}
                    className="rounded-md border"
                    data-testid="calendar-date-selector"
                  />
                </div>
              )}

              {step === "time" && selectedDate && (
                <div>
                  <div className="mb-4 text-center">
                    <p className="text-lg font-medium">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No available time slots for this day
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          onClick={() => {
                            setSelectedTime(slot);
                            setStep("form");
                          }}
                          data-testid={`button-time-slot-${slot}`}
                          className="w-full"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {formatTimeSlot(slot)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === "form" && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <p className="text-lg font-medium">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime && formatTimeSlot(selectedTime)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formData.attendeeName}
                        onChange={(e) => setFormData({ ...formData, attendeeName: e.target.value })}
                        required
                        data-testid="input-attendee-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={formData.attendeeEmail}
                        onChange={(e) => setFormData({ ...formData, attendeeEmail: e.target.value })}
                        required
                        data-testid="input-attendee-email"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <Label className="mb-2 block">Add Guests (Optional)</Label>
                      {guests.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {guests.map((guest, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div>
                                <p className="text-sm font-medium">{guest.name}</p>
                                <p className="text-xs text-muted-foreground">{guest.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGuest(index)}
                                data-testid={`button-remove-guest-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Guest name"
                          value={newGuestName}
                          onChange={(e) => setNewGuestName(e.target.value)}
                          data-testid="input-guest-name"
                        />
                        <Input
                          placeholder="Guest email"
                          type="email"
                          value={newGuestEmail}
                          onChange={(e) => setNewGuestEmail(e.target.value)}
                          data-testid="input-guest-email"
                        />
                        <Button onClick={handleAddGuest} size="icon" data-testid="button-add-guest">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {questions.map(renderFormField)}

                    <Button
                      onClick={handleSubmit}
                      disabled={createAppointmentMutation.isPending}
                      className="w-full"
                      data-testid="button-complete-booking"
                    >
                      {createAppointmentMutation.isPending ? "Booking..." : "Complete Booking"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
