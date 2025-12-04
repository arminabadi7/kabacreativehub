import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { detectBankFromCardNumber, formatShebaNumber, formatCardNumber } from "@/lib/bankDetection";
import { Edit, Save, X, Building2 } from "lucide-react";

type BillingInfo = {
  id: string;
  cardNumber: string | null;
  shebah: string | null;
  fullNameOnCard: string | null;
};

export default function BillingSection({ memberId }: { memberId: string }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [shebah, setShebah] = useState("");
  const [fullNameOnCard, setFullNameOnCard] = useState("");

  const { data: billingInfo, isLoading } = useQuery<BillingInfo>({
    queryKey: ["/api/members", memberId, "billing"],
  });

  useEffect(() => {
    if (billingInfo) {
      setCardNumber(billingInfo.cardNumber || "");
      // Remove IR prefix from shebah for editing (user only enters digits)
      const shebahValue = billingInfo.shebah || "";
      setShebah(shebahValue.toUpperCase().startsWith("IR") ? shebahValue.substring(2) : shebahValue);
      setFullNameOnCard(billingInfo.fullNameOnCard || "");
    }
  }, [billingInfo]);

  const updateBillingMutation = useMutation({
    mutationFn: async (data: { cardNumber?: string; shebah?: string; fullNameOnCard?: string }) => {
      const response = await apiRequest("PUT", `/api/members/${memberId}/billing`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members", memberId, "billing"] });
      setIsEditing(false);
      toast({ title: "Success!", description: "Billing information updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update billing information", variant: "destructive" });
    },
  });

  const handleSave = () => {
    // Format sheba with IR prefix if needed
    const formattedSheba = shebah ? formatShebaNumber(shebah) : "";
    
    // Validate sheba format (IR + 24 digits)
    if (formattedSheba && !/^IR\d{24}$/i.test(formattedSheba)) {
      toast({ title: "Error", description: "Sheba number must be IR followed by 24 digits", variant: "destructive" });
      return;
    }

    // Validate card number (16 digits)
    const cleanedCardNumber = cardNumber.replace(/\D/g, "");
    if (cleanedCardNumber && cleanedCardNumber.length !== 16) {
      toast({ title: "Error", description: "Card number must be 16 digits", variant: "destructive" });
      return;
    }

    updateBillingMutation.mutate({
      cardNumber: cleanedCardNumber || null,
      shebah: formattedSheba || null,
      fullNameOnCard: fullNameOnCard || null,
    });
  };

  const handleCancel = () => {
    if (billingInfo) {
      setCardNumber(billingInfo.cardNumber || "");
      // Remove IR prefix from shebah for editing
      const shebahValue = billingInfo.shebah || "";
      setShebah(shebahValue.toUpperCase().startsWith("IR") ? shebahValue.substring(2) : shebahValue);
      setFullNameOnCard(billingInfo.fullNameOnCard || "");
    }
    setIsEditing(false);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleShebahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    // Remove IR prefix if user types it
    if (value.startsWith("IR")) {
      value = value.substring(2);
    }
    // Only allow digits
    value = value.replace(/\D/g, "");
    if (value.length <= 24) {
      setShebah(value);
    }
  };

  const detectedBank = cardNumber ? detectBankFromCardNumber(cardNumber) : null;
  const formattedCardNumber = cardNumber ? formatCardNumber(cardNumber) : "";
  // Display shebah with IR prefix (for read-only mode, use billingInfo.shebah which may already have IR)
  const displayShebah = isEditing 
    ? (shebah ? `IR${shebah}` : "")
    : (billingInfo?.shebah || "");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-black text-white hover:bg-gray-900">
            <Edit className="w-4 h-4 mr-2" />
            Edit Billing Info
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Iranian Bank Card Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Card Number with Bank Detection */}
          <div>
            <Label>Card Number</Label>
            <div className="space-y-2">
              <Input
                value={isEditing ? cardNumber : formattedCardNumber}
                onChange={handleCardNumberChange}
                readOnly={!isEditing}
                className="bg-white"
                placeholder="Enter 16-digit card number"
                maxLength={19} // For formatted display (XXXX-XXXX-XXXX-XXXX)
              />
              {detectedBank && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{detectedBank.name}</span>
                  <div className="ml-auto w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">{detectedBank.code.substring(0, 2).toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shebah Number with IR prefix */}
          <div>
            <Label>Shebah Number</Label>
            <div className="space-y-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-l-md text-sm font-medium text-gray-700">
                    IR
                  </div>
                  <Input
                    value={shebah}
                    onChange={handleShebahChange}
                    className="flex-1 rounded-l-none"
                    placeholder="Enter 24-digit Sheba number"
                    maxLength={24}
                  />
                </div>
              ) : (
                <Input
                  value={displayShebah || ""}
                  readOnly
                  className="bg-white"
                  placeholder="Not set"
                />
              )}
              <p className="text-xs text-gray-500">
                Format: IR + 24 digits (e.g., IR123456789012345678901234)
              </p>
            </div>
          </div>

          {/* Full Name on Card */}
          <div>
            <Label>Full Name on Card</Label>
            <Input
              value={fullNameOnCard}
              onChange={(e) => setFullNameOnCard(e.target.value)}
              readOnly={!isEditing}
              className="bg-white"
              placeholder="Enter full name as displayed on card"
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateBillingMutation.isPending}
                className="bg-black text-white hover:bg-gray-900"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBillingMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


