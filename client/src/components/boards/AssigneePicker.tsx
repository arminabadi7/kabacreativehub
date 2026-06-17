import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, User, Search, X } from "lucide-react";
import { MemberAvatar } from "./MemberAvatar";
import { BoardMember } from "./types";

interface AssigneePickerProps {
  members: BoardMember[];
  selectedId?: string | null;
  onSelect: (memberId: string | null) => void;
  placeholder?: string;
  /** Compact mode: just shows an avatar button (for task rows) */
  compact?: boolean;
}

export function AssigneePicker({
  members,
  selectedId,
  onSelect,
  placeholder = "Assignee",
  compact = false,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = members.find((m) => m.id === selectedId) ?? null;

  const filtered = members.filter((m) =>
    !query || (m.fullName ?? m.username).toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
      <PopoverTrigger asChild>
        {compact ? (
          /* Compact trigger: just an avatar circle for task rows */
          <button
            type="button"
            className="shrink-0 outline-none focus:ring-2 focus:ring-blue-300 rounded-full"
            title={selected ? (selected.fullName ?? selected.username) : "Assign member"}
          >
            {selected ? (
              <MemberAvatar member={selected} size="xs" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center transition-colors">
                <User className="w-2.5 h-2.5 text-gray-400" />
              </div>
            )}
          </button>
        ) : (
          /* Full chip trigger for the issue-level assignee */
          <button
            type="button"
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-sm
              transition-colors outline-none focus:ring-2 focus:ring-blue-300
              ${selected
                ? "border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
                : "border-dashed border-gray-300 hover:border-gray-400 text-gray-500"}
            `}
          >
            {selected ? (
              <>
                <MemberAvatar member={selected} size="xs" />
                <span className="max-w-[110px] truncate">{selected.fullName ?? selected.username}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onSelect(null))}
                  className="text-gray-400 hover:text-gray-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>{placeholder}</span>
              </>
            )}
          </button>
        )}
      </PopoverTrigger>

      {/* Portal-based dropdown — never clipped by parent overflow */}
      <PopoverContent
        className="p-0 w-60 rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        align="start"
        sideOffset={6}
      >
        {/* Search bar */}
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Member list */}
        <div className="max-h-56 overflow-y-auto py-1">
          {/* Remove assignee option */}
          {selectedId && (
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-500"
            >
              <X className="w-4 h-4" />
              <span>Remove assignee</span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <MemberAvatar member={member} size="sm" />
                <span className="text-sm text-gray-800 flex-1 text-left truncate">
                  {member.fullName ?? member.username}
                </span>
                {member.id === selectedId && (
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-xs text-gray-400">
              {query ? `No results for "${query}"` : "No members available"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
