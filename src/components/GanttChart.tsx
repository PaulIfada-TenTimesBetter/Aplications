"use client";

import { forwardRef, useMemo } from "react";
import type { ProjectDTO, TaskDTO } from "@/lib/types";
import { buildTimeline, barGeometry, todayOffset, durationLabel, ROW_HEIGHT } from "@/lib/gantt-utils";

interface GanttChartProps {
  project: ProjectDTO;
  tasks: TaskDTO[];
  onEditTask: (task: TaskDTO) => void;
  onDeleteTask: (task: TaskDTO) => void;
}

const SECTION_TINTS = [
  "bg-slate-100",
  "bg-sky-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-violet-50",
  "bg-rose-50",
];

const LEFT_COL_WIDTH = 300;

const GanttChart = forwardRef<HTMLDivElement, GanttChartProps>(function GanttChart(
  { project, tasks, onEditTask, onDeleteTask },
  ref
) {
  const timeline = useMemo(
    () => buildTimeline(project.startDate, project.endDate, project.viewMode),
    [project.startDate, project.endDate, project.viewMode]
  );

  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TaskDTO[]>();
    for (const task of tasks) {
      if (!map.has(task.section)) {
        map.set(task.section, []);
        order.push(task.section);
      }
      map.get(task.section)!.push(task);
    }
    return order.map((name) => ({ name, items: map.get(name)! }));
  }, [tasks]);

  const todayLeft = todayOffset(timeline);
  const chartHeight = tasks.length * ROW_HEIGHT + sections.length * ROW_HEIGHT + 2;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div ref={ref} className="inline-flex min-w-full flex-col bg-white" data-gantt-export>
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {project.startDate} → {project.endDate} · {durationLabel(project.startDate, project.endDate)} ·{" "}
              <span className="capitalize">{project.viewMode}</span> view
            </p>
          </div>
        </div>

        <div className="flex">
          {/* Left frozen column */}
          <div
            className="flex shrink-0 flex-col border-r border-slate-200"
            style={{ width: LEFT_COL_WIDTH }}
          >
            <div
              className="flex items-end border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
              style={{ height: 56 }}
            >
              Task
            </div>
            {sections.length === 0 && (
              <div className="flex h-24 items-center justify-center px-4 text-sm text-slate-400">
                No tasks yet
              </div>
            )}
            {sections.map((section, sIdx) => (
              <div key={section.name}>
                <div
                  className={`flex items-center px-4 text-sm font-semibold text-slate-700 ${SECTION_TINTS[sIdx % SECTION_TINTS.length]}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {section.name}
                </div>
                {section.items.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between gap-2 border-t border-slate-100 px-4 text-sm text-slate-700"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="truncate text-left hover:text-blue-600 hover:underline"
                      title={task.name}
                    >
                      {task.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task)}
                      data-export-hide
                      className="shrink-0 text-xs text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                      aria-label={`Delete ${task.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative" style={{ width: timeline.totalWidth }}>
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100" style={{ height: 56 }}>
              <div className="relative h-6 border-b border-slate-200">
                {timeline.topColumns.map((col) => (
                  <div
                    key={col.key}
                    className="absolute top-0 flex h-6 items-center justify-center border-r border-slate-200 text-[11px] font-semibold text-slate-600"
                    style={{ left: col.left, width: col.width }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
              <div className="relative h-7">
                {timeline.columns.map((col) => (
                  <div
                    key={col.key}
                    className={`absolute top-0 flex h-7 flex-col items-center justify-center border-r text-[10px] leading-tight ${
                      col.isWeekend ? "bg-slate-200/70 border-slate-200" : "border-slate-200"
                    }`}
                    style={{ left: col.left, width: col.width }}
                  >
                    <span className="font-medium text-slate-600">{col.label}</span>
                    {col.subLabel && <span className="text-slate-400">{col.subLabel}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative" style={{ height: sections.length === 0 ? 96 : chartHeight - 56 }}>
              {/* vertical grid lines */}
              {timeline.columns.map((col) => (
                <div
                  key={col.key}
                  className="absolute top-0 bottom-0 border-r border-slate-100"
                  style={{ left: col.left + col.width }}
                />
              ))}

              {todayLeft !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 w-px bg-rose-500"
                  style={{ left: todayLeft }}
                >
                  <div className="absolute -left-5 -top-0.5 rounded bg-rose-500 px-1 py-0.5 text-[9px] font-semibold text-white">
                    Today
                  </div>
                </div>
              )}

              {sections.length === 0 && (
                <div className="flex h-24 items-center justify-center text-sm text-slate-400">
                  Add a task to see it on the chart
                </div>
              )}

              {sections.map((section, sIdx) => (
                <div key={section.name}>
                  <div
                    className={`${SECTION_TINTS[sIdx % SECTION_TINTS.length]}`}
                    style={{ height: ROW_HEIGHT }}
                  />
                  {section.items.map((task) => {
                    const { left, width } = barGeometry(timeline, task.startDate, task.endDate);
                    return (
                      <div
                        key={task.id}
                        className="relative border-t border-slate-100"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          className="absolute top-1/2 block -translate-y-1/2 overflow-hidden rounded-md text-left shadow-sm ring-1 ring-black/10 transition hover:brightness-95"
                          style={{ left, width, height: 22, backgroundColor: hexToSoft(task.color) }}
                          title={`${task.name}: ${task.startDate} → ${task.endDate} (${task.progress}%)`}
                        >
                          <div className="relative flex h-full w-full items-center">
                            <div
                              className="h-full"
                              style={{ width: `${task.progress}%`, backgroundColor: task.color }}
                            />
                            <span className="absolute left-2 truncate text-[11px] font-medium text-white drop-shadow-sm">
                              {width > 50 ? task.name : ""}
                            </span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function hexToSoft(hex: string): string {
  const parsed = hex.replace("#", "");
  if (parsed.length !== 6) return hex;
  const r = parseInt(parsed.slice(0, 2), 16);
  const g = parseInt(parsed.slice(2, 4), 16);
  const b = parseInt(parsed.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.35)`;
}

export default GanttChart;
