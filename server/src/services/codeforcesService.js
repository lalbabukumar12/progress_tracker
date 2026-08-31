const axios = require('axios');

/**
 * Fetch Codeforces statistics for a user
 * @param {string} username - Codeforces username/handle
 * @returns {Promise<Object|null>} Normalized stats object or rate-limited error object
 */
const getCodeforcesStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const handle = username.trim();

  try {
    const [infoRes, ratingRes] = await Promise.allSettled([
      axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, { timeout: 8000 }),
      axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`, { timeout: 8000 }),
    ]);

    // Check rate-limiting (429) in settled promises
    if (
      (infoRes.status === 'rejected' && infoRes.reason?.response?.status === 429) ||
      (ratingRes.status === 'rejected' && ratingRes.reason?.response?.status === 429)
    ) {
      return { rateLimited: true, message: 'Codeforces API rate limit exceeded. Please try again in a minute.' };
    }

    if (infoRes.status !== 'fulfilled' || infoRes.value.data?.status !== 'OK') {
      return null;
    }

    const userInfo = infoRes.value.data.result?.[0];
    if (!userInfo) return null;

    let ratingHistory = [];
    if (ratingRes.status === 'fulfilled' && ratingRes.value.data?.status === 'OK') {
      ratingHistory = (ratingRes.value.data.result || []).map((item) => ({
        contestId: item.contestId,
        contestName: item.contestName,
        rank: item.rank,
        ratingUpdateTimeSeconds: item.ratingUpdateTimeSeconds,
        oldRating: item.oldRating,
        newRating: item.newRating,
      }));
    }

    return {
      rating: userInfo.rating || 0,
      rank: userInfo.rank || 'Unrated',
      maxRating: userInfo.maxRating || 0,
      ratingHistory,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      return { rateLimited: true, message: 'Codeforces API rate limit exceeded. Please try again in a minute.' };
    }
    console.error(`Codeforces service error for handle '${username}':`, error.message);
    return null;
  }
};

module.exports = { getCodeforcesStats };
