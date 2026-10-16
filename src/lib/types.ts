import type { ViewMode } from "@/lib/validation";

export interface ProjectDTO {
  id: number;
  title: string;
  viewMode: ViewMode;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDTO {
  id: number;
  projectId: number;
  name: string;
  section: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export type { ViewMode };
