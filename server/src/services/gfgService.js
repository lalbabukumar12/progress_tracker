const axios = require('axios');

/**
 * Fetch GeeksforGeeks statistics for a user by scraping their public profile
 * @param {string} username - GeeksforGeeks username
 * @returns {Promise<Object|null>} Normalized stats object or null on failure
 */
const getGfgStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();
  const url = `https://www.geeksforgeeks.org/user/${encodeURIComponent(user)}/`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 8000,
    });

    const html = response.data;
    if (!html || typeof html !== 'string') {
      console.warn(`[GFG Service] Received empty response for user '${user}'`);
      return null;
    }

    let codingScore = 0;
    let problemsSolved = 0;
    let instituteRank = 0;
    let foundData = false;

    // Method 1: Check for Next.js embedded data (__NEXT_DATA__)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        const userInfo = pageProps?.userInfo || pageProps?.userProfileData || pageProps?.initialState?.userProfile;

        if (userInfo) {
          codingScore = Number(userInfo.score || userInfo.codingScore || userInfo.total_score || userInfo.overall_coding_score) || 0;
          problemsSolved = Number(userInfo.total_problems_solved || userInfo.problemsSolved || userInfo.totalSolved) || 0;
          instituteRank = Number(userInfo.institute_rank || userInfo.instituteRank || userInfo.rank) || 0;
          foundData = true;
        }
      } catch (parseErr) {
        // Fallback to regex scraping
      }
    }

    // Method 2: Regex extraction from rendered HTML classes and attributes
    if (!foundData) {
      // Coding score regex match (e.g. Coding Score / overall-score)
      const scoreMatch =
        html.match(/Coding Score[^0-9]*([0-9]+)/i) ||
        html.match(/score_card_value[^>]*>([0-9]+)/i) ||
        html.match(/"codingScore":\s*([0-9]+)/i) ||
        html.match(/"score":\s*([0-9]+)/i);
      if (scoreMatch) {
        codingScore = parseInt(scoreMatch[1], 10);
        foundData = true;
      }

      // Total problems solved match
      const problemsMatch =
        html.match(/Problem[s]? Solved[^0-9]*([0-9]+)/i) ||
        html.match(/total_problems_solved[^0-9]*([0-9]+)/i) ||
        html.match(/"total_problems_solved":\s*([0-9]+)/i) ||
        html.match(/"problemsSolved":\s*([0-9]+)/i);
      if (problemsMatch) {
        problemsSolved = parseInt(problemsMatch[1], 10);
        foundData = true;
      }

      // Institute rank match
      const rankMatch =
        html.match(/Institute Rank[^0-9]*([0-9]+)/i) ||
        html.match(/institute_rank[^0-9]*([0-9]+)/i) ||
        html.match(/"institute_rank":\s*([0-9]+)/i) ||
        html.match(/"instituteRank":\s*([0-9]+)/i);
      if (rankMatch) {
        instituteRank = parseInt(rankMatch[1], 10);
      }
    }

    if (!foundData && !html.includes(user)) {
      console.warn(`[GFG Service] User profile not found for '${user}'`);
      return null;
    }

    return {
      codingScore: Number(codingScore) || 0,
      problemsSolved: Number(problemsSolved) || 0,
      instituteRank: Number(instituteRank) || 0,
      username: user,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`[GFG Service] GeeksforGeeks user '${username}' not found (404)`);
    } else {
      console.warn(`[GFG Service] Error scraping profile for user '${username}':`, error.message);
    }
    return null;
  }
};

module.exports = { getGfgStats };
