import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PLATFORMS = {
  leetcode: {
    key: 'leetcode',
    name: 'LeetCode',
    field: 'leetcodeUsername',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    hoverBorder: 'hover:border-amber-500/50',
    dotColor: 'bg-amber-400',
    placeholder: 'e.g. neal_wu',
  },
  codeforces: {
    key: 'codeforces',
    name: 'Codeforces',
    field: 'codeforcesUsername',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    hoverBorder: 'hover:border-cyan-500/50',
    dotColor: 'bg-cyan-400',
    placeholder: 'e.g. tourist',
  },
  github: {
    key: 'github',
    name: 'GitHub',
    field: 'githubUsername',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    hoverBorder: 'hover:border-indigo-500/50',
    dotColor: 'bg-indigo-400',
    placeholder: 'e.g. torvalds',
  },
  gfg: {
    key: 'gfg',
    name: 'GeeksforGeeks',
    field: 'gfgUsername',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    hoverBorder: 'hover:border-emerald-500/50',
    dotColor: 'bg-emerald-400',
    placeholder: 'e.g. geeksuser',
  },
  codechef: {
    key: 'codechef',
    name: 'CodeChef',
    field: 'codechefUsername',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    hoverBorder: 'hover:border-orange-500/50',
    dotColor: 'bg-orange-400',
    placeholder: 'e.g. chefuser',
  },
};

export default function Dashboard() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Platform Connector Modal state
  const [activePlatformModal, setActivePlatformModal] = useState(null); // 'leetcode' | 'codeforces' | 'github' | 'gfg' | 'codechef'
  const [modalUsername, setModalUsername] = useState('');
  const [modalError, setModalError] = useState(null);
  const [savingPlatform, setSavingPlatform] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/students/${studentId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Student profile not found');
        throw new Error(`Failed to load student data (Status: ${res.status})`);
      }
      const data = await res.json();
      setStudent(data);
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    const toastId = toast.loading('Fetching latest stats from platforms...');

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`http://localhost:5000/api/students/${studentId}/refresh-stats`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Authentication required. Please log in first.', { id: toastId });
          return;
        }
        if (res.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a minute.', { id: toastId });
          return;
        }
        throw new Error('Failed to refresh stats from external platforms');
      }
      
      const data = await res.json();
      
      if (data.leetcode?.rateLimited || data.codeforces?.rateLimited || data.github?.rateLimited) {
        toast.error('Rate limit exceeded on one or more platforms. Try again in a minute.', { id: toastId });
      } else {
        toast.success('Stats refreshed successfully!', { id: toastId });
      }

      await fetchStudentData();
    } catch (err) {
      toast.error(err.message || 'Error refreshing statistics', { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  const openPlatformModal = (platformKey) => {
    setActivePlatformModal(platformKey);
    setModalUsername(student?.[PLATFORMS[platformKey]?.field] || '');
    setModalError(null);
  };

  const closePlatformModal = () => {
    if (savingPlatform) return;
    setActivePlatformModal(null);
    setModalUsername('');
    setModalError(null);
  };

  const handleSavePlatform = async (e) => {
    if (e) e.preventDefault();
    if (!activePlatformModal) return;

    const platformConfig = PLATFORMS[activePlatformModal];
    if (!platformConfig) return;

    const trimmed = modalUsername.trim();
    if (!trimmed) {
      setModalError(`Please enter a valid ${platformConfig.name} username`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setModalError('Authentication required. Please log in first.');
      return;
    }

    setSavingPlatform(true);
    setModalError(null);

    const previousUsername = student?.[platformConfig.field] || '';

    try {
      // Step 1: Update student username via PUT /api/students/me (single field updated)
      const updateRes = await fetch('http://localhost:5000/api/students/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [platformConfig.field]: trimmed,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.message || `Failed to update ${platformConfig.name} username`);
      }

      // Step 2: Trigger scoped single-platform stats refresh
      const targetStudentId = student._id || updateData._id;
      const refreshRes = await fetch(
        `http://localhost:5000/api/students/${targetStudentId}/refresh-stats?platform=${platformConfig.key}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const refreshData = await refreshRes.json();

      const platformFailed =
        !refreshRes.ok ||
        refreshData.summary?.failed?.some((f) => f.platform === platformConfig.key) ||
        !refreshData[platformConfig.key] ||
        refreshData[platformConfig.key]?.rateLimited;

      if (platformFailed) {
        // Revert username back in DB rather than silently saving a broken username
        try {
          await fetch('http://localhost:5000/api/students/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              [platformConfig.field]: previousUsername,
            }),
          });
        } catch (revertErr) {
          console.error('Revert failed:', revertErr);
        }

        if (refreshData[platformConfig.key]?.rateLimited) {
          setModalError(`${platformConfig.name} API rate limit reached. Please wait a minute and retry.`);
        } else {
          setModalError(`Couldn't find that username on ${platformConfig.name} — check the spelling and try again`);
        }
        setSavingPlatform(false);
        return;
      }

      // Step 3: Replace state with new username and freshly fetched stats without full page reload
      setStudent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [platformConfig.field]: trimmed,
          stats: {
            ...(prev.stats || {}),
            [platformConfig.key]: refreshData[platformConfig.key],
          },
          latestSnapshots: [
            ...(prev.latestSnapshots || []).filter((s) => s.platform !== platformConfig.key),
            ...(refreshData.snapshots || []),
          ],
        };
      });

      closePlatformModal();
      toast.success(`${platformConfig.name} connected`);
    } catch (err) {
      setModalError(err.message || `Failed to connect ${platformConfig.name}`);
    } finally {
      setSavingPlatform(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-100">Unable to Load Dashboard</h2>
        <p className="text-slate-400 text-sm">{error || 'Student not found'}</p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={fetchStudentData}
            className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { stats } = student;
  const leetcode = stats?.leetcode;
  const codeforces = stats?.codeforces;
  const github = stats?.github;

  // Chart 1: Codeforces Rating History Line Chart
  const cfHistory = codeforces?.ratingHistory || [];
  const lineChartData = {
    labels: cfHistory.length > 0 
      ? cfHistory.map((item, idx) => item.contestName ? `#${idx + 1}` : `Contest ${idx + 1}`)
      : ['Initial', 'Current'],
    datasets: [
      {
        label: 'Rating History',
        data: cfHistory.length > 0 ? cfHistory.map((item) => item.newRating) : [1200, codeforces?.rating || 1200],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#0284c7',
        pointRadius: 4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            return cfHistory[idx]?.contestName || `Contest ${idx + 1}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
    },
  };

  // Chart 2: LeetCode Problems Doughnut Chart
  const doughnutData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [leetcode?.easySolved || 0, leetcode?.mediumSolved || 0, leetcode?.hardSolved || 0],
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
        borderWidth: 2,
        borderColor: '#0f172a',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { size: 12 } },
      },
    },
    cutout: '70%',
  };

  // Chart 3: GitHub Overview Bar Chart
  const topRepos = github?.topRepos || [];
  const barData = {
    labels: ['Public Repos', 'Followers', ...topRepos.slice(0, 3).map((r) => r.name)],
    datasets: [
      {
        label: 'Metrics & Stars',
        data: [
          github?.publicRepos || 0,
          github?.followers || 0,
          ...topRepos.slice(0, 3).map((r) => r.stars),
        ],
        backgroundColor: ['#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f87171'],
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">{student.name}</h1>
            <span className="px-3 py-1 text-xs font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-full">
              Roll: {student.rollNumber}
            </span>
            {student.college && (
              <span className="px-3 py-1 text-xs font-medium bg-slate-800 text-slate-300 rounded-full">
                {student.college}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
            <span>
              LeetCode:{' '}
              {student.leetcodeUsername ? (
                <strong className="text-amber-400">{student.leetcodeUsername}</strong>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                  title="Click to add LeetCode username"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              Codeforces:{' '}
              {student.codeforcesUsername ? (
                <strong className="text-cyan-400">{student.codeforcesUsername}</strong>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                  title="Click to add Codeforces username"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              GitHub:{' '}
              {student.githubUsername ? (
                <strong className="text-indigo-400">{student.githubUsername}</strong>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="text-indigo-400/80 hover:text-indigo-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                  title="Click to add GitHub username"
                >
                  Not provided
                </button>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={handleRefreshStats}
          disabled={refreshing}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed w-full md:w-auto"
        >
          {refreshing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Refreshing Stats...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Stats
            </>
          )}
        </button>
      </div>

      {/* Summary Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* LeetCode Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">LeetCode</span>
            <span className="text-xs text-slate-500 font-mono">
              {leetcode?.ranking ? `Ranking #${leetcode.ranking}` : 'N/A'}
            </span>
          </div>
          <div>
            {!student.leetcodeUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-amber-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-400 font-bold">+</span> Add LeetCode Username
                </button>
              </div>
            ) : leetcode?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limit exceeded. Try again in a minute.</div>
            ) : leetcode ? (
              <div className="text-3xl font-extrabold text-slate-100">{leetcode.totalSolved}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh Stats" to fetch</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Total Problems Solved</div>
          </div>
          {leetcode && !leetcode.rateLimited && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs font-mono">
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg">
                <div className="text-emerald-400 font-bold">{leetcode.easySolved}</div>
                <div className="text-slate-400 text-[10px]">Easy</div>
              </div>
              <div className="bg-amber-950/40 border border-amber-800/40 p-2 rounded-lg">
                <div className="text-amber-400 font-bold">{leetcode.mediumSolved}</div>
                <div className="text-slate-400 text-[10px]">Medium</div>
              </div>
              <div className="bg-rose-950/40 border border-rose-800/40 p-2 rounded-lg">
                <div className="text-rose-400 font-bold">{leetcode.hardSolved}</div>
                <div className="text-slate-400 text-[10px]">Hard</div>
              </div>
            </div>
          )}
        </div>

        {/* Codeforces Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Codeforces</span>
            <span className="text-xs text-cyan-300 font-medium capitalize bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
              {codeforces?.rank || 'Unrated'}
            </span>
          </div>
          <div>
            {!student.codeforcesUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-cyan-400 font-bold">+</span> Add Codeforces Username
                </button>
              </div>
            ) : codeforces?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limit exceeded. Try again in a minute.</div>
            ) : codeforces ? (
              <div className="text-3xl font-extrabold text-slate-100">{codeforces.rating}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh Stats" to fetch</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Current Rating</div>
          </div>
          {codeforces && !codeforces.rateLimited && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400">Max Rating:</span>
              <span className="text-cyan-400 font-bold">{codeforces.maxRating}</span>
            </div>
          )}
        </div>

        {/* GitHub Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">GitHub</span>
            <span className="text-xs text-slate-500 font-mono">{github?.followers || 0} Followers</span>
          </div>
          <div>
            {!student.githubUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-indigo-400 font-bold">+</span> Add GitHub Username
                </button>
              </div>
            ) : github?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limit exceeded. Try again in a minute.</div>
            ) : github ? (
              <div className="text-3xl font-extrabold text-slate-100">{github.publicRepos}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh Stats" to fetch</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Public Repositories</div>
          </div>
          {github && !github.rateLimited && (
            <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
              <div className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Top Repositories:</div>
              <div className="flex flex-wrap gap-1.5">
                {(github.topRepos || []).slice(0, 3).map((repo, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded font-mono text-[11px]">
                    {repo.name} ({repo.stars}★)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Practice Problems (this app) */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">In-App IDE</span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              ✓ Solved
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-300">
              {student.problemsSolved || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Practice Problems (this app)</div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            Solved directly inside the integrated online Code IDE.
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Codeforces Line Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 text-sm">Codeforces Rating Trajectory</h3>
            <span className="text-xs text-slate-500 font-mono">
              {cfHistory.length} Contests Evaluated
            </span>
          </div>
          <div className="h-64 relative">
            {codeforces && !codeforces.rateLimited ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                {!student.codeforcesUsername 
                  ? 'No Codeforces username configured for this student' 
                  : codeforces?.rateLimited
                  ? 'Rate limit exceeded. Try again in a minute.'
                  : 'No rating history available. Click "Refresh Stats" above.'}
              </div>
            )}
          </div>
        </div>

        {/* LeetCode Doughnut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">LeetCode Problem Breakdown</h3>
          <div className="h-64 relative flex items-center justify-center">
            {leetcode && !leetcode.rateLimited && leetcode.totalSolved > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-slate-500 text-sm text-center">
                {!student.leetcodeUsername 
                  ? 'No LeetCode username configured' 
                  : leetcode?.rateLimited
                  ? 'Rate limit exceeded. Try again in a minute.'
                  : 'No LeetCode stats recorded'}
              </div>
            )}
          </div>
        </div>

        {/* GitHub Bar Chart */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">GitHub Metrics & Top Repository Stars</h3>
          <div className="h-64 relative">
            {github && !github.rateLimited ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                {!student.githubUsername 
                  ? 'No GitHub username configured for this student' 
                  : github?.rateLimited
                  ? 'Rate limit exceeded. Try again in a minute.'
                  : 'No GitHub statistics available. Click "Refresh Stats" above.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightweight Platform Connector Modal */}
      {activePlatformModal && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePlatformModal();
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${PLATFORMS[activePlatformModal]?.dotColor || 'bg-indigo-400'}`} />
                <h3 className="text-base font-bold text-slate-100">
                  Connect {PLATFORMS[activePlatformModal]?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePlatformModal}
                disabled={savingPlatform}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer disabled:opacity-50 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter your {PLATFORMS[activePlatformModal]?.name} username
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={modalUsername}
                  onChange={(e) => {
                    setModalUsername(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder={PLATFORMS[activePlatformModal]?.placeholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {modalError && (
                  <div className="mt-2.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="shrink-0 text-sm">⚠️</span>
                    <span>{modalError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePlatformModal}
                  disabled={savingPlatform}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlatform}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {savingPlatform ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton loader component
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-pulse">
      <div className="h-28 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-slate-800 rounded" />
          <div className="h-4 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
            <div className="h-4 w-full bg-slate-800/40 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-900 border border-slate-800 rounded-2xl p-6" />
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-2xl p-6" />
      </div>
    </div>
  );
}
