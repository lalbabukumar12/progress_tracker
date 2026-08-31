import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL'); // 'ALL' | 'leetcode' | 'codeforces' | 'codechef'
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedAt, setCachedAt] = useState(null);

  const fetchContests = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = `http://localhost:5000/api/contests/upcoming${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load contest schedule (Status: ${res.status})`);
      }
      const data = await res.json();
      setContests(data.contests || []);
      setCachedAt(data.cachedAt);
      if (forceRefresh) {
        toast.success('Contest schedule updated!');
      }
    } catch (err) {
      setError(err.message || 'Error fetching upcoming contests');
      if (forceRefresh) {
        toast.error('Failed to refresh contest schedule');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  // Filtered contests
  const filteredContests = useMemo(() => {
    return contests.filter((contest) => {
      const matchPlatform =
        selectedPlatform === 'ALL' || contest.platform.toLowerCase() === selectedPlatform.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        contest.contestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contest.platform.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlatform && matchSearch;
    });
  }, [contests, selectedPlatform, searchQuery]);

  // Group contests by calendar day
  const groupedContests = useMemo(() => {
    const groups = {};

    filteredContests.forEach((contest) => {
      const dateObj = new Date(contest.startTime);
      if (isNaN(dateObj.getTime())) return;

      // Group key: YYYY-MM-DD in local time
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateObj,
          contests: [],
        };
      }
      groups[dateKey].contests.push(contest);
    });

    // Sort group keys chronologically
    return Object.keys(groups)
      .sort()
      .map((key) => ({
        dateKey: key,
        dateObj: groups[key].dateObj,
        contests: groups[key].contests,
      }));
  }, [filteredContests]);

  // Format friendly date header label
  const formatDayHeader = (dateObj) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    const formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays === 0) return `Today • ${formattedDate}`;
    if (diffDays === 1) return `Tomorrow • ${formattedDate}`;
    if (diffDays === -1) return `Yesterday • ${formattedDate}`;
    return formattedDate;
  };

  // Helper for duration display
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // Countdown timer string
  const formatCountdown = (startTimeIso) => {
    const start = new Date(startTimeIso).getTime();
    const now = Date.now();
    const diffMs = start - now;

    if (diffMs <= 0) {
      return { text: '🔴 Live / Started', isLive: true };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return { text: `Starts in ${diffDays} days`, isLive: false };
    }
    if (diffDays === 1) {
      const remainingHours = diffHours % 24;
      return { text: `Starts in 1d ${remainingHours}h`, isLive: false };
    }
    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      return { text: `Starts in ${diffHours}h ${remainingMins}m`, isLive: false };
    }
    return { text: `Starts in ${diffMins} mins`, isLive: false };
  };

  // Platform styling badges
  const getPlatformBadge = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'leetcode':
        return {
          name: 'LeetCode',
          icon: '⚡',
          tagClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          btnClass: 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold',
          cardBorder: 'hover:border-amber-500/50',
        };
      case 'codeforces':
        return {
          name: 'Codeforces',
          icon: '🔷',
          tagClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          btnClass: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold',
          cardBorder: 'hover:border-cyan-500/50',
        };
      case 'codechef':
        return {
          name: 'CodeChef',
          icon: '👨‍🍳',
          tagClass: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
          btnClass: 'bg-orange-600 hover:bg-orange-500 text-white font-bold',
          cardBorder: 'hover:border-orange-500/50',
        };
      case 'gfg':
        return {
          name: 'GeeksforGeeks',
          icon: '🌿',
          tagClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
          cardBorder: 'hover:border-emerald-500/50',
        };
      default:
        return {
          name: platform,
          icon: '🏆',
          tagClass: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
          btnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold',
          cardBorder: 'hover:border-indigo-500/50',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Upcoming Contests</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Live schedule of official programming contests aggregated across LeetCode, Codeforces, CodeChef, and GeeksforGeeks. Stay ahead and never miss a contest!
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => fetchContests(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Refreshing...' : 'Refresh Schedule'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Platform Selector Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Platform:</span>
          {['ALL', 'leetcode', 'codeforces', 'codechef', 'gfg'].map((p) => {
            const isSelected = selectedPlatform === p;
            const label =
              p === 'ALL'
                ? 'All Platforms'
                : p === 'leetcode'
                ? 'LeetCode'
                : p === 'codeforces'
                ? 'Codeforces'
                : p === 'codechef'
                ? 'CodeChef'
                : 'GeeksforGeeks';
            return (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search contest title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 pl-8"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-500">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Contests Grouped Timeline */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4 shadow-xl">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-medium">Fetching upcoming contest schedules...</div>
        </div>
      ) : error ? (
        <div className="bg-slate-900 border border-rose-900/50 rounded-3xl p-8 text-center text-rose-400 space-y-3">
          <div className="text-2xl">⚠️</div>
          <div className="text-sm">{error}</div>
          <button
            onClick={() => fetchContests(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : groupedContests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-xl">
          <div className="text-3xl">🏁</div>
          <h3 className="text-base font-bold text-slate-200">No upcoming contests found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search criteria or switching the platform filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedContests.map(({ dateKey, dateObj, contests: dayContests }) => (
            <div key={dateKey} className="space-y-4">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  {formatDayHeader(dateObj)}
                </h2>
                <div className="flex-1 h-[1px] bg-slate-800" />
                <span className="text-xs text-slate-500 font-mono">
                  {dayContests.length} contest{dayContests.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards Grid for the Day */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayContests.map((contest, idx) => {
                  const badge = getPlatformBadge(contest.platform);
                  const countdown = formatCountdown(contest.startTime);
                  const startTimeObj = new Date(contest.startTime);
                  const formattedTime = startTimeObj.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={`${contest.platform}-${contest.contestName}-${idx}`}
                      className={`bg-slate-900/90 border border-slate-800 ${badge.cardBorder} rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group hover:shadow-2xl hover:bg-slate-900`}
                    >
                      {/* Card Top: Platform Tag & Countdown */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.tagClass}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.name}</span>
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                            countdown.isLive
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {countdown.text}
                        </span>
                      </div>

                      {/* Card Middle: Contest Title */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {contest.contestName}
                        </h3>
                      </div>

                      {/* Card Info: Start Time & Duration */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 font-mono">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-500">Start Time</div>
                          <div className="text-slate-200 font-medium">{formattedTime}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-500">Duration</div>
                          <div className="text-slate-200 font-medium">{formatDuration(contest.durationMinutes)}</div>
                        </div>
                      </div>

                      {/* Card Bottom: Register / View Button */}
                      <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${badge.btnClass}`}
                      >
                        <span>Register / View Contest</span>
                        <span className="text-xs">↗</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {cachedAt && (
        <div className="text-center text-[11px] text-slate-600 font-mono">
          Schedule cached at {new Date(cachedAt).toLocaleTimeString()} • Auto-refreshes hourly
        </div>
      )}
    </div>
  );
}
