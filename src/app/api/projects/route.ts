import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isNonEmptyString, isValidDateString, isValidViewMode } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
  return Response.json({ projects: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, startDate, endDate, viewMode } = body as Record<string, unknown>;

  if (!isNonEmptyString(title)) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return Response.json({ error: "Valid start and end dates are required" }, { status: 400 });
  }
  if (startDate > endDate) {
    return Response.json({ error: "Start date must be before end date" }, { status: 400 });
  }
  const mode = isValidViewMode(viewMode) ? viewMode : "week";

  const [created] = await db
    .insert(projects)
    .values({ title: title.trim(), startDate, endDate, viewMode: mode })
    .returning();

  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, created.id));

  return Response.json({ project: created, tasks: projectTasks }, { status: 201 });
}
