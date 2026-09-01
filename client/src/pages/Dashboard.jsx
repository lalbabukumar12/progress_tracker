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
    textColor: 'text-[#D97706]',
    borderColor: 'border-[#D97706]/40',
    hoverBorder: 'hover:border-[#D97706]/60',
    dotColor: 'bg-[#D97706]',
    placeholder: 'e.g. neal_wu',
  },
  codeforces: {
    key: 'codeforces',
    name: 'Codeforces',
    field: 'codeforcesUsername',
    textColor: 'text-[#E74C3C]',
    borderColor: 'border-[#E74C3C]/40',
    hoverBorder: 'hover:border-[#E74C3C]/60',
    dotColor: 'bg-[#E74C3C]',
    placeholder: 'e.g. tourist',
  },
  github: {
    key: 'github',
    name: 'GitHub',
    field: 'githubUsername',
    textColor: 'text-[#2B2438]',
    borderColor: 'border-[#E0D4F7]',
    hoverBorder: 'hover:border-[#7C4DFF]',
    dotColor: 'bg-[#7C4DFF]',
    placeholder: 'e.g. torvalds',
  },
  gfg: {
    key: 'gfg',
    name: 'GeeksforGeeks',
    field: 'gfgUsername',
    textColor: 'text-[#27AE60]',
    borderColor: 'border-[#27AE60]/40',
    hoverBorder: 'hover:border-[#27AE60]/60',
    dotColor: 'bg-[#27AE60]',
    placeholder: 'e.g. geeksuser',
  },
  codechef: {
    key: 'codechef',
    name: 'CodeChef',
    field: 'codechefUsername',
    textColor: 'text-[#D97706]',
    borderColor: 'border-[#D97706]/40',
    hoverBorder: 'hover:border-[#D97706]/60',
    dotColor: 'bg-[#D97706]',
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
  const [activePlatformModal, setActivePlatformModal] = useState(null);
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
        toast.error('⚠️ Rate limit exceeded on one or more platforms. Try again in a minute.', { id: toastId });
      } else {
        toast.success('✅ Stats refreshed successfully!', { id: toastId });
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

    const trimmedUsername = modalUsername.trim();
    if (!trimmedUsername) {
      setModalError('Username cannot be empty');
      return;
    }

    setSavingPlatform(true);
    setModalError(null);
    const toastId = toast.loading(`Saving ${platformConfig.name} username...`);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const updateRes = await fetch(`http://localhost:5000/api/students/${studentId}/platform-username`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          platform: activePlatformModal,
          username: trimmedUsername,
        }),
      });

      const updatedData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updatedData.message || `Failed to update ${platformConfig.name} username`);
      }

      toast.success(`${platformConfig.name} username updated!`, { id: toastId });
      closePlatformModal();
      setStudent(updatedData);

      const refreshToast = toast.loading(`Refreshing ${platformConfig.name} statistics...`);
      try {
        const refreshRes = await fetch(`http://localhost:5000/api/students/${studentId}/refresh-stats`, {
          method: 'POST',
          headers,
        });
        if (refreshRes.ok) {
          const freshStudent = await refreshRes.json();
          setStudent(freshStudent);
          toast.success(`✅ ${platformConfig.name} stats refreshed!`, { id: refreshToast });
        } else {
          toast.dismiss(refreshToast);
        }
      } catch {
        toast.dismiss(refreshToast);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to save username');
      toast.error(err.message || 'Error saving username', { id: toastId });
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
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="bg-white border border-[#E0D4F7] rounded-2xl p-12 max-w-lg mx-auto shadow-xl space-y-4">
          <div className="w-16 h-16 bg-[#F39C12]/15 text-[#F39C12] border border-[#F39C12]/30 rounded-full flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-[#2B2438]">Student Not Found</h2>
          <p className="text-[#8A7FA3] text-sm">{error || 'Unable to retrieve student profile information.'}</p>
          <div className="pt-4">
            <Link
              to="/"
              className="px-5 py-2.5 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors inline-block"
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

  // Codeforces Rating Trajectory Line Chart
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
        borderColor: '#7C4DFF',
        backgroundColor: 'rgba(124, 77, 255, 0.12)',
        borderWidth: 2,
        pointBackgroundColor: '#7C4DFF',
        pointBorderColor: '#6C3CE9',
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
        backgroundColor: '#FFFFFF',
        titleColor: '#2B2438',
        bodyColor: '#8A7FA3',
        borderColor: '#E0D4F7',
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
        grid: { color: 'rgba(224, 212, 247, 0.6)' },
        ticks: { color: '#8A7FA3', font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(224, 212, 247, 0.6)' },
        ticks: { color: '#8A7FA3', font: { size: 10 } },
      },
    },
  };

  // LeetCode Breakdown Doughnut Chart
  const doughnutData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          leetcode?.easySolved || 0,
          leetcode?.mediumSolved || 0,
          leetcode?.hardSolved || 0,
        ],
        backgroundColor: ['#27AE60', '#F39C12', '#E74C3C'], // Green, Amber, Red
        borderColor: '#FFFFFF',
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
          color: '#2B2438',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0D4F7',
        borderWidth: 1,
        bodyColor: '#2B2438',
        titleColor: '#2B2438',
      },
    },
  };

  // GitHub Repositories Bar Chart
  const topRepos = github?.topRepos || [];
  const barData = {
    labels: topRepos.map((r) => r.name),
    datasets: [
      {
        label: 'Stars',
        data: topRepos.map((r) => r.stars),
        backgroundColor: 'rgba(124, 77, 255, 0.85)',
        hoverBackgroundColor: '#6C3CE9',
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
        backgroundColor: '#FFFFFF',
        borderColor: '#E0D4F7',
        borderWidth: 1,
        titleColor: '#2B2438',
        bodyColor: '#8A7FA3',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8A7FA3', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(224, 212, 247, 0.6)' },
        ticks: { color: '#8A7FA3', font: { size: 10 }, stepSize: 1 },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Profile Section */}
      <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C4DFF]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="space-y-3 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2B2438] tracking-tight">
              {student.name}
            </h1>
            <span className="px-2.5 py-1 bg-[#FAF8FE] text-[#2B2438] border border-[#E0D4F7] rounded-md text-xs font-mono font-medium">
              {student.rollNumber}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-[#8A7FA3] flex-wrap">
            {student.college && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FAF8FE] border border-[#E0D4F7]">{student.college}</span>
            )}
            {student.branch && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FAF8FE] border border-[#E0D4F7]">{student.branch}</span>
            )}
            {student.section && (
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FAF8FE] border border-[#E0D4F7]">Sec {student.section}</span>
            )}
            {student.compositeScore !== undefined && (
              <span className="bg-[#27AE60]/12 text-[#27AE60] border border-[#27AE60]/30 px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold">
                Composite: {student.compositeScore} pts
              </span>
            )}
          </div>

          {/* Header Row Platform Usernames with Edit Icons */}
          <div className="flex items-center gap-3 text-xs font-mono text-[#8A7FA3] flex-wrap pt-1">
            <span>
              LeetCode:{' '}
              {student.leetcodeUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-[#D97706]">{student.leetcodeUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('leetcode')}
                    className="text-[#8A7FA3] hover:text-[#D97706] transition-colors p-0.5 rounded hover:bg-[#FAF8FE] cursor-pointer"
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
                  className="text-[#D97706]/80 hover:text-[#D97706] underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span className="text-[#E0D4F7]">•</span>
            <span>
              Codeforces:{' '}
              {student.codeforcesUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-[#E74C3C]">{student.codeforcesUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('codeforces')}
                    className="text-[#8A7FA3] hover:text-[#E74C3C] transition-colors p-0.5 rounded hover:bg-[#FAF8FE] cursor-pointer"
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
                  className="text-[#E74C3C]/80 hover:text-[#E74C3C] underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span className="text-[#E0D4F7]">•</span>
            <span>
              GitHub:{' '}
              {student.githubUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-[#2B2438]">{student.githubUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('github')}
                    className="text-[#8A7FA3] hover:text-[#2B2438] transition-colors p-0.5 rounded hover:bg-[#FAF8FE] cursor-pointer"
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
                  className="text-[#8A7FA3] hover:text-[#2B2438] underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span className="text-[#E0D4F7]">•</span>
            <span>
              GFG:{' '}
              {student.gfgUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-[#27AE60]">{student.gfgUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('gfg')}
                    className="text-[#8A7FA3] hover:text-[#27AE60] transition-colors p-0.5 rounded hover:bg-[#FAF8FE] cursor-pointer"
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
                  className="text-[#27AE60]/80 hover:text-[#27AE60] underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
                >
                  Not provided
                </button>
              )}
            </span>
            <span className="text-[#E0D4F7]">•</span>
            <span>
              CodeChef:{' '}
              {student.codechefUsername ? (
                <span className="inline-flex items-center gap-1">
                  <strong className="text-[#D97706]">{student.codechefUsername}</strong>
                  <button
                    type="button"
                    onClick={() => openPlatformModal('codechef')}
                    className="text-[#8A7FA3] hover:text-[#D97706] transition-colors p-0.5 rounded hover:bg-[#FAF8FE] cursor-pointer"
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
                  className="text-[#D97706]/80 hover:text-[#D97706] underline underline-offset-2 decoration-dotted hover:decoration-solid transition-colors cursor-pointer font-medium"
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
          className="z-10 px-5 py-2.5 bg-[#7C4DFF] hover:bg-[#6C3CE9] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#7C4DFF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed w-full md:w-auto"
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
        <div className="bg-white border border-[#E0D4F7] hover:border-[#D97706]/60 transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">LeetCode</span>
              {student.leetcodeUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="text-[#8A7FA3] hover:text-[#D97706] transition-colors p-1 rounded hover:bg-[#FAF8FE] cursor-pointer"
                  title="Edit LeetCode username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[#8A7FA3] font-mono">
              {leetcode?.ranking ? `Ranking #${leetcode.ranking}` : 'N/A'}
            </span>
          </div>
          <div>
            {!student.leetcodeUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('leetcode')}
                  className="px-3 py-1.5 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] border border-[#E0D4F7] hover:border-[#D97706]/60 text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#D97706] font-bold">+</span> Connect LeetCode
                </button>
              </div>
            ) : leetcode?.rateLimited ? (
              <div className="text-xs text-[#D97706] py-1">⚠️ Rate limited. Try later.</div>
            ) : leetcode ? (
              <div className="text-3xl font-extrabold text-[#2B2438]">{leetcode.totalSolved}</div>
            ) : (
              <div className="text-sm text-[#8A7FA3] py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-[#8A7FA3] mt-1">Total Solved</div>
          </div>
          {leetcode && !leetcode.rateLimited && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EBE3F8] text-center text-xs font-mono">
              <div className="bg-[#FAF8FE] border border-[#27AE60]/30 p-2 rounded-lg">
                <div className="text-[#27AE60] font-bold">{leetcode.easySolved}</div>
                <div className="text-[#8A7FA3] text-[10px]">Easy</div>
              </div>
              <div className="bg-[#FAF8FE] border border-[#F39C12]/30 p-2 rounded-lg">
                <div className="text-[#F39C12] font-bold">{leetcode.mediumSolved}</div>
                <div className="text-[#8A7FA3] text-[10px]">Medium</div>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E74C3C]/30 p-2 rounded-lg">
                <div className="text-[#E74C3C] font-bold">{leetcode.hardSolved}</div>
                <div className="text-[#8A7FA3] text-[10px]">Hard</div>
              </div>
            </div>
          )}
        </div>

        {/* Codeforces Card */}
        <div className="bg-white border border-[#E0D4F7] hover:border-[#E74C3C]/60 transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E74C3C]">Codeforces</span>
              {student.codeforcesUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="text-[#8A7FA3] hover:text-[#E74C3C] transition-colors p-1 rounded hover:bg-[#FAF8FE] cursor-pointer"
                  title="Edit Codeforces username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[#E74C3C] font-semibold capitalize bg-[#FAF8FE] px-2 py-0.5 rounded border border-[#E74C3C]/30">
              {codeforces?.rank || 'Unrated'}
            </span>
          </div>
          <div>
            {!student.codeforcesUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('codeforces')}
                  className="px-3 py-1.5 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] border border-[#E0D4F7] hover:border-[#E74C3C]/60 text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#E74C3C] font-bold">+</span> Connect Codeforces
                </button>
              </div>
            ) : codeforces?.rateLimited ? (
              <div className="text-xs text-[#F39C12] py-1">⚠️ Rate limited. Try later.</div>
            ) : codeforces ? (
              <div className="text-3xl font-extrabold text-[#2B2438]">{codeforces.rating}</div>
            ) : (
              <div className="text-sm text-[#8A7FA3] py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-[#8A7FA3] mt-1">Current Rating</div>
          </div>
          {codeforces && !codeforces.rateLimited && (
            <div className="flex items-center justify-between pt-2 border-t border-[#EBE3F8] text-xs font-mono">
              <span className="text-[#8A7FA3]">Max Rating:</span>
              <span className="text-[#E74C3C] font-bold">{codeforces.maxRating}</span>
            </div>
          )}
        </div>

        {/* GeeksforGeeks Card */}
        <div className="bg-white border border-[#E0D4F7] hover:border-[#27AE60]/60 transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#27AE60]">GeeksforGeeks</span>
              {student.gfgUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('gfg')}
                  className="text-[#8A7FA3] hover:text-[#27AE60] transition-colors p-1 rounded hover:bg-[#FAF8FE] cursor-pointer"
                  title="Edit GeeksforGeeks username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[#27AE60] font-mono bg-[#FAF8FE] px-2 py-0.5 rounded border border-[#27AE60]/40 font-semibold">
              {gfg?.instituteRank ? `Inst. Rank #${gfg.instituteRank}` : 'GFG'}
            </span>
          </div>
          <div>
            {!student.gfgUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('gfg')}
                  className="px-3 py-1.5 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] border border-[#E0D4F7] hover:border-[#27AE60]/60 text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#27AE60] font-bold">+</span> Connect GFG
                </button>
              </div>
            ) : gfg ? (
              <div className="text-3xl font-extrabold text-[#2B2438]">{gfg.problemsSolved ?? 0}</div>
            ) : (
              <div className="text-sm text-[#8A7FA3] py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-[#8A7FA3] mt-1">Problems Solved</div>
          </div>
          {gfg && (
            <div className="flex items-center justify-between pt-2 border-t border-[#EBE3F8] text-xs font-mono">
              <span className="text-[#8A7FA3]">Coding Score:</span>
              <span className="text-[#27AE60] font-bold">{gfg.codingScore ?? gfg.score ?? 0}</span>
            </div>
          )}
        </div>

        {/* CodeChef Card */}
        <div className="bg-white border border-[#E0D4F7] hover:border-[#D97706]/60 transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">CodeChef</span>
              {student.codechefUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('codechef')}
                  className="text-[#8A7FA3] hover:text-[#D97706] transition-colors p-1 rounded hover:bg-[#FAF8FE] cursor-pointer"
                  title="Edit CodeChef username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[#D97706] font-mono bg-[#FAF8FE] px-2 py-0.5 rounded border border-[#D97706]/40 font-semibold">
              {codechef?.stars || '1★'}
            </span>
          </div>
          <div>
            {!student.codechefUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('codechef')}
                  className="px-3 py-1.5 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] border border-[#E0D4F7] hover:border-[#D97706]/60 text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#D97706] font-bold">+</span> Connect CodeChef
                </button>
              </div>
            ) : codechef ? (
              <div className="text-3xl font-extrabold text-[#2B2438]">{codechef.rating ?? 0}</div>
            ) : (
              <div className="text-sm text-[#8A7FA3] py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-[#8A7FA3] mt-1">Current Rating</div>
          </div>
          {codechef && (
            <div className="flex items-center justify-between pt-2 border-t border-[#EBE3F8] text-xs font-mono">
              <span className="text-[#8A7FA3]">Solved / Rank:</span>
              <span className="text-[#D97706] font-bold">
                {codechef.problemsSolved || 0} / #{codechef.globalRank || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* GitHub Card */}
        <div className="bg-white border border-[#E0D4F7] hover:border-[#7C4DFF] transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B2438]">GitHub</span>
              {student.githubUsername && (
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="text-[#8A7FA3] hover:text-[#2B2438] transition-colors p-1 rounded hover:bg-[#FAF8FE] cursor-pointer"
                  title="Edit GitHub username"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[#8A7FA3] font-mono">{github?.followers || 0} Followers</span>
          </div>
          <div>
            {!student.githubUsername ? (
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => openPlatformModal('github')}
                  className="px-3 py-1.5 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#2B2438] border border-[#E0D4F7] hover:border-[#7C4DFF] text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[#7C4DFF] font-bold">+</span> Connect GitHub
                </button>
              </div>
            ) : github?.rateLimited ? (
              <div className="text-xs text-[#F39C12] py-1">⚠️ Rate limited. Try later.</div>
            ) : github ? (
              <div className="text-3xl font-extrabold text-[#2B2438]">{github.publicRepos}</div>
            ) : (
              <div className="text-sm text-[#8A7FA3] py-2">Click "Refresh All"</div>
            )}
            <div className="text-xs text-[#8A7FA3] mt-1">Public Repos</div>
          </div>
          {github && !github.rateLimited && (
            <div className="pt-2 border-t border-[#EBE3F8] text-xs space-y-1">
              <div className="text-[#8A7FA3] font-medium text-[11px] uppercase tracking-wider">Top Repos:</div>
              <div className="flex flex-wrap gap-1.5">
                {(github.topRepos || []).slice(0, 3).map((repo, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#FAF8FE] border border-[#E0D4F7] text-[#2B2438] rounded font-mono text-[11px]">
                    {repo.name} ({repo.stars}★)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Practice Problems (In-App IDE) */}
        <div className="bg-white border border-[#E0D4F7] hover:border-[#27AE60]/60 transition-colors rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#27AE60]">In-App IDE</span>
            <span className="text-xs text-[#27AE60] font-mono bg-[#FAF8FE] px-2 py-0.5 rounded border border-[#27AE60]/40 font-semibold">
              Solved
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#27AE60]">
              {student.problemsSolved || 0}
            </div>
            <div className="text-xs text-[#8A7FA3] mt-1">Practice Problems</div>
          </div>
          <div className="pt-2 border-t border-[#EBE3F8] text-xs text-[#8A7FA3]">
            Solved in integrated Code IDE.
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Codeforces Line Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#2B2438] text-sm">Codeforces Rating Trajectory</h3>
            <span className="text-xs text-[#8A7FA3] font-mono">
              {cfHistory.length} Contests
            </span>
          </div>
          <div className="h-64 relative">
            {codeforces && !codeforces.rateLimited ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8A7FA3] text-sm">
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
        <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-[#2B2438] text-sm">LeetCode Breakdown</h3>
          <div className="h-64 relative flex items-center justify-center">
            {leetcode && !leetcode.rateLimited && leetcode.totalSolved > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-[#8A7FA3] text-sm text-center">
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
        <div className="lg:col-span-3 bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-[#2B2438] text-sm">GitHub Top Repository Stars</h3>
          <div className="h-64 relative">
            {github && !github.rateLimited ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8A7FA3] text-sm">
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
          className="fixed inset-0 bg-[#2B2438]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePlatformModal();
          }}
        >
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-[#2B2438]">
            <div className="flex items-center justify-between border-b border-[#E0D4F7] pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${PLATFORMS[activePlatformModal]?.dotColor || 'bg-[#7C4DFF]'}`} />
                <h3 className="text-base font-bold text-[#2B2438]">
                  {student?.[PLATFORMS[activePlatformModal]?.field]
                    ? `Edit ${PLATFORMS[activePlatformModal]?.name} Username`
                    : `Connect ${PLATFORMS[activePlatformModal]?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePlatformModal}
                disabled={savingPlatform}
                className="text-[#8A7FA3] hover:text-[#2B2438] text-lg cursor-pointer disabled:opacity-50 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B2438] mb-1.5">
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
                  className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] text-sm focus:outline-none focus:border-[#7C4DFF] transition-colors"
                />
                {modalError && (
                  <div className="mt-2.5 text-xs text-[#D97706] bg-[#F39C12]/10 border border-[#F39C12]/30 rounded-xl p-3 flex items-start gap-2.5">
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
                  className="px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] disabled:opacity-50 text-[#8A7FA3] hover:text-[#2B2438] font-semibold text-xs rounded-xl border border-[#E0D4F7] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlatform}
                  className="px-5 py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-[#7C4DFF]/20 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-pulse">
      <div className="h-28 bg-white border border-[#E0D4F7] rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-[#E8DEFB] rounded" />
          <div className="h-4 w-64 bg-[#FAF8FE] rounded" />
        </div>
        <div className="h-10 w-32 bg-[#E8DEFB] rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-white border border-[#E0D4F7] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="h-4 w-24 bg-[#E8DEFB] rounded" />
            <div className="h-8 w-16 bg-[#FAF8FE] rounded" />
            <div className="h-4 w-full bg-[#FAF8FE] rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm" />
        <div className="h-72 bg-white border border-[#E0D4F7] rounded-2xl p-6 shadow-sm" />
      </div>
    </div>
  );
}
