// This main settings page can redirect to the first section (e.g., API Keys)
// Or it can show an overview/welcome message.
// For now, let's just add a simple placeholder.

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Organization Settings</h1>
      <p>Select a category from the left menu to manage your organization's settings.</p>
      {/* Alternatively, redirect:
      import { redirect } from 'next/navigation';
      redirect('/settings/api-keys');
      */}
    </div>
  );
}
