// Connection status badge with color indicators

interface ConnectionStatusProps {
  connected: boolean;
  connecting?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConnectionStatus({ 
  connected, 
  connecting = false, 
  size = 'md' 
}: ConnectionStatusProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const dotSize = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };
  
  if (connecting) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 font-medium ${sizeClasses[size]}`}>
        <span className={`${dotSize[size]} rounded-full bg-yellow-500 animate-pulse`} />
        Connecting
      </span>
    );
  }
  
  if (connected) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium ${sizeClasses[size]}`}>
        <span className={`${dotSize[size]} rounded-full bg-green-500`} />
        Connected
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 font-medium ${sizeClasses[size]}`}>
      <span className={`${dotSize[size]} rounded-full bg-red-500`} />
      Disconnected
    </span>
  );
}
