/**
 * Kanban WIP (Work In Progress) Limits per column
 * null = unlimited
 */
export const WIP_LIMITS: Record<string, number | null> = {
  Backlog: null,
  Analisis: null,
  Develop: 4,
  Review: 3,
  Test: 3,
  Done: null,
};

export const KANBAN_COLUMNS = [
  { key: "Backlog", label: "Backlog", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: "Analisis", label: "Analisis", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "Develop", label: "Develop", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "Review", label: "Review", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "Test", label: "Test", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { key: "Done", label: "Done", color: "bg-green-100 text-green-700 border-green-200" },
] as const;

