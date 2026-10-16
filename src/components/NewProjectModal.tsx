"use client";

import { useState } from "react";
import type { ViewMode } from "@/lib/types";
import { SCALE_TO_DAYS, TEMPLATES, templateSpanInUnits, type ScheduleTemplate } from "@/lib/templates";
import { addDays, formatDate, parseDate } from "@/lib/gantt-utils";

export interface NewProjectPayload {
  title: string;
  startDate: string;
  endDate: string;
  viewMode: ViewMode;
  template: ScheduleTemplate | null;
}

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (payload: NewProjectPayload) => Promise<void> | void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string; hint: string }[] = [
  { value: "day", label: "Days", hint: "Zoomed in, bars sized per day" },
  { value: "week", label: "Weeks", hint: "Balanced view, bars sized per week" },
  { value: "month", label: "Months", hint: "Zoomed out, bars sized per month" },
];

export default function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [mode, setMode] = useState<"blank" | "template">("blank");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => formatDate(addDays(new Date(), 30)));
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please give your project a title.");
      return;
    }

    let finalEndDate = endDate;
    if (mode === "template" && selectedTemplate) {
      const span = templateSpanInUnits(selectedTemplate);
      const days = span * SCALE_TO_DAYS[viewMode];
      finalEndDate = formatDate(addDays(parseDate(startDate), days - 1));
    }

    if (startDate > finalEndDate) {
      setError("Start date must be before the end date.");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        startDate,
        endDate: finalEndDate,
        viewMode,
        template: mode === "template" ? selectedTemplate : null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Create a new schedule</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("blank")}
            className={`flex-1 rounded-md py-2 transition ${mode === "blank" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
          >
            Start from blank
          </button>
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`flex-1 rounded-md py-2 transition ${mode === "template" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
          >
            Use a template
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Project title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Product Launch"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {mode === "template" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700">Choose a template</label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selectedTemplate?.id === tpl.id
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-lg">{tpl.icon}</div>
                    <div className="text-sm font-semibold text-slate-800">{tpl.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {mode === "blank" ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Template scale unit</label>
                <p className="mt-1 text-xs text-slate-500">
                  Each template step maps to one {viewMode}. The project length is calculated automatically.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Chart scale</label>
            <p className="text-xs text-slate-500">This controls how bar lengths are drawn across the timeline.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setViewMode(opt.value)}
                  className={`rounded-lg border p-2 text-center transition ${
                    viewMode === opt.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                  <div className="text-[11px] text-slate-500">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (mode === "template" && !selectedTemplate)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
