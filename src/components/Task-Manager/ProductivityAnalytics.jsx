import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Layers3, PlayCircle } from "lucide-react";
import { TASK_STATUSES } from "./taskManagerConfig";

const STATUS_COLORS = ["#94a3b8", "#0ea5e9", "#f59e0b", "#10b981"];

function Metric({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900",
    amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
    rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{label}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{helper}</p>
    </div>
  );
}

export default function ProductivityAnalytics({ stats }) {
  const isDarkMode = document.documentElement.classList.contains("dark");
  const axisColor = isDarkMode ? "#71717a" : "#94a3b8";
  const tooltipStyle = {
    backgroundColor: isDarkMode ? "#09090b" : "#ffffff",
    borderColor: isDarkMode ? "#27272a" : "#e2e8f0",
    borderRadius: "12px",
    color: isDarkMode ? "#f4f4f5" : "#0f172a",
    boxShadow: "0 16px 40px -24px rgba(15,23,42,.5)",
  };

  const distribution = TASK_STATUSES.map((status, index) => ({
    name: status.label,
    value: stats.statusCounts[status.id] || 0,
    fill: STATUS_COLORS[index],
  }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Layers3} label="Total tasks" value={stats.total} helper="Across the whole board" tone="indigo" />
        <Metric icon={PlayCircle} label="In progress" value={stats.statusCounts["in-progress"] || 0} helper="Currently being worked" tone="amber" />
        <Metric icon={CheckCircle2} label="Completed" value={`${stats.completionRate}%`} helper={`${stats.done} tasks delivered`} tone="emerald" />
        <Metric icon={AlertTriangle} label="Overdue" value={stats.overdue} helper="Open tasks past due" tone="rose" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Workflow distribution</h3>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">Where work currently sits</p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={distribution} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={axisColor} opacity={0.16} />
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke={axisColor} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDarkMode ? "#18181b" : "#f8fafc" }} />
              <Bar dataKey="value" radius={[7, 7, 2, 2]}>
                {distribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Completed this week</h3>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">Daily delivery trend</p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={stats.history} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={axisColor} opacity={0.16} />
              <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke={axisColor} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
