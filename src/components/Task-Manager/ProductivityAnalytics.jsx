// ProductivityAnalytics.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function ProductivityAnalytics({ stats }) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900 p-6 rounded-2xl shadow-xl mb-10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-blue-200 mb-4 text-center">📊 Your Productivity Snapshot</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-xl bg-gradient-to-tr from-blue-400 to-blue-600 text-white">
          <p className="text-4xl font-bold">{stats.total}</p>
          <p className="text-sm">Total Tasks</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-tr from-green-400 to-green-600 text-white">
          <p className="text-4xl font-bold">{stats.completed}</p>
          <p className="text-sm">Completed Tasks</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-tr from-yellow-400 to-yellow-600 text-white">
          <p className="text-4xl font-bold">{stats.completionRate}%</p>
          <p className="text-sm">Completion Rate</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">📈 Progress Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#8884d8" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ProductivityAnalytics;
