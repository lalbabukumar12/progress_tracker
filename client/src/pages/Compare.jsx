import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper component for searchable student selector
function StudentSearchDropdown({
  label,
  selectedStudent,
  allStudents = [],
  onSelect,
  onClear,
  otherStudentId,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allStudents.filter((student) => {
      if (!q) return true;
      const name = (student.name || '').toLowerCase();
      const displayName = (student.displayName || '').toLowerCase();
      const roll = (student.rollNumber || '').toLowerCase();
      const college = (student.college || '').toLowerCase();
      return name.includes(q) || displayName.includes(q) || roll.includes(q) || college.includes(q);
    });
  }, [allStudents, query]);

  return (
    <div className="flex-1 space-y-2 relative" ref={dropdownRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      {selectedStudent ? (
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
              {(selectedStudent.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-100 truncate">
                {selectedStudent.displayName || selectedStudent.name}
              </div>
              <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                <span className="font-mono text-slate-300">{selectedStudent.rollNumber}</span>
                {selectedStudent.college && (
                  <>
                    <span>•</span>
                    <span>{selectedStudent.college}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs shrink-0"
            title="Change student"
          >
            ✕ Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={`Search ${label} by name or roll number...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all shadow-md"
          />
          <span className="absolute left-3.5 top-3.5 text-slate-500 text-xs">🔍</span>

          {isOpen && (
            <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1 custom-scrollbar animate-in fade-in duration-150">
              {filteredCandidates.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center italic">
                  No matching students found
                </div>
              ) : (
                filteredCandidates.map((student) => {
                  const isAlreadyOther = student._id === otherStudentId;
                  return (
                    <button
                      key={student._id}
                      type="button"
                      disabled={isAlreadyOther}
                      onClick={() => {
                        onSelect(student._id);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isAlreadyOther
                          ? 'opacity-40 cursor-not-allowed bg-slate-950/40 text-slate-500'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {(student.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 truncate">
                            {student.displayName || student.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            <span className="font-mono">{student.rollNumber}</span>
                            {student.college ? ` • ${student.college}` : ''}
                          </div>
                        </div>
                      </div>
                      {isAlreadyOther ? (
                        <span className="text-[10px] text-slate-500 font-mono italic">Selected</span>
                      ) : (
                        <span className="text-indigo-400 font-semibold text-[11px]">Select →</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentAId = searchParams.get('a') || '';
  const studentBId = searchParams.get('b') || '';

  const [allStudents, setAllStudents] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState(null);

  // Fetch student directory list for dropdown pickers
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/students');
        if (res.ok) {
          const data = await res.json();
          setAllStudents(data);
        }
      } catch (err) {
        console.error('Failed to load student directory for compare', err);
      }
    };
    fetchStudents();
  }, []);

  // Fetch comparison data when both IDs are set
  useEffect(() => {
    if (!studentAId || !studentBId) {
      setComparisonData(null);
      return;
    }

    if (studentAId === studentBId) {
      setError('Please select two different students to compare.');
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      setLoadingComparison(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:5000/api/students/compare?a=${studentAId}&b=${studentBId}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to compare students');
        }
        setComparisonData(data);
      } catch (err) {
        setError(err.message || 'Error fetching comparison data');
        toast.error(err.message || 'Error fetching comparison');
      } finally {
        setLoadingComparison(false);
      }
    };

    fetchComparison();
  }, [studentAId, studentBId]);

  const handleSelectA = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('a', id);
    setSearchParams(next, { replace: true });
  };

  const handleSelectB = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('b', id);
    setSearchParams(next, { replace: true });
  };

  const handleClearA = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('a');
    setSearchParams(next, { replace: true });
  };

  const handleClearB = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('b');
    setSearchParams(next, { replace: true });
  };

  const handleSwap = () => {
    if (!studentAId && !studentBId) return;
    const next = new URLSearchParams();
    if (studentBId) next.set('a', studentBId);
    if (studentAId) next.set('b', studentAId);
    setSearchParams(next, { replace: true });
  };

  // Extract selected student objects from allStudents or comparisonData
  const studentA =
    comparisonData?.studentA || allStudents.find((s) => s._id === studentAId) || null;
  const studentB =
    comparisonData?.studentB || allStudents.find((s) => s._id === studentBId) || null;

  // Comparison metrics calculations
  const metricsComparison = useMemo(() => {
    if (!comparisonData?.studentA || !comparisonData?.studentB) return null;

    const a = comparisonData.studentA;
    const b = comparisonData.studentB;

    // 1. LeetCode Solved
    const hasLeetcodeA = Boolean(a.leetcodeUsername && a.stats?.leetcode);
    const hasLeetcodeB = Boolean(b.leetcodeUsername && b.stats?.leetcode);
    const leetcodeComparable = hasLeetcodeA && hasLeetcodeB;
    const leetcodeA = hasLeetcodeA ? a.stats?.leetcode?.totalSolved || 0 : null;
    const leetcodeB = hasLeetcodeB ? b.stats?.leetcode?.totalSolved || 0 : null;

    // 2. Codeforces Rating
    const hasCodeforcesA = Boolean(a.codeforcesUsername && a.stats?.codeforces);
    const hasCodeforcesB = Boolean(b.codeforcesUsername && b.stats?.codeforces);
    const codeforcesComparable = hasCodeforcesA && hasCodeforcesB;
    const codeforcesA = hasCodeforcesA ? a.stats?.codeforces?.rating || 0 : null;
    const codeforcesB = hasCodeforcesB ? b.stats?.codeforces?.rating || 0 : null;

    // 3. GFG Score (Check if tracked)
    const hasGfgA = Boolean(a.gfgUsername && a.stats?.gfg);
    const hasGfgB = Boolean(b.gfgUsername && b.stats?.gfg);
    const gfgComparable = hasGfgA && hasGfgB;
    const gfgA = hasGfgA ? (a.stats?.gfg?.codingScore !== undefined ? a.stats?.gfg?.codingScore : a.stats?.gfg?.score || 0) : null;
    const gfgB = hasGfgB ? (b.stats?.gfg?.codingScore !== undefined ? b.stats?.gfg?.codingScore : b.stats?.gfg?.score || 0) : null;

    // 4. CodeChef Rating (Check if tracked)
    const hasCodechefA = Boolean(a.codechefUsername && a.stats?.codechef);
    const hasCodechefB = Boolean(b.codechefUsername && b.stats?.codechef);
    const codechefComparable = hasCodechefA && hasCodechefB;
    const codechefA = hasCodechefA ? a.stats?.codechef?.rating || 0 : null;
    const codechefB = hasCodechefB ? b.stats?.codechef?.rating || 0 : null;

    // 5. GitHub Repos
    const hasGithubA = Boolean(a.githubUsername && a.stats?.github);
    const hasGithubB = Boolean(b.githubUsername && b.stats?.github);
    const githubReposComparable = hasGithubA && hasGithubB;
    const githubReposA = hasGithubA ? a.stats?.github?.repoCount || a.stats?.github?.publicRepos || 0 : null;
    const githubReposB = hasGithubB ? b.stats?.github?.repoCount || b.stats?.github?.publicRepos || 0 : null;

    // 6. GitHub Followers
    const githubFollowersComparable = hasGithubA && hasGithubB;
    const githubFollowersA = hasGithubA ? a.stats?.github?.followers || 0 : null;
    const githubFollowersB = hasGithubB ? b.stats?.github?.followers || 0 : null;

    // Calculate Fair Head-to-Head Composite Score:
    // Only include metrics where BOTH students have valid data
    let compositeScoreA = 0;
    let compositeScoreB = 0;
    const includedMetrics = [];

    if (leetcodeComparable) {
      compositeScoreA += leetcodeA * 2;
      compositeScoreB += leetcodeB * 2;
      includedMetrics.push('LeetCode (x2)');
    }
    if (codeforcesComparable) {
      compositeScoreA += codeforcesA * 0.5;
      compositeScoreB += codeforcesB * 0.5;
      includedMetrics.push('Codeforces (x0.5)');
    }
    if (gfgComparable) {
      compositeScoreA += gfgA * 1;
      compositeScoreB += gfgB * 1;
      includedMetrics.push('GFG (x1)');
    }
    if (codechefComparable) {
      compositeScoreA += codechefA * 0.5;
      compositeScoreB += codechefB * 0.5;
      includedMetrics.push('CodeChef (x0.5)');
    }
    if (githubReposComparable) {
      compositeScoreA += githubReposA * 3;
      compositeScoreB += githubReposB * 3;
      includedMetrics.push('GitHub Repos (x3)');
    }

    compositeScoreA = Number(compositeScoreA.toFixed(1));
    compositeScoreB = Number(compositeScoreB.toFixed(1));

    // Rows list
    const rows = [
      {
        id: 'composite',
        label: 'Composite Score',
        isMainScore: true,
        valA: compositeScoreA,
        valB: compositeScoreB,
        comparable: includedMetrics.length > 0,
        subtext: includedMetrics.length > 0 ? `Fair head-to-head score based on: ${includedMetrics.join(', ')}` : 'No mutually tracked platforms',
      },
      {
        id: 'leetcode',
        label: 'LeetCode Solved',
        valA: leetcodeA,
        valB: leetcodeB,
        comparable: leetcodeComparable,
        unit: 'problems',
      },
      {
        id: 'codeforces',
        label: 'Codeforces Rating',
        valA: codeforcesA,
        valB: codeforcesB,
        comparable: codeforcesComparable,
        unit: 'pts',
      },
      {
        id: 'gfg',
        label: 'GFG Score',
        valA: gfgA,
        valB: gfgB,
        comparable: gfgComparable,
        unit: 'pts',
      },
      {
        id: 'codechef',
        label: 'CodeChef Rating',
        valA: codechefA,
        valB: codechefB,
        comparable: codechefComparable,
        unit: 'pts',
      },
      {
        id: 'github_repos',
        label: 'GitHub Repos',
        valA: githubReposA,
        valB: githubReposB,
        comparable: githubReposComparable,
        unit: 'repos',
      },
      {
        id: 'github_followers',
        label: 'GitHub Followers',
        valA: githubFollowersA,
        valB: githubFollowersB,
        comparable: githubFollowersComparable,
        unit: 'followers',
      },
    ];

    // Winner determination
    let winner = null; // 'A' | 'B' | 'TIED' | 'NONE'
    let diff = 0;
    if (includedMetrics.length > 0) {
      if (compositeScoreA > compositeScoreB) {
        winner = 'A';
        diff = Number((compositeScoreA - compositeScoreB).toFixed(1));
      } else if (compositeScoreB > compositeScoreA) {
        winner = 'B';
        diff = Number((compositeScoreB - compositeScoreA).toFixed(1));
      } else {
        winner = 'TIED';
      }
    } else {
      winner = 'NONE';
    }

    return {
      rows,
      compositeScoreA,
      compositeScoreB,
      winner,
      diff,
      includedMetrics,
    };
  }, [comparisonData]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
          Student Comparison
        </h1>
        <p className="text-slate-400 text-sm">
          Pick any two students to compare their coding handles, platform ratings, and repositories side by side.
        </p>
      </header>

      {/* Selector Control Bar */}
      <section className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <StudentSearchDropdown
            label="Student A"
            selectedStudent={studentA}
            allStudents={allStudents}
            onSelect={handleSelectA}
            onClear={handleClearA}
            otherStudentId={studentBId}
          />

          {/* Swap Button */}
          <div className="flex items-center justify-center pt-2 md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!studentAId && !studentBId}
              title="Swap Student A and Student B"
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/60 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed group flex items-center gap-1.5 text-xs font-semibold"
            >
              <span className="text-base group-hover:rotate-180 transition-transform duration-300">
                ⇄
              </span>
              <span className="md:hidden">Swap</span>
            </button>
          </div>

          <StudentSearchDropdown
            label="Student B"
            selectedStudent={studentB}
            allStudents={allStudents}
            onSelect={handleSelectB}
            onClear={handleClearB}
            otherStudentId={studentAId}
          />
        </div>

        {/* Informational Selection Prompt if needed */}
        {(!studentAId || !studentBId) && (
          <div className="text-center pt-2 text-xs text-indigo-300/80 font-medium">
            {!studentAId && !studentBId
              ? 'Select two students above to start the side-by-side comparison.'
              : !studentAId
              ? 'Now select Student A to compare with Student B.'
              : 'Now select Student B to complete the head-to-head matchup.'}
          </div>
        )}
      </section>

      {/* Loading state */}
      {loadingComparison && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 animate-pulse">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-300 font-semibold text-sm">
            Fetching & comparing latest metrics...
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loadingComparison && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-3xl p-6 text-center space-y-2">
          <div className="text-rose-400 font-bold text-sm">Comparison Error</div>
          <div className="text-slate-300 text-xs">{error}</div>
        </div>
      )}

      {/* Empty Selection State */}
      {!loadingComparison && (!studentAId || !studentBId) && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
            ⚖️
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-100">Ready for Head-to-Head</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Compare LeetCode problem solving, Codeforces contest performance, and GitHub contributions between any two students.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              ← Browse Student Directory
            </Link>
          </div>
        </div>
      )}

      {/* Comparison Results Layout */}
      {!loadingComparison && comparisonData && metricsComparison && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Big Headline Stat: Overall Composite Score Comparison */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/60 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              {/* Student A Score */}
              <div className="text-center md:text-left space-y-1 flex-1">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Student A Score
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">
                  {metricsComparison.compositeScoreA} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-xs font-medium text-slate-300 truncate max-w-xs">
                  {comparisonData.studentA.displayName || comparisonData.studentA.name}
                </div>
              </div>

              {/* Central Winner / Matchup Headline Badge */}
              <div className="text-center px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-lg space-y-1 min-w-[240px]">
                <div className="text-xs uppercase tracking-wider font-mono text-slate-400">
                  Head-to-Head Verdict
                </div>
                <div className="text-base font-extrabold flex items-center justify-center gap-1.5">
                  {metricsComparison.winner === 'A' ? (
                    <span className="text-emerald-400">
                      🏆 {comparisonData.studentA.name} leads by +{metricsComparison.diff} pts
                    </span>
                  ) : metricsComparison.winner === 'B' ? (
                    <span className="text-emerald-400">
                      🏆 {comparisonData.studentB.name} leads by +{metricsComparison.diff} pts
                    </span>
                  ) : metricsComparison.winner === 'TIED' ? (
                    <span className="text-amber-400">🤝 Tied ({metricsComparison.compositeScoreA} pts each)</span>
                  ) : (
                    <span className="text-slate-400">No overlapping platform data</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {metricsComparison.includedMetrics.length > 0
                    ? `Compared: ${metricsComparison.includedMetrics.join(', ')}`
                    : 'Excluded platforms without handles for both students'}
                </div>
              </div>

              {/* Student B Score */}
              <div className="text-center md:text-right space-y-1 flex-1">
                <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  Student B Score
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">
                  {metricsComparison.compositeScoreB} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-xs font-medium text-slate-300 truncate max-w-xs ml-auto">
                  {comparisonData.studentB.displayName || comparisonData.studentB.name}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Table / Card Layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Table Header Row with Student Information and VS Divider */}
            <div className="grid grid-cols-11 border-b border-slate-800 bg-slate-950/60 p-4 md:p-6 items-center">
              {/* Student A Header Card */}
              <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                  {(comparisonData.studentA.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-bold text-slate-100 truncate">
                      {comparisonData.studentA.displayName || comparisonData.studentA.name}
                    </h2>
                    {metricsComparison.winner === 'A' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold shrink-0">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-mono text-slate-300">{comparisonData.studentA.rollNumber}</span>
                    {comparisonData.studentA.college && <span>• {comparisonData.studentA.college}</span>}
                    {(comparisonData.studentA.branch || comparisonData.studentA.section) && (
                      <span className="text-indigo-300 font-mono text-[11px]">
                        • {[comparisonData.studentA.branch, comparisonData.studentA.section ? `Sec ${comparisonData.studentA.section}` : null].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/dashboard/${comparisonData.studentA._id}`}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                    >
                      View Dashboard →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Center VS Divider */}
              <div className="col-span-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-black text-xs flex items-center justify-center shadow-md">
                  VS
                </div>
              </div>

              {/* Student B Header Card */}
              <div className="col-span-5 flex items-center justify-end text-right gap-3.5 min-w-0">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center justify-end gap-2">
                    {metricsComparison.winner === 'B' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold shrink-0">
                        Winner
                      </span>
                    )}
                    <h2 className="text-base md:text-lg font-bold text-slate-100 truncate">
                      {comparisonData.studentB.displayName || comparisonData.studentB.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
                    {(comparisonData.studentB.branch || comparisonData.studentB.section) && (
                      <span className="text-cyan-300 font-mono text-[11px]">
                        {[comparisonData.studentB.branch, comparisonData.studentB.section ? `Sec ${comparisonData.studentB.section}` : null].filter(Boolean).join(' ')} •
                      </span>
                    )}
                    {comparisonData.studentB.college && <span>{comparisonData.studentB.college} •</span>}
                    <span className="font-mono text-slate-300">{comparisonData.studentB.rollNumber}</span>
                  </div>
                  <div>
                    <Link
                      to={`/dashboard/${comparisonData.studentB._id}`}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                    >
                      View Dashboard →
                    </Link>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-lg shadow-cyan-600/30">
                  {(comparisonData.studentB.name || 'B').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Metric Comparison Rows */}
            <div className="divide-y divide-slate-800/80">
              {metricsComparison.rows.map((row) => {
                const { id, label, valA, valB, comparable, unit, isMainScore, subtext } = row;

                const isMissingA = valA === null || valA === undefined;
                const isMissingB = valB === null || valB === undefined;

                // Win/Loss logic
                const isWinA = comparable && !isMissingA && !isMissingB && valA > valB;
                const isWinB = comparable && !isMissingA && !isMissingB && valB > valA;
                const isTie = comparable && !isMissingA && !isMissingB && valA === valB;

                const diffValue = comparable && !isMissingA && !isMissingB ? Math.abs(valA - valB) : 0;
                const diffFormatted = Number.isInteger(diffValue) ? diffValue : diffValue.toFixed(1);

                return (
                  <div
                    key={id}
                    className={`grid grid-cols-11 p-4 md:px-6 md:py-4 items-center transition-colors ${
                      isMainScore ? 'bg-indigo-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Student A Metric Column */}
                    <div
                      className={`col-span-4 p-3 rounded-2xl flex items-center justify-between transition-all ${
                        isWinA
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                          : 'text-slate-300'
                      }`}
                    >
                      <div>
                        {isMissingA ? (
                          <span className="text-xs font-mono text-slate-500 italic">No data</span>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-base md:text-lg font-mono font-bold ${isWinA ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {valA}
                            </span>
                            {unit && <span className="text-[11px] text-slate-500">{unit}</span>}
                          </div>
                        )}
                      </div>

                      {/* Delta Indicator for Student A */}
                      {isWinA && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          +{diffFormatted}
                        </span>
                      )}
                      {isTie && !isMissingA && !isMissingB && (
                        <span className="text-[10px] font-mono text-slate-400">Tied</span>
                      )}
                    </div>

                    {/* Central Metric Label */}
                    <div className="col-span-3 text-center px-2 space-y-0.5">
                      <div className={`text-xs font-bold ${isMainScore ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {label}
                      </div>
                      {subtext && <div className="text-[10px] text-slate-500">{subtext}</div>}
                      {!comparable && (
                        <div className="text-[10px] text-amber-400/90 font-mono">
                          Excluded from composite (missing data)
                        </div>
                      )}
                    </div>

                    {/* Student B Metric Column */}
                    <div
                      className={`col-span-4 p-3 rounded-2xl flex items-center justify-between text-right transition-all ${
                        isWinB
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                          : 'text-slate-300'
                      }`}
                    >
                      {/* Delta Indicator for Student B */}
                      <div>
                        {isWinB && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            +{diffFormatted}
                          </span>
                        )}
                        {isTie && !isMissingA && !isMissingB && (
                          <span className="text-[10px] font-mono text-slate-400">Tied</span>
                        )}
                      </div>

                      <div>
                        {isMissingB ? (
                          <span className="text-xs font-mono text-slate-500 italic">No data</span>
                        ) : (
                          <div className="flex items-baseline justify-end gap-1">
                            <span className={`text-base md:text-lg font-mono font-bold ${isWinB ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {valB}
                            </span>
                            {unit && <span className="text-[11px] text-slate-500">{unit}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
