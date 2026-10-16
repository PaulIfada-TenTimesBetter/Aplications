import type { ViewMode } from "@/lib/validation";

export interface TemplateTask {
  section: string;
  name: string;
  unitStart: number;
  unitDuration: number;
  color: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: TemplateTask[];
}

export const SCALE_TO_DAYS: Record<ViewMode, number> = {
  day: 1,
  week: 7,
  month: 30,
};

const BLUE = "#2563eb";
const AMBER = "#d97706";
const EMERALD = "#059669";
const VIOLET = "#7c3aed";
const ROSE = "#e11d48";
const CYAN = "#0891b2";

export const TEMPLATES: ScheduleTemplate[] = [
  {
    id: "website-launch",
    name: "Website Launch",
    description: "Discovery, design, build, and launch phases for a new website.",
    icon: "🌐",
    tasks: [
      { section: "Discovery", name: "Stakeholder interviews", unitStart: 0, unitDuration: 1, color: BLUE },
      { section: "Discovery", name: "Competitive research", unitStart: 1, unitDuration: 1, color: BLUE },
      { section: "Design", name: "Wireframes", unitStart: 2, unitDuration: 1, color: VIOLET },
      { section: "Design", name: "Visual design", unitStart: 3, unitDuration: 2, color: VIOLET },
      { section: "Design", name: "Design review", unitStart: 5, unitDuration: 1, color: VIOLET },
      { section: "Build", name: "Frontend development", unitStart: 6, unitDuration: 3, color: AMBER },
      { section: "Build", name: "Backend integration", unitStart: 7, unitDuration: 3, color: AMBER },
      { section: "Build", name: "QA & testing", unitStart: 10, unitDuration: 2, color: AMBER },
      { section: "Launch", name: "Content migration", unitStart: 11, unitDuration: 1, color: EMERALD },
      { section: "Launch", name: "Go-live", unitStart: 12, unitDuration: 1, color: EMERALD },
      { section: "Launch", name: "Post-launch monitoring", unitStart: 13, unitDuration: 1, color: EMERALD },
    ],
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    description: "Plan, produce, and run a multi-channel marketing campaign.",
    icon: "📣",
    tasks: [
      { section: "Strategy", name: "Market research", unitStart: 0, unitDuration: 1, color: BLUE },
      { section: "Strategy", name: "Campaign brief", unitStart: 1, unitDuration: 1, color: BLUE },
      { section: "Creative", name: "Copywriting", unitStart: 2, unitDuration: 2, color: VIOLET },
      { section: "Creative", name: "Design assets", unitStart: 3, unitDuration: 2, color: VIOLET },
      { section: "Creative", name: "Video production", unitStart: 4, unitDuration: 2, color: VIOLET },
      { section: "Execution", name: "Social media launch", unitStart: 6, unitDuration: 2, color: ROSE },
      { section: "Execution", name: "Email campaign", unitStart: 6, unitDuration: 2, color: ROSE },
      { section: "Execution", name: "Paid ads", unitStart: 7, unitDuration: 3, color: ROSE },
      { section: "Analysis", name: "Performance tracking", unitStart: 9, unitDuration: 2, color: EMERALD },
      { section: "Analysis", name: "Final report", unitStart: 11, unitDuration: 1, color: EMERALD },
    ],
  },
  {
    id: "product-development",
    name: "Product Development",
    description: "From concept to release for a new product build.",
    icon: "🛠️",
    tasks: [
      { section: "Planning", name: "Requirements gathering", unitStart: 0, unitDuration: 1, color: BLUE },
      { section: "Planning", name: "Roadmap & scope", unitStart: 1, unitDuration: 1, color: BLUE },
      { section: "Design", name: "UX prototypes", unitStart: 2, unitDuration: 2, color: VIOLET },
      { section: "Design", name: "Technical architecture", unitStart: 2, unitDuration: 2, color: VIOLET },
      { section: "Development", name: "Core features", unitStart: 4, unitDuration: 4, color: AMBER },
      { section: "Development", name: "Integrations", unitStart: 6, unitDuration: 3, color: AMBER },
      { section: "Development", name: "Bug fixing", unitStart: 9, unitDuration: 2, color: AMBER },
      { section: "Release", name: "Beta testing", unitStart: 10, unitDuration: 2, color: CYAN },
      { section: "Release", name: "Launch prep", unitStart: 12, unitDuration: 1, color: CYAN },
      { section: "Release", name: "Public release", unitStart: 13, unitDuration: 1, color: CYAN },
    ],
  },
  {
    id: "event-planning",
    name: "Event Planning",
    description: "Organize a conference or corporate event end-to-end.",
    icon: "🎪",
    tasks: [
      { section: "Planning", name: "Define budget & goals", unitStart: 0, unitDuration: 1, color: BLUE },
      { section: "Planning", name: "Venue booking", unitStart: 1, unitDuration: 1, color: BLUE },
      { section: "Logistics", name: "Vendor coordination", unitStart: 2, unitDuration: 2, color: AMBER },
      { section: "Logistics", name: "Catering & AV setup", unitStart: 3, unitDuration: 2, color: AMBER },
      { section: "Marketing", name: "Invitations & registration", unitStart: 2, unitDuration: 3, color: ROSE },
      { section: "Marketing", name: "Social promotion", unitStart: 4, unitDuration: 3, color: ROSE },
      { section: "Event", name: "Rehearsal", unitStart: 7, unitDuration: 1, color: EMERALD },
      { section: "Event", name: "Event day", unitStart: 8, unitDuration: 1, color: EMERALD },
      { section: "Wrap-up", name: "Feedback survey", unitStart: 9, unitDuration: 1, color: CYAN },
      { section: "Wrap-up", name: "Final wrap report", unitStart: 10, unitDuration: 1, color: CYAN },
    ],
  },
];

export function templateSpanInUnits(template: ScheduleTemplate): number {
  return Math.max(...template.tasks.map((t) => t.unitStart + t.unitDuration));
}
