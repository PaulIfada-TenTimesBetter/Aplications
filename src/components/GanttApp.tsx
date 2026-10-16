"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { ProjectDTO, TaskDTO, ViewMode } from "@/lib/types";
import NewProjectModal, { type NewProjectPayload } from "@/components/NewProjectModal";
import TaskModal, { type TaskFormValues } from "@/components/TaskModal";
import GanttChart from "@/components/GanttChart";
import { SCALE_TO_DAYS } from "@/lib/templates";
import { addDays, formatDate, parseDate } from "@/lib/gantt-utils";

interface GanttAppProps {
  initialProjects: ProjectDTO[];
}

const VIEW_LABELS: Record<ViewMode, string> = { day: "Days", week: "Weeks", month: "Months" };

export default function GanttApp({ initialProjects }: GanttAppProps) {
  const [projects, setProjects] = useState<ProjectDTO[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<ProjectDTO | null>(initialProjects[0] ?? null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [taskModalState, setTaskModalState] = useState<{ open: boolean; task: TaskDTO | null }>({
    open: false,
    task: null,
  });
  const [titleDraft, setTitleDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleDraft(activeProject?.title ?? "");
  }, [activeProject?.id, activeProject?.title]);

  const loadTasks = useCallback(async (projectId: number) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setActiveProject(data.project);
        setTasks(data.tasks);
      }
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (activeProject) {
      loadTasks(activeProject.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flashBanner(message: string) {
    setBanner(message);
    setTimeout(() => setBanner(null), 3500);
  }

  async function refreshProjectsList() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    if (res.ok) setProjects(data.projects);
  }

  async function handleCreateProject(payload: NewProjectPayload) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        startDate: payload.startDate,
        endDate: payload.endDate,
        viewMode: payload.viewMode,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      flashBanner(data.error ?? "Could not create project");
      return;
    }

    const project: ProjectDTO = data.project;

    if (payload.template) {
      const scaleDays = SCALE_TO_DAYS[payload.viewMode];
      const start = parseDate(payload.startDate);
      await Promise.all(
        payload.template.tasks.map((t) => {
          const taskStart = addDays(start, t.unitStart * scaleDays);
          const taskEnd = addDays(start, (t.unitStart + t.unitDuration) * scaleDays - 1);
          return fetch(`/api/projects/${project.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: t.name,
              section: t.section,
              startDate: formatDate(taskStart),
              endDate: formatDate(taskEnd),
              color: t.color,
              progress: 0,
            }),
          });
        })
      );
    }

    await refreshProjectsList();
    setShowNewProject(false);
    await loadTasks(project.id);
    flashBanner("Schedule created");
  }

  async function updateProjectField(fields: Partial<Pick<ProjectDTO, "title" | "startDate" | "endDate" | "viewMode">>) {
    if (!activeProject) return;
    const res = await fetch(`/api/projects/${activeProject.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (res.ok) {
      setActiveProject(data.project);
      setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
    } else {
      flashBanner(data.error ?? "Could not update project");
    }
  }

  async function handleDeleteProject() {
    if (!activeProject) return;
    if (!confirm(`Delete "${activeProject.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/projects/${activeProject.id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = projects.filter((p) => p.id !== activeProject.id);
      setProjects(remaining);
      if (remaining.length > 0) {
        await loadTasks(remaining[0].id);
      } else {
        setActiveProject(null);
        setTasks([]);
      }
      flashBanner("Schedule deleted");
    }
  }

  async function handleSaveTask(values: TaskFormValues) {
    if (!activeProject) return;
    const editing = taskModalState.task;
    const url = editing ? `/api/tasks/${editing.id}` : `/api/projects/${activeProject.id}/tasks`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      flashBanner(data.error ?? "Could not save task");
      return;
    }
    setTaskModalState({ open: false, task: null });
    await loadTasks(activeProject.id);
  }

  async function handleDeleteTask(task: TaskDTO) {
    if (!activeProject) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      setTaskModalState({ open: false, task: null });
      await loadTasks(activeProject.id);
    }
  }

  async function handleExportPng() {
    if (!chartRef.current || !activeProject) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: (node) => {
          if (node instanceof HTMLElement && node.dataset && node.dataset.exportHide !== undefined) {
            return false;
          }
          return true;
        },
      });
      const link = document.createElement("a");
      const safeTitle = activeProject.title.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "schedule";
      link.download = `${safeTitle}-gantt.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      flashBanner("Could not export image. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const existingSections = useMemo(() => Array.from(new Set(tasks.map((t) => t.section))), [tasks]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-lg font-bold text-slate-900">Gantt Scheduler</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowNewProject(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New schedule
          </button>
        </div>
      </header>

      {banner && (
        <div className="mx-auto mt-4 max-w-[1400px] rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          {banner}
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-6">
        <aside className="w-64 shrink-0">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your schedules ({projects.length})
          </h2>
          <div className="space-y-1.5">
            {projects.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No schedules yet. Create your first one!
              </p>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => loadTasks(p.id)}
                className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  activeProject?.id === p.id
                    ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="truncate">{p.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {p.startDate} → {p.endDate}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {!activeProject ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
              <p className="text-4xl">🗓️</p>
              <p className="mt-3 text-lg font-semibold text-slate-700">No schedule selected</p>
              <p className="mt-1 text-sm text-slate-500">Create a new schedule to get started.</p>
              <button
                type="button"
                onClick={() => setShowNewProject(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + New schedule
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[220px] flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Project title
                    </label>
                    <input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => titleDraft.trim() && titleDraft !== activeProject.title && updateProjectField({ title: titleDraft })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-base font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</label>
                      <input
                        type="date"
                        value={activeProject.startDate}
                        onChange={(e) => updateProjectField({ startDate: e.target.value })}
                        className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</label>
                      <input
                        type="date"
                        value={activeProject.endDate}
                        onChange={(e) => updateProjectField({ endDate: e.target.value })}
                        className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chart scale</span>
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                      {(Object.keys(VIEW_LABELS) as ViewMode[]).map((vm) => (
                        <button
                          key={vm}
                          type="button"
                          onClick={() => updateProjectField({ viewMode: vm })}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                            activeProject.viewMode === vm ? "bg-white text-blue-700 shadow" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {VIEW_LABELS[vm]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskModalState({ open: true, task: null })}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      + Add task
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPng}
                      disabled={exporting || tasks.length === 0}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {exporting ? "Exporting…" : "⬇ Download PNG"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {loadingTasks ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
                  Loading schedule…
                </div>
              ) : (
                <GanttChart
                  ref={chartRef}
                  project={activeProject}
                  tasks={tasks}
                  onEditTask={(task) => setTaskModalState({ open: true, task })}
                  onDeleteTask={handleDeleteTask}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />
      )}

      {taskModalState.open && activeProject && (
        <TaskModal
          initial={taskModalState.task}
          defaultDates={{ startDate: activeProject.startDate, endDate: activeProject.endDate }}
          existingSections={existingSections}
          onClose={() => setTaskModalState({ open: false, task: null })}
          onSave={handleSaveTask}
          onDelete={taskModalState.task ? () => handleDeleteTask(taskModalState.task!) : undefined}
        />
      )}
    </div>
  );
}
