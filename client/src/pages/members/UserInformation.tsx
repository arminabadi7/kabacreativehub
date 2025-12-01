import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Settings } from "lucide-react";

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  profilePicture: string | null;
  role: string;
  memberSince: string;
};

export default function UserInformation({ member }: { member: Member }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <CardTitle className="text-lg font-semibold mb-4">User Information</CardTitle>
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-medium text-gray-900">{member.fullName || member.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Member Since</div>
              <div className="font-medium text-gray-900">{formatDate(member.memberSince)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm text-gray-600">Roles</div>
              <div className="inline-block px-3 py-1 bg-gray-300 text-white rounded-full text-sm font-medium mt-1">
                {member.role}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


