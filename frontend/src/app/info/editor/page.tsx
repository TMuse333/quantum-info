export default function EditorGuidePage() {
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Editor Guide</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Edit Components</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            To edit a component on your website:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enable editor mode using the toggle</li>
            <li>Click on any component you want to edit</li>
            <li>Use the editing panel that appears on the right</li>
            <li>Make your changes and they will update in real-time</li>
            <li>Click "Save Changes" when you're done</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Component Types</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Different components have different editing options:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Text Components:</strong> Edit text content directly</li>
            <li><strong>Image Components:</strong> Upload or change images</li>
            <li><strong>Color Components:</strong> Adjust colors and gradients</li>
            <li><strong>Layout Components:</strong> Modify spacing and arrangement</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Saving Changes</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Always provide a descriptive commit message when saving. This helps you track
            what changes were made and when.
          </p>
        </section>
      </div>
    </div>
  );
}

