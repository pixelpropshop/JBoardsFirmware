// TODO: This page uses stub data. Replace with API calls in the future.

export default function Sensors() {
  // Stub data for sensor readings
  const sensors = [
    { id: 1, name: 'Temperature', value: '22.5', unit: '°C', status: 'Normal' },
    { id: 2, name: 'Humidity', value: '45', unit: '%', status: 'Normal' },
    { id: 3, name: 'Light Level', value: '350', unit: 'lux', status: 'Low' },
    { id: 4, name: 'Sound Level', value: '65', unit: 'dB', status: 'Normal' },
  ]

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Sensors</h1>
        <p className="text-gray-500">Monitor environmental sensors</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sensors.map((sensor) => (
          <div
            key={sensor.id}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60"
          >
            <h3 className="text-sm font-medium mb-2">{sensor.name}</h3>
            <div className="text-3xl font-bold mb-2">
              {sensor.value}
              <span className="text-lg text-gray-500 ml-1">{sensor.unit}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  sensor.status === 'Normal' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm text-gray-500">{sensor.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
