import type * as React from "react"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"

// Original chart components
interface ChartContainerProps {
  className?: string
  children: React.ReactNode
}

export function ChartContainer({ className, children }: ChartContainerProps) {
  return <div className={className}>{children}</div>
}

interface ChartLineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  x: string
  y: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any) => string
  showGridLines?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  className?: string
  colors?: string[]
}

export function ChartLine({
  data,
  x,
  y,
  valueFormatter,
  showGridLines,
  showXAxis,
  showYAxis,
  className,
  colors = ["#8884d8"],
}: ChartLineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={showGridLines ? "#ccc" : "none"} />
        {showXAxis && <XAxis dataKey={x} />}
        {showYAxis && <YAxis tickFormatter={valueFormatter} />}
        <Tooltip formatter={valueFormatter ? (value) => [valueFormatter(value)] : undefined} />
        <Line type="monotone" dataKey={y} stroke={colors[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface ChartPieProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  index: string
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any) => string
  className?: string
}

export function ChartPie({ data, index, category, valueFormatter, className }: ChartPieProps) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"]

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <PieChart>
        <Pie data={data} dataKey={category} nameKey={index} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={valueFormatter ? (value) => [valueFormatter(value)] : undefined} />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface ChartBarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  x: string
  y: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any) => string
  className?: string
  colors?: string[]
}

export function ChartBar({ data, x, y, valueFormatter, className, colors = ["#8884d8"] }: ChartBarProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} />
        <YAxis tickFormatter={valueFormatter} />
        <Tooltip formatter={valueFormatter ? (value) => [valueFormatter(value)] : undefined} />
        <Legend />
        <Bar dataKey={y} fill={colors[0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface ChartLegendProps {
  className?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  index: string
  color: string
}

export function ChartLegend({ className, data, index, color }: ChartLegendProps) {
  return (
    <div className={className}>
      {data.map((item, i) => (
        <div key={i} className="flex items-center">
          <div className="mr-2 h-4 w-4 rounded-full" style={{ backgroundColor: item[color] }} />
          <span>{item[index]}</span>
        </div>
      ))}
    </div>
  )
}

// New chart tooltip components
const ChartTooltip = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("rounded-md border bg-popover p-4 text-popover-foreground shadow-sm", className)} {...props} />
  )
}
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipContentProps {
  content: { label: string; value: string }[]
}

const ChartTooltipContent = ({ content }: ChartTooltipContentProps) => {
  return (
    <div className="grid gap-1">
      {content.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartTooltip, ChartTooltipContent }
