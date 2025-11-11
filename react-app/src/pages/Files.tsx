// TODO: This page uses stub data. Replace with API calls in the future.

export default function Files() {
  // Stub data for files
  const files = [
    { id: 1, name: 'config.json', size: '2.4 KB', modified: '2024-01-15' },
    { id: 2, name: 'effect_rainbow.bin', size: '15.2 KB', modified: '2024-01-10' },
    { id: 3, name: 'sequence_holiday.seq', size: '8.7 KB', modified: '2024-01-05' },
    { id: 4, name: 'backup.zip', size: '127 KB', modified: '2024-01-01' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Files</h1>
          <p className="text-gray-500">Manage stored files and configurations</p>
        </div>
        <button className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700">
          Upload File
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Modified</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3 text-sm">{file.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{file.size}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{file.modified}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button className="px-2 py-1 rounded text-sm bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 mr-2">
                    Download
                  </button>
                  <button className="px-2 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
