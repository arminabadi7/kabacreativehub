import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BillingInfo = {
  cardNumber: string | null;
  shebah: string | null;
  fullNameOnCard: string | null;
};

export default function BillingSection({ memberId }: { memberId: string }) {
  const { data: billingInfo } = useQuery<BillingInfo>({
    queryKey: ["/api/members", memberId, "billing"],
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>
      <Card>
        <CardHeader>
          <CardTitle>Iranian Bank Card Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Card Number</Label>
              <Input
                value={billingInfo?.cardNumber || ""}
                readOnly
                className="bg-white"
                placeholder="Not set"
              />
            </div>
            <div>
              <Label>Shebah</Label>
              <Input
                value={billingInfo?.shebah || ""}
                readOnly
                className="bg-white"
                placeholder="Not set"
              />
            </div>
          </div>
          <div>
            <Label>Full Name on Card</Label>
            <Input
              value={billingInfo?.fullNameOnCard || ""}
              readOnly
              className="bg-gray-50"
              placeholder="Not set"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


