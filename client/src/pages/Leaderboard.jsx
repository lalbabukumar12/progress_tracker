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
      const compositeScore = student.compositeScore !== undefined ? Number(student.compositeScore) : 0;

      const nameKey = (student.name || '').trim().toLowerCase();
      const isDuplicate = nameCounts[nameKey] > 1;

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
    if (sortField !== field) return <span className="text-[#8A7FA3] ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="text-[#7C4DFF] ml-1 font-bold">↑</span> : <span className="text-[#7C4DFF] ml-1 font-bold">↓</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header & Formula Banner */}
      <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2B2438]">Global Leaderboard</h1>
          </div>
          <p className="text-[#8A7FA3] text-sm">
            Composite Rank formula: <code className="text-[#7C4DFF] bg-[#FAF8FE] px-2 py-0.5 rounded border border-[#E0D4F7] text-xs font-mono">LeetCode (25%) + Codeforces (20%) + GFG (20%) + GitHub (20%) + CodeChef (15%)</code>
          </p>
        </div>

        {/* College Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#8A7FA3] uppercase tracking-wider">Filter College:</label>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-[#FAF8FE] border border-[#E0D4F7] text-[#2B2438] text-xs font-semibold rounded-xl px-4 py-2 focus:outline-none focus:border-[#7C4DFF] cursor-pointer"
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
        <div className="bg-white border border-[#E0D4F7] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C4DFF]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0D4F7] pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <h2 className="text-xl font-bold text-[#2B2438] flex items-center gap-2">
                  Monthly Top Performer Spotlight
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0] font-mono">
                    {monthlyData.month}
                  </span>
                </h2>
                <p className="text-xs text-[#8A7FA3]">Featured recognition for top composite rank and biggest monthly leap</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performer Card */}
            {monthlyData.topPerformers?.[0] && (
              <div className="relative group bg-[#FAF8FE] hover:bg-[#F3EFFB] border border-[#E0D4F7] hover:border-[#7C4DFF] rounded-2xl p-6 transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#7C4DFF] text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-[#7C4DFF]/25">
                      #1
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8DEFB] border border-[#C9B6F0] text-[11px] font-bold text-[#7C4DFF] uppercase tracking-wider mb-1">
                        Top Performer
                      </div>
                      <h3 className="text-lg font-bold text-[#2B2438] group-hover:text-[#7C4DFF] transition-colors">
                        <Link to={`/dashboard/${monthlyData.topPerformers[0]._id}`}>
                          {monthlyData.topPerformers[0].displayName || monthlyData.topPerformers[0].name}
                        </Link>
                      </h3>
                      <div className="text-xs text-[#8A7FA3] flex items-center gap-2 mt-0.5">
                        <span>{monthlyData.topPerformers[0].college || 'N/A'}</span>
                        {monthlyData.topPerformers[0].branch && <span>• {monthlyData.topPerformers[0].branch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-[#27AE60]">
                      {monthlyData.topPerformers[0].compositeScore}
                    </div>
                    <div className="text-[11px] text-[#8A7FA3] uppercase tracking-wider font-semibold">Composite Pts</div>
                  </div>
                </div>

                {/* Top 3 Podium Pill list */}
                {monthlyData.topPerformers.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-[#E0D4F7] flex items-center gap-2 overflow-x-auto text-xs text-[#2B2438]">
                    <span className="text-[#8A7FA3] text-[11px] font-semibold uppercase">Podium:</span>
                    {monthlyData.topPerformers.map((p, idx) => (
                      <Link
                        key={p._id}
                        to={`/dashboard/${p._id}`}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                          idx === 0
                            ? 'bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0] font-bold'
                            : 'bg-white hover:bg-[#FAF8FE] text-[#2B2438] border border-[#E0D4F7]'
                        }`}
                      >
                        <span className="font-mono font-bold">#{idx + 1}</span>
                        <span>{p.name}</span>
                        <span className="font-mono text-[11px] text-[#27AE60]">({p.compositeScore})</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Most Improved Card */}
            {monthlyData.mostImproved?.[0] && (
              <div className="relative group bg-[#FAF8FE] hover:bg-[#F3EFFB] border border-[#27AE60]/40 rounded-2xl p-6 transition-all duration-300 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#27AE60] text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-[#27AE60]/20">
                      +{monthlyData.mostImproved[0].scoreDelta}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#27AE60]/12 border border-[#27AE60]/30 text-[11px] font-bold text-[#27AE60] uppercase tracking-wider mb-1">
                        Most Improved
                      </div>
                      <h3 className="text-lg font-bold text-[#2B2438] group-hover:text-[#27AE60] transition-colors">
                        <Link to={`/dashboard/${monthlyData.mostImproved[0]._id}`}>
                          {monthlyData.mostImproved[0].displayName || monthlyData.mostImproved[0].name}
                        </Link>
                      </h3>
                      <div className="text-xs text-[#8A7FA3] flex items-center gap-2 mt-0.5">
                        <span>{monthlyData.mostImproved[0].college || 'N/A'}</span>
                        {monthlyData.mostImproved[0].branch && <span>• {monthlyData.mostImproved[0].branch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold font-mono text-[#27AE60]">
                      +{monthlyData.mostImproved[0].scoreDelta}
                    </div>
                    <div className="text-[11px] text-[#8A7FA3] uppercase tracking-wider font-semibold">Gain this month</div>
                  </div>
                </div>

                {/* Most Improved Runners Up */}
                {monthlyData.mostImproved.length > 1 && (
                  <div className="mt-5 pt-4 border-t border-[#E0D4F7] flex items-center gap-2 overflow-x-auto text-xs text-[#2B2438]">
                    <span className="text-[#8A7FA3] text-[11px] font-semibold uppercase">Top Climbers:</span>
                    {monthlyData.mostImproved.map((p, idx) => (
                      <Link
                        key={p._id}
                        to={`/dashboard/${p._id}`}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                          idx === 0
                            ? 'bg-[#27AE60]/15 text-[#27AE60] border border-[#27AE60]/30 font-bold'
                            : 'bg-white hover:bg-[#FAF8FE] text-[#2B2438] border border-[#E0D4F7]'
                        }`}
                      >
                        <span className="font-mono font-bold">#{idx + 1}</span>
                        <span>{p.name}</span>
                        <span className="font-mono text-[11px] text-[#27AE60]">(+{p.scoreDelta})</span>
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
      <div className="bg-white border border-[#E0D4F7] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#8A7FA3] space-y-3">
            <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto" />
            <div>Computing leaderboard standings...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#E74C3C] text-sm">{error}</div>
        ) : filteredAndSortedStudents.length === 0 ? (
          <div className="p-12 text-center text-[#8A7FA3] text-sm">
            No student records found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#2B2438]">
              <thead className="bg-[#FAF8FE] text-xs font-semibold text-[#8A7FA3] uppercase tracking-wider border-b border-[#E0D4F7]">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-4 px-6 cursor-pointer hover:text-[#7C4DFF] transition-colors"
                  >
                    Name {getSortIcon('name')}
                  </th>
                  <th
                    onClick={() => handleSort('college')}
                    className="py-4 px-6 cursor-pointer hover:text-[#7C4DFF] transition-colors"
                  >
                    College {getSortIcon('college')}
                  </th>
                  <th
                    onClick={() => handleSort('leetcodeSolved')}
                    className="py-4 px-6 cursor-pointer text-[#D97706] hover:text-[#B45309] transition-colors"
                  >
                    LeetCode {getSortIcon('leetcodeSolved')}
                  </th>
                  <th
                    onClick={() => handleSort('codeforcesRating')}
                    className="py-4 px-6 cursor-pointer text-[#E74C3C] hover:text-[#DC2626] transition-colors"
                  >
                    Codeforces {getSortIcon('codeforcesRating')}
                  </th>
                  <th
                    onClick={() => handleSort('gfgScore')}
                    className="py-4 px-6 cursor-pointer text-[#27AE60] hover:text-[#219653] transition-colors"
                  >
                    GFG Score {getSortIcon('gfgScore')}
                  </th>
                  <th
                    onClick={() => handleSort('codechefRating')}
                    className="py-4 px-6 cursor-pointer text-[#D97706] hover:text-[#B45309] transition-colors"
                  >
                    CodeChef {getSortIcon('codechefRating')}
                  </th>
                  <th
                    onClick={() => handleSort('githubRepos')}
                    className="py-4 px-6 cursor-pointer text-[#2B2438] hover:text-[#7C4DFF] transition-colors"
                  >
                    GitHub Repos {getSortIcon('githubRepos')}
                  </th>
                  <th
                    onClick={() => handleSort('compositeScore')}
                    className="py-4 px-6 cursor-pointer text-right text-[#27AE60] hover:text-[#219653] transition-colors"
                  >
                    Composite Score {getSortIcon('compositeScore')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D4F7]/60 font-medium">
                {filteredAndSortedStudents.map((student, index) => {
                  const rankNum = index + 1;
                  const isGold = rankNum === 1;
                  const isSilver = rankNum === 2;
                  const isBronze = rankNum === 3;

                  let rowBg = 'hover:bg-[#FAF8FE] transition-colors';
                  if (isGold) rowBg = 'bg-[#E8DEFB]/60 hover:bg-[#E8DEFB]/80 border-l-4 border-l-[#7C4DFF] transition-colors';
                  if (isSilver) rowBg = 'bg-[#E8DEFB]/35 hover:bg-[#E8DEFB]/55 border-l-4 border-l-[#8E5CF7] transition-colors';
                  if (isBronze) rowBg = 'bg-[#E8DEFB]/20 hover:bg-[#E8DEFB]/40 border-l-4 border-l-[#A78BFA] transition-colors';

                  return (
                    <tr key={student._id} className={rowBg}>
                      {/* Rank Column */}
                      <td className="py-4 px-6 font-mono text-sm">
                        {isGold && <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#7C4DFF]/15 text-[#7C4DFF] font-extrabold border border-[#7C4DFF]/40">#1</span>}
                        {isSilver && <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#8E5CF7]/15 text-[#8E5CF7] font-bold border border-[#8E5CF7]/40">#2</span>}
                        {isBronze && <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#A78BFA]/20 text-[#6C3CE9] font-bold border border-[#A78BFA]/40">#3</span>}
                        {!isGold && !isSilver && !isBronze && <span className="text-[#8A7FA3]">#{rankNum}</span>}
                      </td>

                      {/* Name Column with Disambiguation */}
                      <td className="py-4 px-6">
                        <Link
                          to={`/dashboard/${student._id}`}
                          className="font-bold text-[#2B2438] hover:text-[#7C4DFF] transition-colors"
                        >
                          {student.formattedDisplayName}
                        </Link>
                      </td>

                      {/* College Column */}
                      <td className="py-4 px-6 text-[#8A7FA3] text-xs">
                        {student.college || 'N/A'}
                      </td>

                      {/* LeetCode Solved */}
                      <td className="py-4 px-6 font-mono text-[#D97706]">
                        {student.leetcodeSolved}
                      </td>

                      {/* Codeforces Rating */}
                      <td className="py-4 px-6 font-mono text-[#E74C3C]">
                        {student.codeforcesRating}
                      </td>

                      {/* GFG Score */}
                      <td className="py-4 px-6 font-mono text-[#27AE60]">
                        {student.gfgScore}
                      </td>

                      {/* CodeChef Rating */}
                      <td className="py-4 px-6 font-mono text-[#D97706]">
                        {student.codechefRating}
                      </td>

                      {/* GitHub Repos */}
                      <td className="py-4 px-6 font-mono text-[#2B2438]">
                        {student.githubRepos}
                      </td>

                      {/* Composite Score */}
                      <td className="py-4 px-6 text-right font-mono font-extrabold text-[#27AE60] text-base">
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
