export default function ClaudeCodePage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Claude Code Integration</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">What is Claude Code?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Claude Code is an AI-powered tool that helps you build and modify website components
            using natural language. Simply describe what you want, and Claude Code will generate
            the component code for you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Claude Code usage is based on token consumption. Check your usage in the dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open the Helper Bot panel</li>
            <li>Describe the component or change you want</li>
            <li>Claude Code will generate the code</li>
            <li>Review and apply the changes</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

