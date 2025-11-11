export default function About() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">About</h1>
        <p className="text-gray-500">Information about JSense Board</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Resources */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-950/60">
          <h2 className="text-lg font-medium mb-4">Resources</h2>
          
          <div className="space-y-2">
            <a
              href="https://GetJBoards.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              🌐 GetJBoards.com
            </a>
            <a
              href="https://Facebook.com/GetJBoards"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              📘 Facebook Page
            </a>
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              📦 GitHub Repository
            </a>
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              📚 Documentation
            </a>
            <a
              href="https://github.com/pixelpropshop/JSenseFirmware/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-brand-600 hover:underline"
            >
              🐛 Report Issues
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Open Source:</strong> This project is open source and uses various third-party libraries.
            </p>
            <p>
              © 2025 Pixel Prop Shop. Licensed under MIT License.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
