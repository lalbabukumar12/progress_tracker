const axios = require('axios');

// Cache storage and configuration (1 hour TTL)
const CACHE_TTL_MS = 60 * 60 * 1000;
let contestCache = {
  data: null,
  cachedAt: null,
  expiresAt: null,
};

/**
 * Fetch upcoming contests from Codeforces
 * @returns {Promise<Array>}
 */
const fetchCodeforcesContests = async () => {
  try {
    const res = await axios.get('https://codeforces.com/api/contest.list', {
      timeout: 8000,
    });

    if (res.data?.status === 'OK' && Array.isArray(res.data.result)) {
      return res.data.result
        .filter((c) => c.phase === 'BEFORE')
        .map((c) => ({
          platform: 'codeforces',
          contestName: c.name,
          startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
          durationMinutes: Math.round(c.durationSeconds / 60),
          url: `https://codeforces.com/contests/${c.id}`,
        }));
    }
    return [];
  } catch (err) {
    console.warn('[Contest Service] Codeforces fetch failed:', err.message);
    return [];
  }
};

/**
 * Fetch upcoming contests from LeetCode GraphQL
 * @returns {Promise<Array>}
 */
const fetchLeetcodeContests = async () => {
  try {
    const query = `
      query getContests {
        topTwoContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;

    const res = await axios.post(
      'https://leetcode.com/graphql',
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 8000,
      }
    );

    const contests = res.data?.data?.topTwoContests || [];
    const now = Date.now();

    return contests
      .filter((c) => c.startTime * 1000 > now)
      .map((c) => ({
        platform: 'leetcode',
        contestName: c.title,
        startTime: new Date(c.startTime * 1000).toISOString(),
        durationMinutes: Math.round(c.duration / 60),
        url: `https://leetcode.com/contest/${c.titleSlug}`,
      }));
  } catch (err) {
    console.warn('[Contest Service] LeetCode fetch failed:', err.message);
    return [];
  }
};

/**
 * Fetch upcoming contests from CodeChef
 * @returns {Promise<Array>}
 */
const fetchCodechefContests = async () => {
  try {
    const res = await axios.get('https://www.codechef.com/api/list/contests/all', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    const future = res.data?.future_contests || [];
    return future.map((c) => {
      let isoDate = c.contest_start_date_iso;
      if (!isoDate && c.contest_start_date) {
        isoDate = new Date(c.contest_start_date).toISOString();
      }

      return {
        platform: 'codechef',
        contestName: c.contest_name,
        startTime: isoDate || new Date().toISOString(),
        durationMinutes: Number(c.contest_duration) || 120,
        url: `https://www.codechef.com/${c.contest_code}`,
      };
    });
  } catch (err) {
    console.warn('[Contest Service] CodeChef fetch failed:', err.message);
    return [];
  }
};

/**
 * Fetch upcoming contests from GeeksforGeeks
 * @returns {Promise<Array>}
 */
const fetchGfgContests = async () => {
  const contests = [];
  const now = Date.now();

  try {
    const res = await axios.get('https://practiceapi.geeksforgeeks.org/api/vr/events/?sub_type=upcoming', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    const upcoming = res.data?.results?.upcoming || [];
    for (const item of upcoming) {
      if (!item.start_time) continue;
      const startMs = new Date(item.start_time).getTime();
      if (isNaN(startMs) || startMs < now - 60 * 60 * 1000) continue;

      const endMs = item.end_time ? new Date(item.end_time).getTime() : startMs + 90 * 60 * 1000;
      const durationMinutes = Math.max(30, Math.round((endMs - startMs) / 60000));

      contests.push({
        platform: 'gfg',
        contestName: item.title || item.name || 'GeeksforGeeks Contest',
        startTime: new Date(item.start_time).toISOString(),
        durationMinutes,
        url: item.slug
          ? `https://practice.geeksforgeeks.org/event/${item.slug}`
          : 'https://practice.geeksforgeeks.org/events',
      });
    }
  } catch (err) {
    console.warn('[Contest Service] GFG events API fetch failed:', err.message);
  }

  // Also check recurring weekly contest
  try {
    const res = await axios.get('https://practice.geeksforgeeks.org/events/rec/gfg-weekly-coding-contest', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });

    const html = res.data;
    if (typeof html === 'string') {
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch && nextDataMatch[1]) {
        const parsed = JSON.parse(nextDataMatch[1]);
        const upcomingEvent = parsed.props?.pageProps?.upcomingEvent;
        if (upcomingEvent && upcomingEvent.start_time) {
          const startMs = new Date(upcomingEvent.start_time).getTime();
          if (!isNaN(startMs) && startMs > now) {
            const endMs = upcomingEvent.end_time ? new Date(upcomingEvent.end_time).getTime() : startMs + 90 * 60 * 1000;
            contests.push({
              platform: 'gfg',
              contestName: upcomingEvent.title || 'GFG Weekly Coding Contest',
              startTime: new Date(upcomingEvent.start_time).toISOString(),
              durationMinutes: Math.max(30, Math.round((endMs - startMs) / 60000)),
              url: 'https://practice.geeksforgeeks.org/events/rec/gfg-weekly-coding-contest',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Contest Service] GFG recurring weekly contest fetch failed:', err.message);
  }

  return contests;
};

/**
 * Fetch and merge upcoming contests across all platforms with 1-hour in-memory cache
 * @param {Object} options
 * @param {boolean} [options.forceRefresh=false]
 * @returns {Promise<Object>}
 */
const getUpcomingContests = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();

  // Return cached contests if fresh
  if (!forceRefresh && contestCache.data && contestCache.expiresAt && now < contestCache.expiresAt) {
    return {
      cached: true,
      cachedAt: contestCache.cachedAt,
      expiresAt: contestCache.expiresAt,
      contests: contestCache.data,
    };
  }

  // Fetch all platforms in parallel
  const [cfResults, lcResults, ccResults, gfgResults] = await Promise.allSettled([
    fetchCodeforcesContests(),
    fetchLeetcodeContests(),
    fetchCodechefContests(),
    fetchGfgContests(),
  ]);

  const allContests = [];

  if (cfResults.status === 'fulfilled' && Array.isArray(cfResults.value)) {
    allContests.push(...cfResults.value);
  }
  if (lcResults.status === 'fulfilled' && Array.isArray(lcResults.value)) {
    allContests.push(...lcResults.value);
  }
  if (ccResults.status === 'fulfilled' && Array.isArray(ccResults.value)) {
    allContests.push(...ccResults.value);
  }
  if (gfgResults.status === 'fulfilled' && Array.isArray(gfgResults.value)) {
    allContests.push(...gfgResults.value);
  }

  // Filter out any past contests and sort ascending by startTime
  const validContests = allContests
    .filter((c) => new Date(c.startTime).getTime() >= now - 5 * 60 * 1000)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Update in-memory cache
  contestCache = {
    data: validContests,
    cachedAt: new Date(now).toISOString(),
    expiresAt: now + CACHE_TTL_MS,
  };

  return {
    cached: false,
    cachedAt: contestCache.cachedAt,
    expiresAt: contestCache.expiresAt,
    contests: validContests,
  };
};

module.exports = {
  getUpcomingContests,
};
