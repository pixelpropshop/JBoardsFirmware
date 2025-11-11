// TODO: This page uses stub data. Replace with API calls in the future.

export default function About() {
  // Stub data for system information
  const systemInfo = {
    productName: 'JSense Board',
    version: 'v1.0.0',
    buildDate: '2024-01-15',
    chip: 'ESP32-S3',
    flashSize: '8 MB',
    freeMem: '256 KB',
    cpuFreq: '240 MHz',
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">About</h1>
        <p className="text-gray-500">System information and details</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Product Info */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Product Information</h2>
          
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">Product Name</dt>
            <dd>{systemInfo.productName}</dd>
            
            <dt className="text-gray-500">Firmware Version</dt>
            <dd>{systemInfo.version}</dd>
            
            <dt className="text-gray-500">Build Date</dt>
            <dd>{systemInfo.buildDate}</dd>
          </dl>
        </div>

        {/* Hardware Info */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Hardware Information</h2>
          
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">Chip Model</dt>
            <dd>{systemInfo.chip}</dd>
            
            <dt className="text-gray-500">Flash Size</dt>
            <dd>{systemInfo.flashSize}</dd>
            
            <dt className="text-gray-500">Free Memory</dt>
            <dd>{systemInfo.freeMem}</dd>
            
            <dt className="text-gray-500">CPU Frequency</dt>
            <dd>{systemInfo.cpuFreq}</dd>
          </dl>
        </div>

        {/* Links */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Resources</h2>
          
          <div className="space-y-2">
            <a href="https://github.com/pixelpropshop/JSenseFirmware" target="_blank" rel="noopener noreferrer" className="block text-brand-600 hover:underline">
              GitHub Repository
            </a>
            <a href="#" className="block text-brand-600 hover:underline">
              Documentation
            </a>
            <a href="#" className="block text-brand-600 hover:underline">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
