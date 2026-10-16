"use client";

import { useState } from "react";
import type { TaskDTO } from "@/lib/types";

export interface TaskFormValues {
  name: string;
  section: string;
  startDate: string;
  endDate: string;
  progress: number;
  color: string;
}

interface TaskModalProps {
  initial?: TaskDTO | null;
  defaultDates: { startDate: string; endDate: string };
  existingSections: string[];
  onClose: () => void;
  onSave: (values: TaskFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

const COLOR_PRESETS = [
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#059669",
  "#e11d48",
  "#0891b2",
  "#4b5563",
  "#ca8a04",
];

export default function TaskModal({
  initial,
  defaultDates,
  existingSections,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [section, setSection] = useState(initial?.section ?? existingSections[0] ?? "General");
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaultDates.startDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? defaultDates.endDate);
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date must be before end date.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), section: section.trim() || "General", startDate, endDate, progress, color });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{initial ? "Edit task" : "Add task"}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Task name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design review"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Section / phase</label>
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Design"
              list="section-options"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <datalist id="section-options">
              {existingSections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Progress: <span className="font-normal text-slate-500">{progress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-1 w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Bar color</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ring-offset-2 transition ${color === c ? "ring-2 ring-slate-900" : ""}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-full border border-slate-300"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <div>
              {initial && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete task"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
