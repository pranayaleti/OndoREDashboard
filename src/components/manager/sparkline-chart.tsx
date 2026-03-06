import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from "recharts"

interface SparklineChartProps {
  data: Array<{ value: number }>
  color?: string
}

export function SparklineChart({ data, color = "#f97316" }: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <YAxis domain={[0, 1]} hide />
        <Tooltip
          formatter={(v: number) => [`${(v * 100).toFixed(0)}%`, "Risk score"]}
          contentStyle={{ fontSize: 11, padding: "4px 8px" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
