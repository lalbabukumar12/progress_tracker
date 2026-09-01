const axios = require('axios');

/**
 * Fetch LeetCode statistics for a user via GraphQL
 * @param {string} username - LeetCode username
 * @returns {Promise<Object|null>} Normalized stats object or error object
 */
const getLeetcodeStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();
  const graphqlQuery = {
    query: `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `,
    variables: { username: user },
  };

  try {
    console.log(`[LeetCode Service] Fetching profile for username: ${user}`);
    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });

    const data = response.data?.data;
    if (!data || !data.matchedUser) {
      console.warn(`[LeetCode Service] User '${user}' not found on LeetCode (matchedUser: null)`);
      return { notFound: true, message: `LeetCode user '${user}' not found` };
    }

    const matchedUser = data.matchedUser;
    const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];

    const totalItem = acSubmissions.find((item) => item.difficulty === 'All');
    const easyItem = acSubmissions.find((item) => item.difficulty === 'Easy');
    const mediumItem = acSubmissions.find((item) => item.difficulty === 'Medium');
    const hardItem = acSubmissions.find((item) => item.difficulty === 'Hard');

    console.log(`[LeetCode Service] Succeeded for '${user}': totalSolved=${totalItem ? totalItem.count : 0}`);
    return {
      totalSolved: totalItem ? totalItem.count : 0,
      easySolved: easyItem ? easyItem.count : 0,
      mediumSolved: mediumItem ? mediumItem.count : 0,
      hardSolved: hardItem ? hardItem.count : 0,
      ranking: matchedUser.profile?.ranking || 0,
      username: user,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`[LeetCode Service] Rate limit exceeded (429) for user '${user}'`);
      return { rateLimited: true, message: 'LeetCode API rate limit exceeded. Please wait a minute before retrying.' };
    }
    console.error(`[LeetCode Service] Error for user '${user}': HTTP ${error.response?.status || 'ERR'} - ${error.message}`);
    return null;
  }
};

module.exports = { getLeetcodeStats };

