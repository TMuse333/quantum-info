export default function InfoPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Help & Information</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Welcome to the Editor</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This is your website editor. Use the tools in the sidebar to edit your website components,
            switch between pages, and save your changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a href="/info/editor" className="text-blue-600 hover:underline">
                Editor Guide
              </a>
            </li>
            <li>
              <a href="/info/claude-code" className="text-blue-600 hover:underline">
                Claude Code Integration
              </a>
            </li>
            <li>
              <a href="/info/dashboard" className="text-blue-600 hover:underline">
                Dashboard Status
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enable editor mode using the toggle in the top right</li>
            <li>Click on any component to edit it</li>
            <li>Use the page switcher to navigate between pages</li>
            <li>Save your changes with a descriptive commit message</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

