export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Dashboard Status</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            All systems operational.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Check your version history to see recent changes and commits.
          </p>
        </section>
      </div>
    </div>
  );
}

