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

    const targetStudentId = student?._id || studentId;

    try {
      // Step 1: Trigger single-platform refresh with the new username
      const refreshRes = await fetch(
        `http://localhost:5000/api/students/${targetStudentId}/refresh-stats?platform=${platformConfig.key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            platform: platformConfig.key,
            username: trimmed,
            [platformConfig.field]: trimmed,
          }),
        }
      );

      const refreshData = await refreshRes.json();

      const platformFailed =
        !refreshRes.ok ||
        refreshData.summary?.failed?.some((f) => f.platform === platformConfig.key) ||
        !refreshData[platformConfig.key] ||
        refreshData[platformConfig.key]?.rateLimited;

      if (platformFailed) {
        let failReason = `Couldn't verify this ${platformConfig.name} username right now. Please check spelling.`;
        const specificFail = refreshData.summary?.failed?.find((f) => f.platform === platformConfig.key)?.reason;
        if (refreshData[platformConfig.key]?.rateLimited) {
          failReason = `${platformConfig.name} API rate limit reached. Please wait a minute before retrying.`;
        } else if (specificFail) {
          failReason = specificFail;
        }
        // Show inline error in modal and keep old stats/username in dashboard intact
        setModalError(failReason);
        setSavingPlatform(false);
        return;
      }

      // Step 2: Fetch succeeded! Commit the new username in database for this student
      const updateRes = await fetch(`http://localhost:5000/api/students/${targetStudentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          [platformConfig.field]: trimmed,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.message || `Failed to save ${platformConfig.name} username in profile`);
      }

      // Also sync user's own profile via /api/students/me
      if (token) {
        try {
          await fetch('http://localhost:5000/api/students/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              [platformConfig.field]: trimmed,
            }),
          });
        } catch (syncErr) {
          // ignore sync err
        }
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

      // Close modal and notify user
      closePlatformModal();
      toast.success(`${platformConfig.name} username updated`);
    } catch (err) {
      setModalError(err.message || `Failed to update ${platformConfig.name} username`);
    } finally {
      setSavingPlatform(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-lg mx-auto shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-100">Student Not Found</h2>
          <p className="text-slate-400 text-sm">{error || 'Unable to retrieve student profile information.'}</p>
          <div className="pt-4">
            <Link
              to="/"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors inline-block"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { stats } = student;
  const leetcode = stats?.leetcode;
  const codeforces = stats?.codeforces;
  const github = stats?.github;
  const gfg = stats?.gfg;
  const codechef = stats?.codechef;

  // Prepare Codeforces Rating Trajectory Line Chart Data
  const cfHistory = codeforces?.ratingHistory || [];
  const lineChartData = {
    labels: cfHistory.map((item) => {
      const date = new Date(item.ratingUpdateTimeSeconds * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Rating',
        data: cfHistory.map((item) => item.newRating),
        borderColor: '#06b6d4', // Cyan
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#0891b2',
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const idx = items[0].dataIndex;
            return cfHistory[idx]?.contestName || items[0].label;
          },
          label: (context) => `Rating: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
    },
  };

  // Prepare LeetCode Breakdown Doughnut Chart Data
  const doughnutData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          leetcode?.easySolved || 0,
          leetcode?.mediumSolved || 0,
          leetcode?.hardSolved || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], // Emerald, Amber, Rose
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        bodyColor: '#f8fafc',
      },
    },
  };

  // Prepare GitHub Repositories Bar Chart Data
  const topRepos = github?.topRepos || [];
  const barData = {
    labels: topRepos.map((r) => r.name),
    datasets: [
      {
        label: 'Stars',
        data: topRepos.map((r) => r.stars),
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Profile Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="space-y-3 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              {student.name}
            </h1>
            <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md text-xs font-mono font-medium">
              {student.rollNumber}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 flex-wrap">
            {student.college && <span>🏫 {student.college}</span>}
            {student.branch && <span>📚 {student.branch}</span>}
            {student.section && <span>🏷️ Sec {student.section}</span>}
            {student.compositeScore !== undefined && (
              <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                ⭐ Composite: {student.compositeScore}
              </span>
            )}
          </div>

          {/* Header Row Platform Usernames with Edit Pencil Icons */}
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
            <span>
              LeetCode:{' '}
              {student.leetcodeUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-amber-400">{student.leetcodeUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('leetcode')}
                    className="text-slate-500 hover:text-amber-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Edit LeetCode username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="text-amber-400/80 hover:text-amber-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              Codeforces:{' '}
              {student.codeforcesUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-cyan-400">{student.codeforcesUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('codeforces')}
                    className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Edit Codeforces username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="text-cyan-400/80 hover:text-cyan-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              GitHub:{' '}
              {student.githubUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-indigo-400">{student.githubUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('github')}
                    className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Edit GitHub username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="text-indigo-400/80 hover:text-indigo-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              GFG:{' '}
              {student.gfgUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-emerald-400">{student.gfgUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('gfg')}
                    className="text-slate-500 hover:text-emerald-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Edit GeeksforGeeks username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('gfg')}
                  className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span>•</span>
            <span>
              CodeChef:{' '}
              {student.codechefUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-orange-400">{student.codechefUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('codechef')}
                    className="text-slate-500 hover:text-orange-400 transition-colors p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Edit CodeChef username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codechef')}
                  className="text-orange-400/80 hover:text-orange-300 underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
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
          className="z-10 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed w-full md:w-auto"
        >
          {refreshing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All
            </>
          )}
        </button>
      </div>

      {/* Summary Cards Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* LeetCode Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">LeetCode</span>
              {student.leetcodeUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="text-slate-500 hover:text-amber-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  title="Edit LeetCode username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
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
                  <span className="text-amber-400 font-bold">+</span> Connect LeetCode
                </button>
              </div>
            ) : leetcode?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limited. Try later.</div>
            ) : leetcode ? (
              <div className="text-3xl font-extrabold text-slate-100">{leetcode.totalSolved}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Total Solved</div>
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Codeforces</span>
              {student.codeforcesUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  title="Edit Codeforces username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
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
                  <span className="text-cyan-400 font-bold">+</span> Connect Codeforces
                </button>
              </div>
            ) : codeforces?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limited. Try later.</div>
            ) : codeforces ? (
              <div className="text-3xl font-extrabold text-slate-100">{codeforces.rating}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh All"</div>
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

        {/* GeeksforGeeks Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">GeeksforGeeks</span>
              {student.gfgUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('gfg')}
                  className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  title="Edit GeeksforGeeks username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-emerald-300 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              {gfg?.instituteRank ? `Inst. Rank #${gfg.instituteRank}` : 'GFG'}
            </span>
          </div>
          <div>
            {!student.gfgUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('gfg')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-emerald-400 font-bold">+</span> Connect GFG
                </button>
              </div>
            ) : gfg ? (
              <div className="text-3xl font-extrabold text-slate-100">{gfg.problemsSolved ?? 0}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Problems Solved</div>
          </div>
          {gfg && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400">Coding Score:</span>
              <span className="text-emerald-400 font-bold">{gfg.codingScore ?? gfg.score ?? 0}</span>
            </div>
          )}
        </div>

        {/* CodeChef Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-orange-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">CodeChef</span>
              {student.codechefUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codechef')}
                  className="text-slate-500 hover:text-orange-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  title="Edit CodeChef username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-orange-300 font-mono bg-orange-950 px-2 py-0.5 rounded border border-orange-800/40">
              {codechef?.stars || '1★'}
            </span>
          </div>
          <div>
            {!student.codechefUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('codechef')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-orange-500/50 text-xs font-semibold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-400 font-bold">+</span> Connect CodeChef
                </button>
              </div>
            ) : codechef ? (
              <div className="text-3xl font-extrabold text-slate-100">{codechef.rating ?? 0}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Current Rating</div>
          </div>
          {codechef && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <span className="text-slate-400">Solved / Rank:</span>
              <span className="text-orange-400 font-bold">
                {codechef.problemsSolved || 0} / #{codechef.globalRank || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* GitHub Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">GitHub</span>
              {student.githubUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="text-slate-500 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                  title="Edit GitHub username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
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
                  <span className="text-indigo-400 font-bold">+</span> Connect GitHub
                </button>
              </div>
            ) : github?.rateLimited ? (
              <div className="text-xs text-amber-400 py-1">Rate limited. Try later.</div>
            ) : github ? (
              <div className="text-3xl font-extrabold text-slate-100">{github.publicRepos}</div>
            ) : (
              <div className="text-sm text-slate-500 py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Public Repos</div>
          </div>
          {github && !github.rateLimited && (
            <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
              <div className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Top Repos:</div>
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
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">In-App IDE</span>
            <span className="text-xs text-purple-400 font-mono bg-purple-950 px-2 py-0.5 rounded border border-purple-800/40">
              ✓ Solved
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-300">
              {student.problemsSolved || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Practice Problems</div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            Solved in integrated IDE.
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
              {cfHistory.length} Contests
            </span>
          </div>
          <div className="h-64 relative">
            {codeforces && !codeforces.rateLimited ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                {!student.codeforcesUsername 
                  ? 'No Codeforces username configured' 
                  : codeforces?.rateLimited
                  ? 'Rate limit exceeded'
                  : 'No history available'}
              </div>
            )}
          </div>
        </div>

        {/* LeetCode Doughnut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">LeetCode Breakdown</h3>
          <div className="h-64 relative flex items-center justify-center">
            {leetcode && !leetcode.rateLimited && leetcode.totalSolved > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-slate-500 text-sm text-center">
                {!student.leetcodeUsername 
                  ? 'No LeetCode username configured' 
                  : leetcode?.rateLimited
                  ? 'Rate limit exceeded'
                  : 'No data recorded'}
              </div>
            )}
          </div>
        </div>

        {/* GitHub Bar Chart */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-200 text-sm">GitHub Top Repository Stars</h3>
          <div className="h-64 relative">
            {github && !github.rateLimited ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                {!student.githubUsername 
                  ? 'No GitHub username configured' 
                  : github?.rateLimited
                  ? 'Rate limit exceeded'
                  : 'No statistics available'}
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
                  {student?.[PLATFORMS[activePlatformModal]?.field]
                    ? `Edit ${PLATFORMS[activePlatformModal]?.name} Username`
                    : `Connect ${PLATFORMS[activePlatformModal]?.name}`}
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
                      Saving...
                    </>
                  ) : student?.[PLATFORMS[activePlatformModal]?.field] ? (
                    'Update'
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
