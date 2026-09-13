import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function WeightProgressChart({
  data,
  goal,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <p className="text-sm text-gray-600">
          No weight data available yet.
        </p>
      </div>
    )
  }

  const chartData =
    data.map((entry) => ({
      ...entry,
      displayDate:
        formatDate(entry.date),
    }))

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Weight Progress
        </p>

        <h2 className="mt-1 text-lg font-black">
          Your Progress
        </h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 5,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="weightGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#a3e635"
                  stopOpacity={0.35}
                />

                <stop
                  offset="100%"
                  stopColor="#a3e635"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#ffffff"
              strokeOpacity={0.06}
              vertical={false}
            />

            <XAxis
              dataKey="displayDate"
              tick={{
                fill: "#6b7280",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{
                fill: "#6b7280",
                fontSize: 10,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#111111",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                color: "#ffffff",
              }}
              labelStyle={{
                color: "#9ca3af",
                fontSize: 11,
              }}
              formatter={(value) => [
                `${value} kg`,
                "Weight",
              ]}
            />

            <Area
              type="monotone"
              dataKey="weight"
              stroke="#a3e635"
              strokeWidth={3}
              fill="url(#weightGradient)"
              dot={{
                r: 4,
                fill: "#a3e635",
                stroke: "#000000",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-gray-600">
          Goal
        </span>

        <span className="font-black text-yellow-400">
          {goal} kg
        </span>
      </div>
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(
    `${dateString}T00:00:00`,
  )

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
    },
  )
}

export default WeightProgressChart