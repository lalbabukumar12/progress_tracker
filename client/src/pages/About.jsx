export default function About() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">About Progress Tracker</h1>
      <p className="text-slate-300 leading-relaxed">
        Progress Tracker is a full-stack web application designed for tracking personal goals, projects, and learning milestones.
      </p>
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-indigo-400">Environment & Setup Instructions</h2>
        <div className="space-y-2 text-sm text-slate-300 font-mono bg-slate-950 p-4 rounded border border-slate-800">
          <p># Server Setup</p>
          <p className="text-slate-400">cd server</p>
          <p className="text-slate-400">npm run dev</p>
          <br />
          <p># Client Setup</p>
          <p className="text-slate-400">cd client</p>
          <p className="text-slate-400">npm run dev</p>
        </div>
      </div>
    </div>
  );
}
