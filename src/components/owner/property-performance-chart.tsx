"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const FALLBACK_DATA = [
  { name: "Mortgage", value: 1800, color: "#ef4444" },
  { name: "Property Management", value: 580, color: "#3b82f6" },
  { name: "Insurance", value: 450, color: "#eab308" },
  { name: "Maintenance", value: 350, color: "#22c55e" },
  { name: "Utilities", value: 270, color: "#a855f7" },
]

interface ChartEntry {
  name: string
  value: number
  color: string
}

interface PropertyPerformanceChartProps {
  data?: ChartEntry[]
}

export function PropertyPerformanceChart({ data }: PropertyPerformanceChartProps) {
  const chartData = data && data.length > 0 ? data : FALLBACK_DATA

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${value}`, undefined]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
