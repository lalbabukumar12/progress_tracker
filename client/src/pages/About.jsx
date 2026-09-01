export default function About() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-[#2B2438]">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#2B2438]">About Progress Tracker</h1>
      <p className="text-[#8A7FA3] leading-relaxed">
        Progress Tracker is a full-stack platform designed for monitoring competitive programming problem solving, platform ratings, and repositories.
      </p>
      <div className="p-6 bg-white border border-[#E0D4F7] rounded-2xl space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#7C4DFF]">Environment & Setup Instructions</h2>
        <div className="space-y-2 text-sm text-[#2B2438] font-mono bg-[#FAF8FE] p-4 rounded-xl border border-[#E0D4F7]">
          <p className="text-[#7C4DFF] font-semibold"># Server Setup</p>
          <p className="text-[#8A7FA3]">cd server</p>
          <p className="text-[#8A7FA3]">npm run dev</p>
          <br />
          <p className="text-[#7C4DFF] font-semibold"># Client Setup</p>
          <p className="text-[#8A7FA3]">cd client</p>
          <p className="text-[#8A7FA3]">npm run dev</p>
        </div>
      </div>
    </div>
  );
}
