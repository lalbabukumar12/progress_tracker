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
      <label className="block text-xs font-bold uppercase tracking-wider text-[#8A7FA3]">
        {label}
      </label>

      {selectedStudent ? (
        <div className="flex items-center justify-between p-3 bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#7C4DFF] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-[#7C4DFF]/25">
              {(selectedStudent.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#2B2438] truncate">
                {selectedStudent.displayName || selectedStudent.name}
              </div>
              <div className="text-xs text-[#8A7FA3] truncate flex items-center gap-2">
                <span className="font-mono text-[#2B2438]">{selectedStudent.rollNumber}</span>
                {selectedStudent.college && (
                  <>
                    <span className="text-[#E0D4F7]">•</span>
                    <span>{selectedStudent.college}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-[#8A7FA3] hover:text-[#E74C3C] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs shrink-0"
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
            className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl pl-10 pr-4 py-3 text-[#2B2438] placeholder-[#8A7FA3] focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] text-xs transition-all shadow-xs"
          />
          <span className="absolute left-3.5 top-3.5 text-[#8A7FA3]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {isOpen && (
            <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-[#E0D4F7] rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
              {filteredCandidates.length === 0 ? (
                <div className="text-[#8A7FA3] text-xs py-4 text-center italic">
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
                          ? 'opacity-40 cursor-not-allowed bg-[#FAF8FE] text-[#8A7FA3]'
                          : 'hover:bg-[#FAF8FE] text-[#2B2438]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF8FE] border border-[#E0D4F7] text-[#7C4DFF] font-bold text-xs flex items-center justify-center shrink-0">
                          {(student.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-[#2B2438] truncate">
                            {student.displayName || student.name}
                          </div>
                          <div className="text-[11px] text-[#8A7FA3] truncate">
                            <span className="font-mono">{student.rollNumber}</span>
                            {student.college ? ` • ${student.college}` : ''}
                          </div>
                        </div>
                      </div>
                      {isAlreadyOther ? (
                        <span className="text-[10px] text-[#8A7FA3] font-mono italic">Selected</span>
                      ) : (
                        <span className="text-[#7C4DFF] font-semibold text-[11px]">Select →</span>
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

// Compute aggregate metrics for a collection of students (College Comparison)
function computeCollegeStats(students) {
  if (!students || students.length === 0) {
    return {
      count: 0,
      avgComposite: 0,
      totalLeetcode: 0,
      avgLeetcode: 0,
      maxCodeforces: 0,
      avgCodeforces: 0,
      totalGfg: 0,
      avgGfg: 0,
      maxCodechef: 0,
      avgCodechef: 0,
      totalRepos: 0,
      avgRepos: 0,
      topStudents: [],
    };
  }

  const count = students.length;
  let sumComposite = 0;
  let sumLeetcode = 0;
  let sumCodeforces = 0;
  let countCodeforces = 0;
  let maxCodeforces = 0;
  let sumGfg = 0;
  let sumCodechef = 0;
  let countCodechef = 0;
  let maxCodechef = 0;
  let sumRepos = 0;

  students.forEach((s) => {
    sumComposite += Number(s.compositeScore || 0);

    const lc = Number(s.stats?.leetcode?.totalSolved || 0);
    sumLeetcode += lc;

    const cf = Number(s.stats?.codeforces?.rating || 0);
    if (cf > 0) {
      sumCodeforces += cf;
      countCodeforces++;
      if (cf > maxCodeforces) maxCodeforces = cf;
    }

    const gfg = Number(
      s.stats?.gfg?.codingScore !== undefined
        ? s.stats?.gfg?.codingScore
        : s.stats?.gfg?.score || s.stats?.gfg?.problemsSolved || 0
    );
    sumGfg += gfg;

    const cc = Number(s.stats?.codechef?.rating || 0);
    if (cc > 0) {
      sumCodechef += cc;
      countCodechef++;
      if (cc > maxCodechef) maxCodechef = cc;
    }

    const repos = Number(s.stats?.github?.publicRepos || s.stats?.github?.repoCount || 0);
    sumRepos += repos;
  });

  const sortedByScore = [...students].sort(
    (a, b) => Number(b.compositeScore || 0) - Number(a.compositeScore || 0)
  );

  return {
    count,
    avgComposite: Number((sumComposite / count).toFixed(1)),
    totalLeetcode: sumLeetcode,
    avgLeetcode: Number((sumLeetcode / count).toFixed(1)),
    maxCodeforces,
    avgCodeforces: countCodeforces > 0 ? Number((sumCodeforces / countCodeforces).toFixed(1)) : 0,
    totalGfg: sumGfg,
    avgGfg: Number((sumGfg / count).toFixed(1)),
    maxCodechef,
    avgCodechef: countCodechef > 0 ? Number((sumCodechef / countCodechef).toFixed(1)) : 0,
    totalRepos: sumRepos,
    avgRepos: Number((sumRepos / count).toFixed(1)),
    topStudents: sortedByScore.slice(0, 3),
  };
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'student' | 'college'
  const mode = searchParams.get('mode') === 'college' ? 'college' : 'student';

  // Student mode params
  const studentAId = searchParams.get('a') || '';
  const studentBId = searchParams.get('b') || '';

  // College mode params
  const collegeA = searchParams.get('colA') || '';
  const collegeB = searchParams.get('colB') || '';
  const selectedBranch = searchParams.get('branch') || ''; // optional

  const [allStudents, setAllStudents] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState(null);

  // Fetch student directory list
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

  // Distinct Colleges and Branches
  const distinctColleges = useMemo(() => {
    const set = new Set();
    allStudents.forEach((s) => {
      if (s.college && s.college.trim()) set.add(s.college.trim());
    });
    return Array.from(set).sort();
  }, [allStudents]);

  const distinctBranches = useMemo(() => {
    const set = new Set();
    allStudents.forEach((s) => {
      if (s.branch && s.branch.trim()) set.add(s.branch.trim());
    });
    return Array.from(set).sort();
  }, [allStudents]);

  // Fetch student comparison data when in student mode and both IDs are set
  useEffect(() => {
    if (mode !== 'student') return;

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
  }, [mode, studentAId, studentBId]);

  // Mode switcher handler
  const handleModeChange = (newMode) => {
    const next = new URLSearchParams();
    next.set('mode', newMode);
    if (newMode === 'student') {
      if (studentAId) next.set('a', studentAId);
      if (studentBId) next.set('b', studentBId);
    } else {
      if (collegeA) next.set('colA', collegeA);
      if (collegeB) next.set('colB', collegeB);
      if (selectedBranch) next.set('branch', selectedBranch);
    }
    setSearchParams(next, { replace: true });
  };

  // Student mode handlers
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

  const handleSwapStudents = () => {
    if (!studentAId && !studentBId) return;
    const next = new URLSearchParams(searchParams);
    if (studentBId) next.set('a', studentBId);
    else next.delete('a');
    if (studentAId) next.set('b', studentAId);
    else next.delete('b');
    setSearchParams(next, { replace: true });
  };

  // College mode handlers
  const handleSelectCollegeA = (c) => {
    const next = new URLSearchParams(searchParams);
    if (c) next.set('colA', c);
    else next.delete('colA');
    setSearchParams(next, { replace: true });
  };

  const handleSelectCollegeB = (c) => {
    const next = new URLSearchParams(searchParams);
    if (c) next.set('colB', c);
    else next.delete('colB');
    setSearchParams(next, { replace: true });
  };

  const handleSelectBranch = (b) => {
    const next = new URLSearchParams(searchParams);
    if (b && b !== 'ALL') next.set('branch', b);
    else next.delete('branch');
    setSearchParams(next, { replace: true });
  };

  const handleSwapColleges = () => {
    if (!collegeA && !collegeB) return;
    const next = new URLSearchParams(searchParams);
    if (collegeB) next.set('colA', collegeB);
    else next.delete('colA');
    if (collegeA) next.set('colB', collegeA);
    else next.delete('colB');
    setSearchParams(next, { replace: true });
  };

  const studentA =
    comparisonData?.studentA || allStudents.find((s) => s._id === studentAId) || null;
  const studentB =
    comparisonData?.studentB || allStudents.find((s) => s._id === studentBId) || null;

  // Student metrics calculations
  const studentMetricsComparison = useMemo(() => {
    if (!comparisonData?.studentA || !comparisonData?.studentB) return null;

    const a = comparisonData.studentA;
    const b = comparisonData.studentB;

    const hasLeetcodeA = Boolean(a.leetcodeUsername && a.stats?.leetcode);
    const hasLeetcodeB = Boolean(b.leetcodeUsername && b.stats?.leetcode);
    const leetcodeComparable = hasLeetcodeA && hasLeetcodeB;
    const leetcodeA = hasLeetcodeA ? a.stats?.leetcode?.totalSolved || 0 : null;
    const leetcodeB = hasLeetcodeB ? b.stats?.leetcode?.totalSolved || 0 : null;

    const hasCodeforcesA = Boolean(a.codeforcesUsername && a.stats?.codeforces);
    const hasCodeforcesB = Boolean(b.codeforcesUsername && b.stats?.codeforces);
    const codeforcesComparable = hasCodeforcesA && hasCodeforcesB;
    const codeforcesA = hasCodeforcesA ? a.stats?.codeforces?.rating || 0 : null;
    const codeforcesB = hasCodeforcesB ? b.stats?.codeforces?.rating || 0 : null;

    const hasGfgA = Boolean(a.gfgUsername && a.stats?.gfg);
    const hasGfgB = Boolean(b.gfgUsername && b.stats?.gfg);
    const gfgComparable = hasGfgA && hasGfgB;
    const gfgA = hasGfgA
      ? a.stats?.gfg?.codingScore !== undefined
        ? a.stats?.gfg?.codingScore
        : a.stats?.gfg?.score || 0
      : null;
    const gfgB = hasGfgB
      ? b.stats?.gfg?.codingScore !== undefined
        ? b.stats?.gfg?.codingScore
        : b.stats?.gfg?.score || 0
      : null;

    const hasCodechefA = Boolean(a.codechefUsername && a.stats?.codechef);
    const hasCodechefB = Boolean(b.codechefUsername && b.stats?.codechef);
    const codechefComparable = hasCodechefA && hasCodechefB;
    const codechefA = hasCodechefA ? a.stats?.codechef?.rating || 0 : null;
    const codechefB = hasCodechefB ? b.stats?.codechef?.rating || 0 : null;

    const hasGithubA = Boolean(a.githubUsername && a.stats?.github);
    const hasGithubB = Boolean(b.githubUsername && b.stats?.github);
    const githubReposComparable = hasGithubA && hasGithubB;
    const githubReposA = hasGithubA
      ? a.stats?.github?.repoCount || a.stats?.github?.publicRepos || 0
      : null;
    const githubReposB = hasGithubB
      ? b.stats?.github?.repoCount || b.stats?.github?.publicRepos || 0
      : null;

    const githubFollowersComparable = hasGithubA && hasGithubB;
    const githubFollowersA = hasGithubA ? a.stats?.github?.followers || 0 : null;
    const githubFollowersB = hasGithubB ? b.stats?.github?.followers || 0 : null;

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

    const rows = [
      {
        id: 'composite',
        label: 'Composite Score',
        isMainScore: true,
        valA: compositeScoreA,
        valB: compositeScoreB,
        comparable: includedMetrics.length > 0,
        subtext:
          includedMetrics.length > 0
            ? `Fair head-to-head score based on: ${includedMetrics.join(', ')}`
            : 'No mutually tracked platforms',
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

    let winner = null;
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

  // College filtering and aggregate stats
  const studentsInCollegeA = useMemo(() => {
    if (!collegeA) return [];
    return allStudents.filter((s) => {
      const matchCollege =
        (s.college || '').trim().toLowerCase() === collegeA.trim().toLowerCase();
      const matchBranch =
        !selectedBranch ||
        selectedBranch === 'ALL' ||
        (s.branch || '').trim().toLowerCase() === selectedBranch.trim().toLowerCase();
      return matchCollege && matchBranch;
    });
  }, [allStudents, collegeA, selectedBranch]);

  const studentsInCollegeB = useMemo(() => {
    if (!collegeB) return [];
    return allStudents.filter((s) => {
      const matchCollege =
        (s.college || '').trim().toLowerCase() === collegeB.trim().toLowerCase();
      const matchBranch =
        !selectedBranch ||
        selectedBranch === 'ALL' ||
        (s.branch || '').trim().toLowerCase() === selectedBranch.trim().toLowerCase();
      return matchCollege && matchBranch;
    });
  }, [allStudents, collegeB, selectedBranch]);

  const statsCollegeA = useMemo(
    () => computeCollegeStats(studentsInCollegeA),
    [studentsInCollegeA]
  );
  const statsCollegeB = useMemo(
    () => computeCollegeStats(studentsInCollegeB),
    [studentsInCollegeB]
  );

  const collegeMetricsComparison = useMemo(() => {
    if (!collegeA || !collegeB) return null;

    const diffComposite = Number(
      Math.abs(statsCollegeA.avgComposite - statsCollegeB.avgComposite).toFixed(1)
    );
    let winner = 'TIED';
    if (statsCollegeA.avgComposite > statsCollegeB.avgComposite) winner = 'A';
    else if (statsCollegeB.avgComposite > statsCollegeA.avgComposite) winner = 'B';

    const rows = [
      {
        id: 'avg_composite',
        label: 'Avg Composite Score',
        isMainScore: true,
        valA: statsCollegeA.avgComposite,
        valB: statsCollegeB.avgComposite,
        comparable: true,
        unit: 'pts',
        subtext: 'Mean overall performance score per student',
      },
      {
        id: 'students_count',
        label: 'Enrolled Students',
        valA: statsCollegeA.count,
        valB: statsCollegeB.count,
        comparable: true,
        unit: 'students',
        subtext: selectedBranch ? `Filtered by ${selectedBranch} branch` : 'Total registered cohort',
      },
      {
        id: 'avg_leetcode',
        label: 'Avg LeetCode Solved',
        valA: statsCollegeA.avgLeetcode,
        valB: statsCollegeB.avgLeetcode,
        comparable: true,
        unit: 'problems',
        subtext: `Total: ${statsCollegeA.totalLeetcode} vs ${statsCollegeB.totalLeetcode} solved`,
      },
      {
        id: 'max_codeforces',
        label: 'Highest Codeforces Rating',
        valA: statsCollegeA.maxCodeforces,
        valB: statsCollegeB.maxCodeforces,
        comparable: true,
        unit: 'rating',
        subtext: `Avg: ${statsCollegeA.avgCodeforces} vs ${statsCollegeB.avgCodeforces}`,
      },
      {
        id: 'avg_gfg',
        label: 'Avg GFG Score / Solved',
        valA: statsCollegeA.avgGfg,
        valB: statsCollegeB.avgGfg,
        comparable: true,
        unit: 'pts',
        subtext: `Total: ${statsCollegeA.totalGfg} vs ${statsCollegeB.totalGfg} pts`,
      },
      {
        id: 'max_codechef',
        label: 'Highest CodeChef Rating',
        valA: statsCollegeA.maxCodechef,
        valB: statsCollegeB.maxCodechef,
        comparable: true,
        unit: 'rating',
        subtext: `Avg: ${statsCollegeA.avgCodechef} vs ${statsCollegeB.avgCodechef}`,
      },
      {
        id: 'avg_repos',
        label: 'Avg GitHub Repos',
        valA: statsCollegeA.avgRepos,
        valB: statsCollegeB.avgRepos,
        comparable: true,
        unit: 'repos',
        subtext: `Total: ${statsCollegeA.totalRepos} vs ${statsCollegeB.totalRepos} repos`,
      },
    ];

    return {
      winner,
      diff: diffComposite,
      rows,
    };
  }, [collegeA, collegeB, statsCollegeA, statsCollegeB, selectedBranch]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header & Mode Switcher */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#2B2438] flex items-center gap-2.5">
            <span>⚔️</span>
            <span>{mode === 'student' ? 'Student Comparison' : 'College vs College Comparison'}</span>
          </h1>
          <p className="text-[#8A7FA3] text-sm">
            {mode === 'student'
              ? 'Compare coding handles, platform ratings, and repositories side by side between any two students.'
              : 'Benchmark aggregate coding metrics, average composite scores, and top performers across colleges.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-white border border-[#E0D4F7] self-start sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => handleModeChange('student')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'student'
                ? 'bg-[#7C4DFF] text-white shadow-sm shadow-[#7C4DFF]/25'
                : 'text-[#8A7FA3] hover:text-[#2B2438]'
            }`}
          >
            <span>Student vs Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('college')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'college'
                ? 'bg-[#7C4DFF] text-white shadow-sm shadow-[#7C4DFF]/25'
                : 'text-[#8A7FA3] hover:text-[#2B2438]'
            }`}
          >
            <span>College vs College</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. STUDENT VS STUDENT COMPARISON MODE                                     */}
      {/* ========================================================================= */}
      {mode === 'student' && (
        <>
          {/* Selector Control Bar */}
          <section className="bg-white border border-[#E0D4F7] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
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
                  onClick={handleSwapStudents}
                  disabled={!studentAId && !studentBId}
                  title="Swap Student A and Student B"
                  className="p-3 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] text-[#8A7FA3] hover:text-[#7C4DFF] hover:border-[#7C4DFF] transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed group flex items-center gap-1.5 text-xs font-semibold"
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

            {/* Informational Selection Prompt */}
            {(!studentAId || !studentBId) && (
              <div className="text-center pt-2 text-xs text-[#7C4DFF] font-medium">
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
            <div className="bg-white border border-[#E0D4F7] rounded-3xl p-12 text-center space-y-4 shadow-sm animate-pulse">
              <div className="w-10 h-10 border-4 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-[#8A7FA3] font-semibold text-sm">
                Fetching & comparing latest metrics...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loadingComparison && (
            <div className="bg-[#F39C12]/10 border border-[#F39C12]/30 rounded-3xl p-6 text-center space-y-2">
              <div className="text-[#D97706] font-bold text-sm">Comparison Notice</div>
              <div className="text-[#8A7FA3] text-xs">{error}</div>
            </div>
          )}

          {/* Empty Selection State */}
          {!loadingComparison && (!studentAId || !studentBId) && (
            <div className="bg-white border border-[#E0D4F7] rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] text-[#7C4DFF] flex items-center justify-center text-2xl mx-auto shadow-inner font-extrabold">
                ⚔️
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-[#2B2438]">Ready for Head-to-Head</h3>
                <p className="text-[#8A7FA3] text-xs leading-relaxed">
                  Compare LeetCode problem solving, Codeforces contest performance, GFG, CodeChef, and GitHub contributions between any two students.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] font-semibold text-xs rounded-xl border border-[#E0D4F7] transition-colors shadow-xs"
                >
                  ← Browse Student Directory
                </Link>
              </div>
            </div>
          )}

          {/* Comparison Results Layout */}
          {!loadingComparison && comparisonData && studentMetricsComparison && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Overall Composite Score Headline Banner */}
              <div className="relative overflow-hidden bg-white border border-[#E0D4F7] rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-[#7C4DFF]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  {/* Student A Score */}
                  <div className="text-center md:text-left space-y-1 flex-1">
                    <div className="text-xs font-semibold text-[#7C4DFF] uppercase tracking-wider">
                      Student A Score
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-[#2B2438] font-mono">
                      {studentMetricsComparison.compositeScoreA}{' '}
                      <span className="text-xs font-normal text-[#8A7FA3]">pts</span>
                    </div>
                    <div className="text-xs font-medium text-[#8A7FA3] truncate max-w-xs">
                      {comparisonData.studentA.displayName || comparisonData.studentA.name}
                    </div>
                  </div>

                  {/* Central Winner Verdict Badge */}
                  <div className="text-center px-4 py-3 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] shadow-xs space-y-1 min-w-60">
                    <div className="text-xs uppercase tracking-wider font-mono text-[#8A7FA3]">
                      Head-to-Head Verdict
                    </div>
                    <div className="text-base font-extrabold flex items-center justify-center gap-1.5">
                      {studentMetricsComparison.winner === 'A' ? (
                        <span className="text-[#27AE60]">
                          {comparisonData.studentA.name} leads by +{studentMetricsComparison.diff} pts
                        </span>
                      ) : studentMetricsComparison.winner === 'B' ? (
                        <span className="text-[#27AE60]">
                          {comparisonData.studentB.name} leads by +{studentMetricsComparison.diff} pts
                        </span>
                      ) : studentMetricsComparison.winner === 'TIED' ? (
                        <span className="text-[#D97706]">
                          Tied ({studentMetricsComparison.compositeScoreA} pts each)
                        </span>
                      ) : (
                        <span className="text-[#8A7FA3]">No overlapping platform data</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8A7FA3] font-mono">
                      {studentMetricsComparison.includedMetrics.length > 0
                        ? `Compared: ${studentMetricsComparison.includedMetrics.join(', ')}`
                        : 'Excluded platforms without handles for both students'}
                    </div>
                  </div>

                  {/* Student B Score */}
                  <div className="text-center md:text-right space-y-1 flex-1">
                    <div className="text-xs font-semibold text-[#8E5CF7] uppercase tracking-wider">
                      Student B Score
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-[#2B2438] font-mono">
                      {studentMetricsComparison.compositeScoreB}{' '}
                      <span className="text-xs font-normal text-[#8A7FA3]">pts</span>
                    </div>
                    <div className="text-xs font-medium text-[#8A7FA3] truncate max-w-xs ml-auto">
                      {comparisonData.studentB.displayName || comparisonData.studentB.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="bg-white border border-[#E0D4F7] rounded-3xl shadow-sm overflow-hidden">
                {/* Table Header Row with Student Information */}
                <div className="grid grid-cols-11 border-b border-[#E0D4F7] bg-[#FAF8FE] p-4 md:p-6 items-center">
                  {/* Student A Header Card */}
                  <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C4DFF] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#7C4DFF]/25">
                      {(comparisonData.studentA.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-bold text-[#2B2438] truncate">
                          {comparisonData.studentA.displayName || comparisonData.studentA.name}
                        </h2>
                        {studentMetricsComparison.winner === 'A' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#27AE60]/12 text-[#27AE60] border border-[#27AE60]/30 font-semibold shrink-0">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8A7FA3] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-[#2B2438]">{comparisonData.studentA.rollNumber}</span>
                        {comparisonData.studentA.college && <span>• {comparisonData.studentA.college}</span>}
                        {(comparisonData.studentA.branch || comparisonData.studentA.section) && (
                          <span className="text-[#7C4DFF] font-mono text-[11px]">
                            • {[comparisonData.studentA.branch, comparisonData.studentA.section ? `Sec ${comparisonData.studentA.section}` : null].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/dashboard/${comparisonData.studentA._id}`}
                          className="text-[11px] text-[#7C4DFF] hover:text-[#6C3CE9] font-semibold inline-flex items-center gap-1"
                        >
                          View Dashboard →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Center VS Divider */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E0D4F7] text-[#7C4DFF] font-black text-xs flex items-center justify-center shadow-xs">
                      VS
                    </div>
                  </div>

                  {/* Student B Header Card */}
                  <div className="col-span-5 flex items-center justify-end text-right gap-3.5 min-w-0">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center justify-end gap-2">
                        {studentMetricsComparison.winner === 'B' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#27AE60]/12 text-[#27AE60] border border-[#27AE60]/30 font-semibold shrink-0">
                            Winner
                          </span>
                        )}
                        <h2 className="text-base md:text-lg font-bold text-[#2B2438] truncate">
                          {comparisonData.studentB.displayName || comparisonData.studentB.name}
                        </h2>
                      </div>
                      <div className="text-xs text-[#8A7FA3] flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
                        {(comparisonData.studentB.branch || comparisonData.studentB.section) && (
                          <span className="text-[#8E5CF7] font-mono text-[11px]">
                            {[comparisonData.studentB.branch, comparisonData.studentB.section ? `Sec ${comparisonData.studentB.section}` : null].filter(Boolean).join(' ')} •
                          </span>
                        )}
                        {comparisonData.studentB.college && <span>{comparisonData.studentB.college} •</span>}
                        <span className="font-mono text-[#2B2438]">{comparisonData.studentB.rollNumber}</span>
                      </div>
                      <div>
                        <Link
                          to={`/dashboard/${comparisonData.studentB._id}`}
                          className="text-[11px] text-[#7C4DFF] hover:text-[#6C3CE9] font-semibold inline-flex items-center gap-1"
                        >
                          View Dashboard →
                        </Link>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-[#8E5CF7] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#8E5CF7]/25">
                      {(comparisonData.studentB.name || 'B').charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Metric Comparison Rows */}
                <div className="divide-y divide-[#E0D4F7]/60">
                  {studentMetricsComparison.rows.map((row) => {
                    const { id, label, valA, valB, comparable, unit, isMainScore, subtext } = row;

                    const isMissingA = valA === null || valA === undefined;
                    const isMissingB = valB === null || valB === undefined;

                    const isWinA = comparable && !isMissingA && !isMissingB && valA > valB;
                    const isWinB = comparable && !isMissingA && !isMissingB && valB > valA;
                    const isTie = comparable && !isMissingA && !isMissingB && valA === valB;

                    const diffValue =
                      comparable && !isMissingA && !isMissingB ? Math.abs(valA - valB) : 0;
                    const diffFormatted = Number.isInteger(diffValue)
                      ? diffValue
                      : diffValue.toFixed(1);

                    return (
                      <div
                        key={id}
                        className={`grid grid-cols-11 p-4 md:px-6 md:py-4 items-center transition-colors ${
                          isMainScore ? 'bg-[#FAF8FE]' : 'hover:bg-[#FAF8FE]/50'
                        }`}
                      >
                        {/* Student A Metric Column */}
                        <div
                          className={`col-span-4 p-3 rounded-2xl flex items-center justify-between transition-all ${
                            isWinA
                              ? 'bg-[#27AE60]/12 border border-[#27AE60]/30 text-[#27AE60]'
                              : 'text-[#2B2438]'
                          }`}
                        >
                          <div>
                            {isMissingA ? (
                              <span className="text-xs font-mono text-[#8A7FA3] italic">No data</span>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span
                                  className={`text-base md:text-lg font-mono font-bold ${
                                    isWinA ? 'text-[#27AE60]' : 'text-[#2B2438]'
                                  }`}
                                >
                                  {valA}
                                </span>
                                {unit && <span className="text-[11px] text-[#8A7FA3]">{unit}</span>}
                              </div>
                            )}
                          </div>

                          {isWinA && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/40">
                              +{diffFormatted}
                            </span>
                          )}
                          {isTie && !isMissingA && !isMissingB && (
                            <span className="text-[10px] font-mono text-[#8A7FA3]">Tied</span>
                          )}
                        </div>

                        {/* Central Metric Label */}
                        <div className="col-span-3 text-center px-2 space-y-0.5">
                          <div
                            className={`text-xs font-bold ${
                              isMainScore ? 'text-[#7C4DFF]' : 'text-[#2B2438]'
                            }`}
                          >
                            {label}
                          </div>
                          {subtext && <div className="text-[10px] text-[#8A7FA3]">{subtext}</div>}
                          {!comparable && (
                            <div className="text-[10px] text-[#D97706] font-mono">
                              ⚠️ Excluded (missing data)
                            </div>
                          )}
                        </div>

                        {/* Student B Metric Column */}
                        <div
                          className={`col-span-4 p-3 rounded-2xl flex items-center justify-between text-right transition-all ${
                            isWinB
                              ? 'bg-[#27AE60]/12 border border-[#27AE60]/30 text-[#27AE60]'
                              : 'text-[#2B2438]'
                          }`}
                        >
                          <div>
                            {isWinB && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/40">
                                +{diffFormatted}
                              </span>
                            )}
                            {isTie && !isMissingA && !isMissingB && (
                              <span className="text-[10px] font-mono text-[#8A7FA3]">Tied</span>
                            )}
                          </div>

                          <div>
                            {isMissingB ? (
                              <span className="text-xs font-mono text-[#8A7FA3] italic">No data</span>
                            ) : (
                              <div className="flex items-baseline justify-end gap-1">
                                <span
                                  className={`text-base md:text-lg font-mono font-bold ${
                                    isWinB ? 'text-[#27AE60]' : 'text-[#2B2438]'
                                  }`}
                                >
                                  {valB}
                                </span>
                                {unit && <span className="text-[11px] text-[#8A7FA3]">{unit}</span>}
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. COLLEGE VS COLLEGE COMPARISON MODE                                     */}
      {/* ========================================================================= */}
      {mode === 'college' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* College & Optional Branch Selector Bar */}
          <section className="bg-white border border-[#E0D4F7] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
              {/* College A Dropdown */}
              <div className="md:col-span-4 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7C4DFF]">
                  College A
                </label>
                <select
                  value={collegeA}
                  onChange={(e) => handleSelectCollegeA(e.target.value)}
                  className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl px-4 py-3 text-[#2B2438] font-semibold text-xs focus:outline-none focus:border-[#7C4DFF] cursor-pointer shadow-xs"
                >
                  <option value="">Select College A...</option>
                  {distinctColleges.map((c) => (
                    <option key={c} value={c} disabled={c === collegeB}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex items-center justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwapColleges}
                  disabled={!collegeA && !collegeB}
                  title="Swap Colleges"
                  className="p-3 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] text-[#8A7FA3] hover:text-[#7C4DFF] hover:border-[#7C4DFF] transition-all cursor-pointer shadow-xs disabled:opacity-40 group flex items-center justify-center gap-1.5 text-xs font-semibold w-full md:w-auto"
                >
                  <span className="text-base group-hover:rotate-180 transition-transform duration-300">
                    ⇄
                  </span>
                  <span className="md:hidden">Swap</span>
                </button>
              </div>

              {/* College B Dropdown */}
              <div className="md:col-span-4 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8E5CF7]">
                  College B
                </label>
                <select
                  value={collegeB}
                  onChange={(e) => handleSelectCollegeB(e.target.value)}
                  className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl px-4 py-3 text-[#2B2438] font-semibold text-xs focus:outline-none focus:border-[#7C4DFF] cursor-pointer shadow-xs"
                >
                  <option value="">Select College B...</option>
                  {distinctColleges.map((c) => (
                    <option key={c} value={c} disabled={c === collegeA}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Branch Filter Dropdown */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8A7FA3]">
                    Branch
                  </label>
                  <span className="text-[10px] text-[#7C4DFF] font-mono font-normal">Optional</span>
                </div>
                <select
                  value={selectedBranch || 'ALL'}
                  onChange={(e) => handleSelectBranch(e.target.value)}
                  className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl px-3.5 py-3 text-[#8A7FA3] text-xs font-medium focus:outline-none focus:border-[#7C4DFF] cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Branches</option>
                  {distinctBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selection Guidance */}
            {(!collegeA || !collegeB) && (
              <div className="text-center pt-2 text-xs text-[#7C4DFF] font-medium">
                {!collegeA && !collegeB
                  ? 'Select College A and College B above to benchmark their cohorts.'
                  : !collegeA
                  ? 'Now select College A to complete the matchup.'
                  : 'Now select College B to complete the matchup.'}
              </div>
            )}
          </section>

          {/* Empty Selection State */}
          {(!collegeA || !collegeB) && (
            <div className="bg-white border border-[#E0D4F7] rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] text-[#7C4DFF] flex items-center justify-center text-2xl mx-auto shadow-inner font-extrabold">
                ⚔️
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-[#2B2438]">Institutional Head-to-Head</h3>
                <p className="text-[#8A7FA3] text-xs leading-relaxed">
                  Compare two universities or colleges on average composite score, LeetCode problem solving, Codeforces ratings, and top student rankings. You can optionally filter by specific branch.
                </p>
              </div>
            </div>
          )}

          {/* College Comparison Results Layout */}
          {collegeA && collegeB && collegeMetricsComparison && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Overall Headline Banner */}
              <div className="relative overflow-hidden bg-white border border-[#E0D4F7] rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-[#7C4DFF]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  {/* College A Score */}
                  <div className="text-center md:text-left space-y-1 flex-1">
                    <div className="text-xs font-semibold text-[#7C4DFF] uppercase tracking-wider">
                      {collegeA}
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-[#2B2438] font-mono">
                      {statsCollegeA.avgComposite}{' '}
                      <span className="text-xs font-normal text-[#8A7FA3]">avg pts</span>
                    </div>
                    <div className="text-xs text-[#8A7FA3]">
                      Cohort: {statsCollegeA.count} student{statsCollegeA.count === 1 ? '' : 's'}
                      {selectedBranch ? ` • ${selectedBranch}` : ''}
                    </div>
                  </div>

                  {/* Central Winner Verdict Badge */}
                  <div className="text-center px-5 py-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E0D4F7] shadow-xs space-y-1 min-w-65">
                    <div className="text-xs uppercase tracking-wider font-mono text-[#8A7FA3]">
                      College Matchup Verdict
                    </div>
                    <div className="text-base font-extrabold flex items-center justify-center gap-1.5">
                      {collegeMetricsComparison.winner === 'A' ? (
                        <span className="text-[#27AE60]">
                          {collegeA} leads by +{collegeMetricsComparison.diff} avg pts
                        </span>
                      ) : collegeMetricsComparison.winner === 'B' ? (
                        <span className="text-[#27AE60]">
                          {collegeB} leads by +{collegeMetricsComparison.diff} avg pts
                        </span>
                      ) : (
                        <span className="text-[#D97706]">
                          Tied ({statsCollegeA.avgComposite} avg pts each)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8A7FA3] font-mono">
                      {selectedBranch ? `Filtered by Branch: ${selectedBranch}` : 'All Registered Branches Combined'}
                    </div>
                  </div>

                  {/* College B Score */}
                  <div className="text-center md:text-right space-y-1 flex-1">
                    <div className="text-xs font-semibold text-[#8E5CF7] uppercase tracking-wider">
                      {collegeB}
                    </div>
                    <div className="text-3xl md:text-4xl font-extrabold text-[#2B2438] font-mono">
                      {statsCollegeB.avgComposite}{' '}
                      <span className="text-xs font-normal text-[#8A7FA3]">avg pts</span>
                    </div>
                    <div className="text-xs text-[#8A7FA3]">
                      Cohort: {statsCollegeB.count} student{statsCollegeB.count === 1 ? '' : 's'}
                      {selectedBranch ? ` • ${selectedBranch}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side College Metric Comparison Table */}
              <div className="bg-white border border-[#E0D4F7] rounded-3xl shadow-sm overflow-hidden">
                {/* Table Header Row */}
                <div className="grid grid-cols-11 border-b border-[#E0D4F7] bg-[#FAF8FE] p-4 md:p-6 items-center">
                  {/* College A Header */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C4DFF] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#7C4DFF]/25">
                      A
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-bold text-[#2B2438] truncate">
                          {collegeA}
                        </h2>
                        {collegeMetricsComparison.winner === 'A' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#27AE60]/12 text-[#27AE60] border border-[#27AE60]/30 font-semibold shrink-0">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8A7FA3] font-mono">
                        {statsCollegeA.count} Registered Student(s)
                      </div>
                    </div>
                  </div>

                  {/* Center VS */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E0D4F7] text-[#7C4DFF] font-black text-xs flex items-center justify-center shadow-xs">
                      VS
                    </div>
                  </div>

                  {/* College B Header */}
                  <div className="col-span-5 flex items-center justify-end text-right gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center justify-end gap-2">
                        {collegeMetricsComparison.winner === 'B' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#27AE60]/12 text-[#27AE60] border border-[#27AE60]/30 font-semibold shrink-0">
                            Winner
                          </span>
                        )}
                        <h2 className="text-base md:text-lg font-bold text-[#2B2438] truncate">
                          {collegeB}
                        </h2>
                      </div>
                      <div className="text-xs text-[#8A7FA3] font-mono">
                        {statsCollegeB.count} Registered Student(s)
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-[#8E5CF7] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-[#8E5CF7]/25">
                      B
                    </div>
                  </div>
                </div>

                {/* Metric Rows */}
                <div className="divide-y divide-[#E0D4F7]/60">
                  {collegeMetricsComparison.rows.map((row) => {
                    const { id, label, valA, valB, unit, isMainScore, subtext } = row;

                    const isWinA = valA > valB;
                    const isWinB = valB > valA;
                    const isTie = valA === valB;

                    const diffValue = Math.abs(valA - valB);
                    const diffFormatted = Number.isInteger(diffValue)
                      ? diffValue
                      : diffValue.toFixed(1);

                    return (
                      <div
                        key={id}
                        className={`grid grid-cols-11 p-4 md:px-6 md:py-4 items-center transition-colors ${
                          isMainScore ? 'bg-[#FAF8FE]' : 'hover:bg-[#FAF8FE]/50'
                        }`}
                      >
                        {/* College A Metric Column */}
                        <div
                          className={`col-span-4 p-3 rounded-2xl flex items-center justify-between transition-all ${
                            isWinA
                              ? 'bg-[#27AE60]/12 border border-[#27AE60]/30 text-[#27AE60]'
                              : 'text-[#2B2438]'
                          }`}
                        >
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-base md:text-lg font-mono font-bold ${
                                isWinA ? 'text-[#27AE60]' : 'text-[#2B2438]'
                              }`}
                            >
                              {valA}
                            </span>
                            {unit && <span className="text-[11px] text-[#8A7FA3]">{unit}</span>}
                          </div>

                          {isWinA && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/40">
                              +{diffFormatted}
                            </span>
                          )}
                          {isTie && <span className="text-[10px] font-mono text-[#8A7FA3]">Tied</span>}
                        </div>

                        {/* Central Metric Label */}
                        <div className="col-span-3 text-center px-2 space-y-0.5">
                          <div
                            className={`text-xs font-bold ${
                              isMainScore ? 'text-[#7C4DFF]' : 'text-[#2B2438]'
                            }`}
                          >
                            {label}
                          </div>
                          {subtext && <div className="text-[10px] text-[#8A7FA3]">{subtext}</div>}
                        </div>

                        {/* College B Metric Column */}
                        <div
                          className={`col-span-4 p-3 rounded-2xl flex items-center justify-between text-right transition-all ${
                            isWinB
                              ? 'bg-[#27AE60]/12 border border-[#27AE60]/30 text-[#27AE60]'
                              : 'text-[#2B2438]'
                          }`}
                        >
                          <div>
                            {isWinB && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#27AE60]/20 text-[#27AE60] border border-[#27AE60]/40">
                                +{diffFormatted}
                              </span>
                            )}
                            {isTie && <span className="text-[10px] font-mono text-[#8A7FA3]">Tied</span>}
                          </div>

                          <div className="flex items-baseline justify-end gap-1">
                            <span
                              className={`text-base md:text-lg font-mono font-bold ${
                                isWinB ? 'text-[#27AE60]' : 'text-[#2B2438]'
                              }`}
                            >
                              {valB}
                            </span>
                            {unit && <span className="text-[11px] text-[#8A7FA3]">{unit}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Performers by College Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* College A Top Performers */}
                <div className="bg-white border border-[#E0D4F7] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E0D4F7] pb-3">
                    <h3 className="text-sm font-bold text-[#7C4DFF] uppercase tracking-wider flex items-center gap-2">
                      <span>Top Performers in {collegeA}</span>
                    </h3>
                    <span className="text-xs font-mono text-[#8A7FA3]">
                      {statsCollegeA.topStudents.length} Students
                    </span>
                  </div>

                  {statsCollegeA.topStudents.length === 0 ? (
                    <div className="text-[#8A7FA3] text-xs py-4 text-center">
                      No students found in this college matching filter.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {statsCollegeA.topStudents.map((s, idx) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between p-3 bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0]">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <Link
                                to={`/dashboard/${s._id}`}
                                className="text-xs font-bold text-[#2B2438] hover:text-[#7C4DFF] truncate block"
                              >
                                {s.displayName || s.name}
                              </Link>
                              <div className="text-[11px] text-[#8A7FA3] font-mono">
                                {s.rollNumber} {s.branch ? `• ${s.branch}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-extrabold font-mono text-[#27AE60]">
                              {s.compositeScore}
                            </div>
                            <div className="text-[10px] text-[#8A7FA3] uppercase">Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* College B Top Performers */}
                <div className="bg-white border border-[#E0D4F7] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E0D4F7] pb-3">
                    <h3 className="text-sm font-bold text-[#8E5CF7] uppercase tracking-wider flex items-center gap-2">
                      <span>Top Performers in {collegeB}</span>
                    </h3>
                    <span className="text-xs font-mono text-[#8A7FA3]">
                      {statsCollegeB.topStudents.length} Students
                    </span>
                  </div>

                  {statsCollegeB.topStudents.length === 0 ? (
                    <div className="text-[#8A7FA3] text-xs py-4 text-center">
                      No students found in this college matching filter.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {statsCollegeB.topStudents.map((s, idx) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between p-3 bg-[#FAF8FE] border border-[#E0D4F7] rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E8DEFB] text-[#8E5CF7] border border-[#C9B6F0]">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <Link
                                to={`/dashboard/${s._id}`}
                                className="text-xs font-bold text-[#2B2438] hover:text-[#8E5CF7] truncate block"
                              >
                                {s.displayName || s.name}
                              </Link>
                              <div className="text-[11px] text-[#8A7FA3] font-mono">
                                {s.rollNumber} {s.branch ? `• ${s.branch}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-extrabold font-mono text-[#27AE60]">
                              {s.compositeScore}
                            </div>
                            <div className="text-[10px] text-[#8A7FA3] uppercase">Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
