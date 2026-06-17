import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, Save, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

type BookingQuestion = {
  id: string;
  question: string;
  questionType: string;
  options?: string;
  isRequired: boolean;
  order: number;
};

type Appointment = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  appointmentTime: string;
  formResponses: string;
  affiliateUsername?: string;
  status: string;
};

type FounderSettings = {
  id: string;
  timeFormat: string;
  meetingDuration: number;
  bufferTime: number;
  timezone: string;
};

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const QUESTION_TYPES = [
  { value: "short_answer", label: "Short Answer" },
  { value: "paragraph", label: "Paragraph" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "checkboxes", label: "Checkboxes" },
  { value: "dropdown", label: "Dropdown" },
  { value: "file_upload", label: "File Upload" },
  { value: "linear_scale", label: "Linear Scale" },
  { value: "rating", label: "Rating" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
];

export default function SchedulingCalendar() {
  const { toast } = useToast();
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("short_answer");
  const [newQuestionOptions, setNewQuestionOptions] = useState("");

  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/scheduling/availability"],
  });

  const { data: questions = [] } = useQuery<BookingQuestion[]>({
    queryKey: ["/api/scheduling/questions"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/founder/scheduling/appointments"],
  });

  const { data: settings } = useQuery<FounderSettings>({
    queryKey: ["/api/founder/scheduling/settings"],
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: { dayOfWeek: number; startTime: string; endTime: string; isEnabled: boolean }) => {
      return await apiRequest("PUT", "/api/founder/scheduling/availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling/availability"] });
      toast({
        title: "Success",
        description: "Availability updated",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: Omit<BookingQuestion, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/founder/scheduling/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling/questions"] });
      setNewQuestion("");
      setNewQuestionOptions("");
      toast({
        title: "Success",
        description: "Question added",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/founder/scheduling/questions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling/questions"] });
      toast({
        title: "Success",
        description: "Question deleted",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<FounderSettings>) => {
      return await apiRequest("PUT", "/api/founder/scheduling/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/scheduling/settings"] });
      toast({
        title: "Success",
        description: "Settings updated",
      });
    },
  });

  const handleAddQuestion = () => {
    if (!newQuestion) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 0;

    createQuestionMutation.mutate({
      question: newQuestion,
      questionType: newQuestionType,
      options: newQuestionOptions || undefined,
      isRequired: true,
      order: nextOrder,
    });
  };

  const handleToggleDay = (dayOfWeek: number, currentEnabled: boolean, startTime: string, endTime: string) => {
    updateAvailabilityMutation.mutate({
      dayOfWeek,
      startTime,
      endTime,
      isEnabled: !currentEnabled,
    });
  };

  const handleUpdateTime = (dayOfWeek: number, startTime: string, endTime: string, isEnabled: boolean) => {
    updateAvailabilityMutation.mutate({
      dayOfWeek,
      startTime,
      endTime,
      isEnabled,
    });
  };

  const getAvailabilityForDay = (dayOfWeek: number): Availability | undefined => {
    return availability.find(a => a.dayOfWeek === dayOfWeek);
  };

  return (
    <Tabs defaultValue="availability" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="questions">Form Builder</TabsTrigger>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="availability">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Weekly Availability
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set your available hours for each day of the week
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS_OF_WEEK.map((day, index) => {
              const dayAvailability = getAvailabilityForDay(index);
              const isEnabled = dayAvailability?.isEnabled ?? true;
              const startTime = dayAvailability?.startTime ?? "00:00";
              const endTime = dayAvailability?.endTime ?? "23:45";

              return (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-md">
                  <div className="flex items-center gap-2 w-32">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleDay(index, isEnabled, startTime, endTime)}
                      data-testid={`switch-day-${index}`}
                    />
                    <Label className="font-medium">{day}</Label>
                  </div>
                  
                  {isEnabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleUpdateTime(index, e.target.value, endTime, isEnabled)}
                        className="w-32"
                        data-testid={`input-start-time-${index}`}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleUpdateTime(index, startTime, e.target.value, isEnabled)}
                        className="w-32"
                        data-testid={`input-end-time-${index}`}
                      />
                    </div>
                  )}
                  
                  {!isEnabled && (
                    <span className="text-muted-foreground">Unavailable</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Booking Form Builder
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize the questions clients answer when booking
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Question Text</Label>
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter your question"
                  data-testid="input-new-question"
                />
              </div>
              
              <div>
                <Label>Question Type</Label>
                <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                  <SelectTrigger data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {["multiple_choice", "checkboxes", "dropdown"].includes(newQuestionType) && (
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={newQuestionOptions}
                    onChange={(e) => setNewQuestionOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    data-testid="input-question-options"
                  />
                </div>
              )}

              <Button onClick={handleAddQuestion} data-testid="button-add-question">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Current Questions</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions added yet</p>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, index) => (
                    <div key={q.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`question-${index}`}>
                      <div className="flex-1">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {QUESTION_TYPES.find(t => t.value === q.questionType)?.label}
                          {q.isRequired && " • Required"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestionMutation.mutate(q.id)}
                        data-testid={`button-delete-question-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appointments">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Appointments</CardTitle>
            <p className="text-sm text-muted-foreground">
              View all upcoming and past appointments
            </p>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground">No appointments scheduled yet</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-md" data-testid={`appointment-${apt.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{apt.attendeeName}</p>
                        <p className="text-sm text-muted-foreground">{apt.attendeeEmail}</p>
                        <p className="text-sm mt-1">
                          {new Date(apt.appointmentTime).toLocaleString()}
                        </p>
                        {apt.affiliateUsername && (
                          <p className="text-sm text-primary mt-1">
                            Referred by: {apt.affiliateUsername}
                          </p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        apt.status === "scheduled" ? "bg-green-100 text-green-800" :
                        apt.status === "completed" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {apt.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Scheduling Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Time Format</Label>
              <Select
                value={settings?.timeFormat || "12h"}
                onValueChange={(value) => updateSettingsMutation.mutate({ timeFormat: value })}
              >
                <SelectTrigger data-testid="select-time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Meeting Duration (minutes)</Label>
              <Input
                type="number"
                value={settings?.meetingDuration || 30}
                onChange={(e) => updateSettingsMutation.mutate({ meetingDuration: parseInt(e.target.value) })}
                data-testid="input-meeting-duration"
              />
            </div>

            <div>
              <Label>Buffer Time Between Meetings (minutes)</Label>
              <Input
                type="number"
                value={settings?.bufferTime || 20}
                onChange={(e) => updateSettingsMutation.mutate({ bufferTime: parseInt(e.target.value) })}
                data-testid="input-buffer-time"
              />
            </div>

            <div>
              <Label>Timezone</Label>
              <Input
                value={settings?.timezone || "America/Toronto"}
                onChange={(e) => updateSettingsMutation.mutate({ timezone: e.target.value })}
                data-testid="input-timezone"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
