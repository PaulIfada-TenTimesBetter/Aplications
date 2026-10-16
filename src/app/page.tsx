import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import GanttApp from "@/components/GanttApp";
import type { ProjectDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));

  const initialProjects: ProjectDTO[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    viewMode: p.viewMode as ProjectDTO["viewMode"],
    startDate: p.startDate,
    endDate: p.endDate,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <GanttApp initialProjects={initialProjects} />;
}
