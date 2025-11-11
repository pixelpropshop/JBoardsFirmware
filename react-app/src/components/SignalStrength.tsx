// Signal strength indicator with visual bars

interface SignalStrengthProps {
  rssi: number; // Signal strength in dBm
  size?: 'sm' | 'md' | 'lg';
}

export default function SignalStrength({ rssi, size = 'md' }: SignalStrengthProps) {
  // Determine signal quality based on RSSI
  // Excellent: > -50 dBm (4 bars)
  // Good: -50 to -60 dBm (3 bars)
  // Fair: -60 to -70 dBm (2 bars)
  // Poor: < -70 dBm (1 bar)
  
  let bars = 0;
  let quality = '';
  let color = '';
  
  if (rssi >= -50) {
    bars = 4;
    quality = 'Excellent';
    color = 'text-green-500';
  } else if (rssi >= -60) {
    bars = 3;
    quality = 'Good';
    color = 'text-green-500';
  } else if (rssi >= -70) {
    bars = 2;
    quality = 'Fair';
    color = 'text-yellow-500';
  } else {
    bars = 1;
    quality = 'Poor';
    color = 'text-red-500';
  }
  
  const sizeClasses = {
    sm: 'h-3 w-1',
    md: 'h-4 w-1.5',
    lg: 'h-5 w-2',
  };
  
  const barClass = sizeClasses[size];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-end gap-0.5 ${color}`}>
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`${barClass} rounded-sm ${
              bar <= bars ? 'bg-current' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span className={`text-sm ${color}`}>
        {quality} ({rssi} dBm)
      </span>
    </div>
  );
}
