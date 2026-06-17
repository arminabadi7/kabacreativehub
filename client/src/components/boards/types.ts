// ─── Shared board types ────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  username: string;
  fullName: string | null;
  profilePicture: string | null;
}

export interface BoardTask {
  id: string;
  name?: string;
  title?: string;
  points?: number;
  assignedTo?: string | null;
  createdBy?: string | null;
  isCompleted?: boolean;
  status?: string;
  order?: number;
  // Resolved from join
  memberFullName?: string | null;
  memberUsername?: string | null;
  memberAvatar?: string | null;
}

export interface BoardIssue {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
  videoUrl?: string | null;
  videoDuration?: number | string | null;
  priority?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  publishDate?: string | null;
  teamId?: string | null;
  creatorId?: string | null;
  createdAt: string;
  tasks?: BoardTask[];
  // Joined fields
  assigneeName?: string | null;
  assigneeUsername?: string | null;
  assigneeAvatar?: string | null;
  creatorName?: string | null;
  creatorAvatar?: string | null;
}

export interface ProjectStatus {
  id: string;
  projectId: string;
  key: string;
  label: string;
  color: string;
  order: number;
}

export interface BoardProject {
  id: string;
  name: string;
  description?: string | null;
  clientId?: string | null;
  teamId?: string | null;
  fileLink?: string | null;
  clientUsername?: string | null;
  clientFullName?: string | null;
  teamName?: string | null;
}
