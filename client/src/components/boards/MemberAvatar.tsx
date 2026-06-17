import { BoardMember } from "./types";

interface MemberAvatarProps {
  member?: BoardMember | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizes = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
};

export function MemberAvatar({ member, size = "sm", className = "" }: MemberAvatarProps) {
  const sizeClass = sizes[size];
  const initials = member?.fullName
    ? member.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : member?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${className}`}
      style={{ background: member ? undefined : "#E5E7EB" }}
      title={member?.fullName ?? member?.username ?? "Unknown"}
    >
      {member?.profilePicture ? (
        <img
          src={member.profilePicture}
          alt={member.fullName ?? member.username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-semibold text-white"
          style={{ background: member ? stringToColor(member.id) : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

/** Deterministic color from a string (for consistent avatar colors) */
function stringToColor(str: string): string {
  const colors = [
    "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B",
    "#EF4444", "#06B6D4", "#EC4899", "#84CC16",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
