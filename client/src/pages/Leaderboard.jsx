import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [sortField, setSortField] = useState('compositeScore');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, monthlyRes] = await Promise.all([
        fetch('http://localhost:5000/api/students'),
        fetch('http://localhost:5000/api/monthly-top-performers').catch(() => null),
      ]);

      if (!studentsRes.ok) throw new Error(`Failed to load leaderboard data (Status: ${studentsRes.status})`);
      const studentsData = await studentsRes.json();
      setStudents(studentsData);

      if (monthlyRes && monthlyRes.ok) {
        const mData = await monthlyRes.json();
        setMonthlyData(mData);
      }
    } catch (err) {
      setError(err.message || 'Error fetching leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Compute composite score & normalized numbers for each student
  const processedStudents = useMemo(() => {
    // Detect duplicate student names across dataset
    const nameCounts = {};
    students.forEach((s) => {
      const key = (s.name || '').trim().toLowerCase();
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    });

    return students.map((student) => {
      const leetcodeSolved = student.stats?.leetcode?.totalSolved || 0;
      const codeforcesRating = student.stats?.codeforces?.rating || 0;
      const githubRepos = student.stats?.github?.repoCount || 0;
      const gfgScore = student.stats?.gfg?.codingScore || student.stats?.gfg?.score || 0;
      const codechefRating = student.stats?.codechef?.rating || 0;

      // Composite score directly provided by backend scoring engine
      const compositeScore = student.compositeScore !== undefined ? Number(student.compositeScore) : 0;

      const nameKey = (student.name || '').trim().toLowerCase();
      const isDuplicate = nameCounts[nameKey] > 1;

      // Disambiguated display label without DOB
      let formattedDisplayName = student.displayName;
      if (!formattedDisplayName) {
        const details = [student.college, student.rollNumber].filter(Boolean).join(', ');
        formattedDisplayName = isDuplicate && details ? `${student.name} (${details})` : student.name;
      }

      return {
        ...student,
        leetcodeSolved,
        codeforcesRating,
        githubRepos,
        gfgScore,
        codechefRating,
        compositeScore,
        formattedDisplayName,
      };
    });
  }, [students]);

  // Extract unique colleges list
  const colleges = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.college && s.college.trim()) set.add(s.college.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter & Sort
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...processedStudents];

    if (selectedCollege !== 'ALL') {
      result = result.filter((s) => (s.college || '').trim() === selectedCollege);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [processedStudents, selectedCollege, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="text-indigo-400 ml-1">↑</span> : <span className="text-indigo-400 ml-1">↓</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header & Formula Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Global Leaderboard</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Composite Rank formula: <code className="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs font-mono">LeetCode (25%) + Codeforces (20%) + GFG (20%) + GitHub (20%) + CodeChef (15%)</code>
          </p>
        </div>

        {/* College Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Filter College:</label>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Colleges ({processedStudents.length})</option>
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Spotlight Section */}
      {monthlyData && (monthlyData.topPerformers?.length > 0 || monthlyData.mostImproved?.length > 0) && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Monthly Spotlight
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {monthlyData.month}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Featured recognition for top composite rank and biggest monthly leap</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performer Card */}
            {monthlyData.topPerformers?.[0] && (
              <div className="relative group bg-slate-950/70 hover:bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-amber-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-amber-500/20">
                      👑
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                        🥇 Top Performer
                      </div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        <Link to={`/dashboard/${monthlyData.topPerformers[0]._id}`}>
                          {monthlyData.topPerformers[0].displayName || monthlyData.topPerformers[0].name}
                        </Link>
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>🏛️ {monthlyData.topPerformers[0].college || 'N/A'}</span>
                        {monthlyData.topPerformers[0].branch && <span>• {monthlyData.topPerformers[0].branch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-amber-400">
                      {monthlyData.topPerformers[0].compositeScore}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Composite Pts</div>
                  </div>
                </div>

                {/* Top 3 Podium Pill list */}
                {monthlyData.topPerformers.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs text-slate-300">
                    <span className="text-slate-500 text-[11px] font-semibold uppercase">Podium:</span>
                    {monthlyData.topPerformers.map((p, idx) => (
                      <Link
                        key={p._id}
                        to={`/dashboard/${p._id}`}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                          idx === 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                        <span>{p.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">({p.compositeScore})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Most Improved Card */}
            {monthlyData.mostImproved?.[0] && (
              <div className="relative group bg-slate-950/70 hover:bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-emerald-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-emerald-500/20">
                      🚀
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
                        ⚡ Most Improved
                      </div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        <Link to={`/dashboard/${monthlyData.mostImproved[0]._id}`}>
                          {monthlyData.mostImproved[0].displayName || monthlyData.mostImproved[0].name}
                        </Link>
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>🏛️ {monthlyData.mostImproved[0].college || 'N/A'}</span>
                        {monthlyData.mostImproved[0].branch && <span>• {monthlyData.mostImproved[0].branch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-emerald-400">
                      +{monthlyData.mostImproved[0].scoreDelta}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Gain this month</div>
                  </div>
                </div>

                {/* Most Improved Runners Up */}
                {monthlyData.mostImproved.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs text-slate-300">
                    <span className="text-slate-500 text-[11px] font-semibold uppercase">Top Climbers:</span>
                    {monthlyData.mostImproved.map((p, idx) => (
                      <Link
                        key={p._id}
                        to={`/dashboard/${p._id}`}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                          idx === 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <span>{idx === 0 ? '🔥' : '📈'}</span>
                        <span>{p.name}</span>
                        <span className="font-mono text-[11px] text-emerald-400">(+{p.scoreDelta})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Computing leaderboard standings...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : filteredAndSortedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No student records found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    Name {getSortIcon('name')}
                  </th>
                  <th
                    onClick={() => handleSort('college')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    College {getSortIcon('college')}
                  </th>
                  <th
                    onClick={() => handleSort('leetcodeSolved')}
                    className="py-4 px-6 cursor-pointer text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    LeetCode Solved {getSortIcon('leetcodeSolved')}
                  </th>
                  <th
                    onClick={() => handleSort('codeforcesRating')}
                    className="py-4 px-6 cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Codeforces Rating {getSortIcon('codeforcesRating')}
                  </th>
                  <th
                    onClick={() => handleSort('githubRepos')}
                    className="py-4 px-6 cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    GitHub Repos {getSortIcon('githubRepos')}
                  </th>
                  <th
                    onClick={() => handleSort('compositeScore')}
                    className="py-4 px-6 cursor-pointer text-right text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Composite Score {getSortIcon('compositeScore')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAndSortedStudents.map((student, index) => {
                  const rankNum = index + 1;
                  const isGold = rankNum === 1;
                  const isSilver = rankNum === 2;
                  const isBronze = rankNum === 3;

                  let rowBg = 'hover:bg-slate-800/40 transition-colors';
                  if (isGold) rowBg = 'bg-amber-500/10 hover:bg-amber-500/20 border-l-4 border-l-amber-400 transition-colors';
                  if (isSilver) rowBg = 'bg-slate-400/10 hover:bg-slate-400/20 border-l-4 border-l-slate-300 transition-colors';
                  if (isBronze) rowBg = 'bg-orange-600/10 hover:bg-orange-600/20 border-l-4 border-l-orange-400 transition-colors';

                  return (
                    <tr key={student._id} className={rowBg}>
                      {/* Rank Column */}
                      <td className="py-4 px-6 font-mono text-sm">
                        {isGold && <span className="inline-flex items-center gap-1 font-extrabold text-amber-400">🥇 #1</span>}
                        {isSilver && <span className="inline-flex items-center gap-1 font-bold text-slate-200">🥈 #2</span>}
                        {isBronze && <span className="inline-flex items-center gap-1 font-bold text-orange-400">🥉 #3</span>}
                        {!isGold && !isSilver && !isBronze && <span className="text-slate-500">#{rankNum}</span>}
                      </td>

                      {/* Name Column with Disambiguation */}
                      <td className="py-4 px-6">
                        <Link
                          to={`/dashboard/${student._id}`}
                          className="font-bold text-slate-100 hover:text-indigo-400 transition-colors"
                        >
                          {student.formattedDisplayName}
                        </Link>
                      </td>

                      {/* College Column */}
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {student.college || 'N/A'}
                      </td>

                      {/* LeetCode Solved */}
                      <td className="py-4 px-6 font-mono text-amber-400">
                        {student.leetcodeSolved}
                      </td>

                      {/* Codeforces Rating */}
                      <td className="py-4 px-6 font-mono text-cyan-400">
                        {student.codeforcesRating}
                      </td>

                      {/* GitHub Repos */}
                      <td className="py-4 px-6 font-mono text-indigo-400">
                        {student.githubRepos}
                      </td>

                      {/* Composite Score */}
                      <td className="py-4 px-6 text-right font-mono font-extrabold text-emerald-400 text-base">
                        {student.compositeScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
