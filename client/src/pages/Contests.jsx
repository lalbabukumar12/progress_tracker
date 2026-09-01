import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cachedAt, setCachedAt] = useState(null);

  const fetchContests = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `http://localhost:5000/api/contests/upcoming${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load contest schedule (Status: ${res.status})`);
      }
      const data = await res.json();
      setContests(data.contests || []);
      setCachedAt(data.cachedAt || new Date().toISOString());
      if (forceRefresh) {
        toast.success('Contest schedule updated!');
      }
    } catch (err) {
      setError(err.message || 'Error fetching contests');
      if (forceRefresh) toast.error(err.message || 'Refresh failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  // Filter & Search contests
  const filteredContests = useMemo(() => {
    return contests.filter((contest) => {
      // 1. Platform filter
      if (selectedPlatform !== 'ALL') {
        if (contest.platform?.toLowerCase() !== selectedPlatform.toLowerCase()) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchTitle = (contest.contestName || '').toLowerCase().includes(query);
        const matchPlatform = (contest.platform || '').toLowerCase().includes(query);
        if (!matchTitle && !matchPlatform) return false;
      }

      return true;
    });
  }, [contests, selectedPlatform, searchQuery]);

  // Group contests by Start Date (Calendar day)
  const groupedContests = useMemo(() => {
    const groups = {};
    filteredContests.forEach((contest) => {
      if (!contest.startTime) return;
      const dateObj = new Date(contest.startTime);
      const dateKey = dateObj.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateObj,
          contests: [],
        };
      }
      groups[dateKey].contests.push(contest);
    });

    // Sort chronologically by date
    return Object.keys(groups)
      .sort()
      .map((dateKey) => ({
        dateKey,
        dateObj: groups[dateKey].dateObj,
        contests: groups[dateKey].contests.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        ),
      }));
  }, [filteredContests]);

  // Format helper for duration
  const formatDuration = (mins) => {
    if (!mins || mins <= 0) return 'TBD';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
  };

  // Format header dates
  const formatDayHeader = (dateObj) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const targetStr = dateObj.toISOString().split('T')[0];

    const diffDays = Math.round(
      (new Date(targetStr) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
    );

    const formattedDate = dateObj.toLocaleDateString('en-US', {
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

  // Format countdown string
  const formatCountdown = (startTime) => {
    const now = new Date();
    const target = new Date(startTime);
    const diffMs = target - now;

    if (diffMs <= 0) {
      return { text: 'Live / Started', isLive: true };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return {
        text: `Starts in ${diffDays}d ${remainingHours}h`,
        isLive: false,
      };
    }

    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      return {
        text: `Starts in ${diffHours}h ${remainingMins}m`,
        isLive: false,
      };
    }

    return { text: `Starts in ${diffMins} mins`, isLive: false };
  };

  // Platform styling badges
  const getPlatformBadge = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'leetcode':
        return {
          name: 'LeetCode',
          tagClass: 'bg-[#FAF8FE] border-[#F39C12]/40 text-[#D97706]',
          btnClass: 'bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold',
          cardBorder: 'hover:border-[#7C4DFF]',
        };
      case 'codeforces':
        return {
          name: 'Codeforces',
          tagClass: 'bg-[#FAF8FE] border-[#E74C3C]/40 text-[#E74C3C]',
          btnClass: 'bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold',
          cardBorder: 'hover:border-[#7C4DFF]',
        };
      case 'codechef':
        return {
          name: 'CodeChef',
          tagClass: 'bg-[#FAF8FE] border-[#F39C12]/40 text-[#D97706]',
          btnClass: 'bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold',
          cardBorder: 'hover:border-[#7C4DFF]',
        };
      case 'gfg':
        return {
          name: 'GeeksforGeeks',
          tagClass: 'bg-[#FAF8FE] border-[#27AE60]/40 text-[#27AE60]',
          btnClass: 'bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold',
          cardBorder: 'hover:border-[#7C4DFF]',
        };
      default:
        return {
          name: platform,
          tagClass: 'bg-[#E8DEFB] border-[#C9B6F0] text-[#7C4DFF]',
          btnClass: 'bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold',
          cardBorder: 'hover:border-[#7C4DFF]',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-[#E0D4F7] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C4DFF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2B2438]">Upcoming Contests</h1>
          <p className="text-[#8A7FA3] text-sm max-w-2xl">
            Live schedule of official programming contests aggregated across LeetCode, Codeforces, CodeChef, and GeeksforGeeks.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => fetchContests(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] disabled:opacity-50 text-[#2B2438] text-xs font-semibold rounded-xl border border-[#E0D4F7] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Refreshing...' : 'Refresh Schedule'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E0D4F7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Platform Selector Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#8A7FA3] uppercase tracking-wider mr-1">Platform:</span>
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
                    ? 'bg-[#7C4DFF] text-white shadow-sm shadow-[#7C4DFF]/25'
                    : 'bg-[#FAF8FE] text-[#8A7FA3] hover:text-[#2B2438] border border-[#E0D4F7]'
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
            className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2 text-[#2B2438] placeholder-[#8A7FA3] text-xs focus:outline-none focus:border-[#7C4DFF] pl-8"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-[#8A7FA3]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-[#8A7FA3] hover:text-[#2B2438] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Contests Grouped Timeline */}
      {loading ? (
        <div className="bg-white border border-[#E0D4F7] rounded-3xl p-12 text-center text-[#8A7FA3] space-y-4 shadow-sm">
          <div className="w-10 h-10 border-3 border-[#7C4DFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-medium">Fetching upcoming contest schedules...</div>
        </div>
      ) : error ? (
        <div className="bg-[#F39C12]/10 border border-[#F39C12]/30 rounded-3xl p-8 text-center text-[#D97706] space-y-3">
          <div className="text-2xl">⚠️</div>
          <div className="text-sm font-semibold">{error}</div>
          <button
            onClick={() => fetchContests(true)}
            className="px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : groupedContests.length === 0 ? (
        <div className="bg-white border border-[#E0D4F7] rounded-3xl p-12 text-center text-[#8A7FA3] space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-[#2B2438]">No upcoming contests found</h3>
          <p className="text-xs text-[#8A7FA3]">
            Try adjusting your search criteria or switching the platform filter.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedContests.map(({ dateKey, dateObj, contests: dayContests }) => (
            <div key={dateKey} className="space-y-4">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C4DFF] shadow-sm shadow-[#7C4DFF]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#2B2438]">
                  {formatDayHeader(dateObj)}
                </h2>
                <div className="flex-1 h-[1px] bg-[#E0D4F7]" />
                <span className="text-xs text-[#8A7FA3] font-mono">
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
                      className={`bg-white border border-[#E0D4F7] ${badge.cardBorder} rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 group hover:shadow-md hover:bg-[#FAF8FE]`}
                    >
                      {/* Card Top: Platform Tag & Countdown */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.tagClass}`}
                        >
                          <span>{badge.name}</span>
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                            countdown.isLive
                              ? 'bg-[#E74C3C]/15 text-[#E74C3C] border border-[#E74C3C]/30 animate-pulse'
                              : 'bg-[#FAF8FE] text-[#8A7FA3] border border-[#E0D4F7]'
                          }`}
                        >
                          {countdown.text}
                        </span>
                      </div>

                      {/* Card Middle: Contest Title */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#2B2438] group-hover:text-[#7C4DFF] transition-colors line-clamp-2">
                          {contest.contestName}
                        </h3>
                      </div>

                      {/* Card Info: Start Time & Duration */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF8FE] rounded-xl p-3 border border-[#E0D4F7] font-mono">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-[#8A7FA3]">Start Time</div>
                          <div className="text-[#2B2438] font-medium">{formattedTime}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-[#8A7FA3]">Duration</div>
                          <div className="text-[#2B2438] font-medium">{formatDuration(contest.durationMinutes)}</div>
                        </div>
                      </div>

                      {/* Card Bottom: Register / View Button */}
                      <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${badge.btnClass}`}
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
        <div className="text-center text-[11px] text-[#8A7FA3] font-mono">
          Schedule cached at {new Date(cachedAt).toLocaleTimeString()} • Auto-refreshes hourly
        </div>
      )}
    </div>
  );
}
