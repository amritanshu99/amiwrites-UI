// ProductivityAnalytics.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function ProductivityAnalytics({ stats }) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 sm:p-6 rounded-2xl shadow-xl mb-2">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-blue-100 mb-4 text-center">📊 Your Productivity Snapshot</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md">
          <p className="text-4xl font-bold">{stats.total}</p>
          <p className="text-sm text-blue-100">Total Tasks</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white shadow-md">
          <p className="text-4xl font-bold">{stats.completed}</p>
          <p className="text-sm text-emerald-100">Completed Tasks</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-md">
          <p className="text-4xl font-bold">{stats.completionRate}%</p>
          <p className="text-sm text-amber-100">Completion Rate</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">📈 Progress Over Time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stats.history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProductivityAnalytics;
