const axios = require('axios');

/**
 * Fetch GeeksforGeeks statistics for a user using direct RSC parsing with community API fallbacks
 * @param {string} username - GeeksforGeeks username
 * @returns {Promise<Object|null>} Normalized stats object { codingScore, problemsSolved, instituteRank, username } or null
 */
const getGfgStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();
  const directUrl = `https://www.geeksforgeeks.org/user/${encodeURIComponent(user)}/`;

  // Strategy 1: Direct GFG profile page scraping (Next.js App Router RSC payload & HTML)
  try {
    console.log(`[GFG Service] Fetching direct profile URL: ${directUrl}`);
    const response = await axios.get(directUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      timeout: 8000,
    });

    const html = response.data;
    if (!html || typeof html !== 'string') {
      console.warn(`[GFG Service] Fetch failed - Empty response body for URL: ${directUrl} (Status: ${response.status})`);
    } else {
      let score = null;
      let totalSolved = null;
      let rank = 0;
      let foundData = false;

      // Check 1: Next.js __NEXT_DATA__ JSON tag if present
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const pageProps = nextData?.props?.pageProps;
          const userInfo = pageProps?.userInfo || pageProps?.userProfileData || pageProps?.initialState?.userProfile;

          if (userInfo) {
            score = Number(userInfo.score || userInfo.codingScore || userInfo.total_score || userInfo.overall_coding_score) || 0;
            totalSolved = Number(userInfo.total_problems_solved || userInfo.problemsSolved || userInfo.totalSolved) || 0;
            rank = Number(userInfo.institute_rank || userInfo.instituteRank || userInfo.rank) || 0;
            foundData = true;
          }
        } catch (e) {
          // ignore parse error
        }
      }

      // Check 2: React Server Component (RSC) payload / HTML regex
      if (!foundData) {
        // Escaped and unescaped JSON properties from RSC streams: \"score\":123 or "score":123
        const scoreMatch =
          html.match(/\\?"score\\?":\s*([0-9]+)/) ||
          html.match(/\\?"codingScore\\?":\s*([0-9]+)/) ||
          html.match(/\\?"total_score\\?":\s*([0-9]+)/) ||
          html.match(/Coding Score[^0-9]*([0-9]+)/i) ||
          html.match(/score_card_value[^>]*>([0-9]+)/i);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1], 10);
        }

        const solvedMatch =
          html.match(/\\?"total_problems_solved\\?":\s*([0-9]+)/) ||
          html.match(/\\?"totalProblemsSolved\\?":\s*([0-9]+)/) ||
          html.match(/\\?"problemsSolved\\?":\s*([0-9]+)/) ||
          html.match(/\\?"totalSolved\\?":\s*([0-9]+)/) ||
          html.match(/Problem[s]? Solved[^0-9]*([0-9]+)/i) ||
          html.match(/total_problems_solved[^0-9]*([0-9]+)/i);
        if (solvedMatch) {
          totalSolved = parseInt(solvedMatch[1], 10);
        }

        const rankMatch =
          html.match(/\\?"institute_rank\\?":\s*\\?"?([0-9]+)?\\?"?/) ||
          html.match(/\\?"instituteRank\\?":\s*\\?"?([0-9]+)?\\?"?/) ||
          html.match(/Institute Rank[^0-9]*([0-9]+)/i);
        if (rankMatch && rankMatch[1]) {
          rank = parseInt(rankMatch[1], 10);
        }

        if (score !== null || totalSolved !== null) {
          foundData = true;
        }
      }

      if (foundData) {
        console.log(
          `[GFG Service] Successfully parsed profile for '${user}': score=${score || 0}, solved=${totalSolved || 0}, rank=${rank || 0}`
        );
        return {
          codingScore: Number(score) || 0,
          problemsSolved: Number(totalSolved) || 0,
          instituteRank: Number(rank) || 0,
          username: user,
        };
      }

      console.warn(
        `[GFG Service] Direct scrape yielded no structured stats for '${user}'. URL: ${directUrl} | Status: ${response.status} | Response preview: ${html.slice(0, 500)}`
      );
    }
  } catch (error) {
    const statusCode = error.response?.status || 'NO_STATUS';
    const preview = typeof error.response?.data === 'string'
      ? error.response.data.slice(0, 500)
      : error.response?.data
      ? JSON.stringify(error.response.data).slice(0, 500)
      : error.message;

    console.warn(
      `[GFG Service] Direct fetch failed for '${user}'. Requested URL: ${directUrl} | HTTP Status: ${statusCode} | Error: ${error.message} | Response Body (first 500 chars): ${preview}`
    );
  }

  // Strategy 2: Community API Wrapper (Tashif GFG Stats API)
  const tashifUrl = `https://gfg-stats.tashif.codes/${encodeURIComponent(user)}`;
  try {
    console.log(`[GFG Service] Attempting Tashif API fallback: ${tashifUrl}`);
    const res = await axios.get(tashifUrl, { timeout: 6000 });
    if (res.data && res.data.status === 'success' && res.data.data) {
      const d = res.data.data;
      const codingScore = Number(d.codingScore || d.score || d.totalScore) || 0;
      const problemsSolved = Number(res.data.totalProblemsSolved || d.totalSolved || d.problemsSolved) || 0;
      const instituteRank = Number(d.instituteRank || d.rank) || 0;

      console.log(`[GFG Service] Tashif API succeeded for '${user}': score=${codingScore}, solved=${problemsSolved}, rank=${instituteRank}`);
      return {
        codingScore,
        problemsSolved,
        instituteRank,
        username: user,
      };
    }
  } catch (apiErr) {
    const statusCode = apiErr.response?.status || 'NO_STATUS';
    const preview = typeof apiErr.response?.data === 'string'
      ? apiErr.response.data.slice(0, 500)
      : apiErr.response?.data
      ? JSON.stringify(apiErr.response.data).slice(0, 500)
      : apiErr.message;

    console.warn(
      `[GFG Service] Tashif API fallback failed for '${user}'. Requested URL: ${tashifUrl} | HTTP Status: ${statusCode} | Response Body: ${preview}`
    );
  }

  // Strategy 3: Community API Wrapper (arnoob16 GFG API)
  const arnoobUrl = `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(user)}`;
  try {
    console.log(`[GFG Service] Attempting arnoob16 API fallback: ${arnoobUrl}`);
    const res = await axios.get(arnoobUrl, { timeout: 6000 });
    if (res.data && !res.data.error && (res.data.totalProblemsSolved !== undefined || res.data.codingScore !== undefined)) {
      const codingScore = Number(res.data.codingScore || res.data.score) || 0;
      const problemsSolved = Number(res.data.totalProblemsSolved || res.data.problemsSolved) || 0;
      const instituteRank = Number(res.data.instituteRank || res.data.rank) || 0;

      console.log(`[GFG Service] arnoob16 API succeeded for '${user}': score=${codingScore}, solved=${problemsSolved}, rank=${instituteRank}`);
      return {
        codingScore,
        problemsSolved,
        instituteRank,
        username: user,
      };
    }
  } catch (apiErr) {
    const statusCode = apiErr.response?.status || 'NO_STATUS';
    const preview = typeof apiErr.response?.data === 'string'
      ? apiErr.response.data.slice(0, 500)
      : apiErr.response?.data
      ? JSON.stringify(apiErr.response.data).slice(0, 500)
      : apiErr.message;

    console.warn(
      `[GFG Service] arnoob16 API fallback failed for '${user}'. Requested URL: ${arnoobUrl} | HTTP Status: ${statusCode} | Response Body: ${preview}`
    );
  }

  // Strategy 4: Community API Wrapper (napiyo GFG Stats API)
  const napiyoUrl = `https://geeks-for-geeks-stats-api.vercel.app/?raw=y&userName=${encodeURIComponent(user)}`;
  try {
    console.log(`[GFG Service] Attempting napiyo API fallback: ${napiyoUrl}`);
    const res = await axios.get(napiyoUrl, { timeout: 6000 });
    if (res.data && !res.data.error && (res.data.totalProblemsSolved !== undefined || res.data.codingScore !== undefined)) {
      const codingScore = Number(res.data.codingScore || res.data.score) || 0;
      const problemsSolved = Number(res.data.totalProblemsSolved || res.data.problemsSolved) || 0;
      const instituteRank = Number(res.data.instituteRank || res.data.rank) || 0;

      console.log(`[GFG Service] napiyo API succeeded for '${user}': score=${codingScore}, solved=${problemsSolved}, rank=${instituteRank}`);
      return {
        codingScore,
        problemsSolved,
        instituteRank,
        username: user,
      };
    }
  } catch (apiErr) {
    const statusCode = apiErr.response?.status || 'NO_STATUS';
    const preview = typeof apiErr.response?.data === 'string'
      ? apiErr.response.data.slice(0, 500)
      : apiErr.response?.data
      ? JSON.stringify(apiErr.response.data).slice(0, 500)
      : apiErr.message;

    console.warn(
      `[GFG Service] napiyo API fallback failed for '${user}'. Requested URL: ${napiyoUrl} | HTTP Status: ${statusCode} | Response Body: ${preview}`
    );
  }

  console.warn(`[GFG Service] All fetch strategies failed for GeeksforGeeks user '${user}'`);
  return null;
};

module.exports = { getGfgStats };


