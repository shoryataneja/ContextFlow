export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message = 'No data found' }) {
  return (
    <div className="text-center py-16 text-slate-500">
      <div className="text-4xl mb-3">🧠</div>
      <p>{message}</p>
    </div>
  );
}

export function ErrorBanner({ message }) {
  return (
    <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}
