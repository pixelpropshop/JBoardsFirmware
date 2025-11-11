import { useMemo } from 'react'

interface DataPoint {
  timestamp: number
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  width?: number
  height?: number
  color?: string
  showGrid?: boolean
  showAxes?: boolean
  unit?: string
}

export default function LineChart({
  data,
  width = 600,
  height = 200,
  color = '#3b82f6',
  showGrid = true,
  showAxes = true,
  unit = '',
}: LineChartProps) {
  const { path, points, minValue, maxValue, minTime, maxTime } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', points: [], minValue: 0, maxValue: 0, minTime: 0, maxTime: 0 }
    }

    const values = data.map((d) => d.value)
    const times = data.map((d) => d.timestamp)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    // Add padding to value range (10%)
    const valueRange = maxValue - minValue || 1
    const paddedMin = minValue - valueRange * 0.1
    const paddedMax = maxValue + valueRange * 0.1

    // Generate SVG path
    const points = data.map((d) => {
      const x = ((d.timestamp - minTime) / (maxTime - minTime)) * width
      const y = height - ((d.value - paddedMin) / (paddedMax - paddedMin)) * height
      return { x, y, value: d.value, timestamp: d.timestamp }
    })

    const path = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')

    return { path, points, minValue: paddedMin, maxValue: paddedMax, minTime, maxTime }
  }, [data, width, height])

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 text-sm"
        style={{ width, height }}
      >
        No data available
      </div>
    )
  }

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {showGrid && (
          <g className="opacity-20">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={`h-${ratio}`}
                x1={0}
                y1={height * ratio}
                x2={width}
                y2={height * ratio}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={`v-${ratio}`}
                x1={width * ratio}
                y1={0}
                x2={width * ratio}
                y2={height}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill={color}
          opacity={0.1}
        />

        {/* Line */}
        <path d={path} stroke={color} strokeWidth={2} fill="none" />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={3}
              fill={color}
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          </g>
        ))}
      </svg>

      {/* Y-axis labels */}
      {showAxes && (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-12 w-10 text-right">
          <span>
            {maxValue.toFixed(1)}
            {unit}
          </span>
          <span>
            {((maxValue + minValue) / 2).toFixed(1)}
            {unit}
          </span>
          <span>
            {minValue.toFixed(1)}
            {unit}
          </span>
        </div>
      )}

      {/* X-axis labels */}
      {showAxes && (
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{new Date(minTime).toLocaleTimeString()}</span>
          <span>{new Date(maxTime).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  )
}
