const axios = require('axios');

/**
 * Fetch Codeforces statistics for a user
 * @param {string} username - Codeforces username/handle
 * @returns {Promise<Object|null>} Normalized stats object or error object
 */
const getCodeforcesStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const handle = username.trim();
  const infoUrl = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
  const ratingUrl = `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`;

  try {
    console.log(`[Codeforces Service] Fetching profile info for handle: ${handle}`);
    const [infoRes, ratingRes] = await Promise.allSettled([
      axios.get(infoUrl, { timeout: 8000 }),
      axios.get(ratingUrl, { timeout: 8000 }),
    ]);

    // Check rate-limiting (429) in settled promises
    if (
      (infoRes.status === 'rejected' && infoRes.reason?.response?.status === 429) ||
      (ratingRes.status === 'rejected' && ratingRes.reason?.response?.status === 429)
    ) {
      console.warn(`[Codeforces Service] Rate limit exceeded (429) for handle '${handle}'`);
      return { rateLimited: true, message: 'Codeforces API rate limit exceeded. Please wait a minute before retrying.' };
    }

    if (infoRes.status !== 'fulfilled' || infoRes.value.data?.status !== 'OK') {
      const errStatus = infoRes.reason?.response?.status;
      const errComment = infoRes.reason?.response?.data?.comment || infoRes.reason?.message;
      console.warn(`[Codeforces Service] Info fetch failed for '${handle}': HTTP ${errStatus || 'ERR'} - ${errComment}`);
      
      if (errComment && errComment.toLowerCase().includes('not found')) {
        return { notFound: true, message: `Codeforces handle '${handle}' not found` };
      }
      if (infoRes.reason?.code === 'ECONNABORTED' || infoRes.reason?.code === 'ETIMEDOUT') {
        return { error: true, message: `Connection to Codeforces timed out for handle '${handle}'` };
      }
      return null;
    }

    const userInfo = infoRes.value.data.result?.[0];
    if (!userInfo) {
      console.warn(`[Codeforces Service] Empty result array returned for '${handle}'`);
      return { notFound: true, message: `Codeforces handle '${handle}' not found` };
    }

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

    console.log(`[Codeforces Service] Succeeded for '${handle}': rating=${userInfo.rating || 0}, maxRating=${userInfo.maxRating || 0}, contests=${ratingHistory.length}`);
    return {
      rating: userInfo.rating || 0,
      rank: userInfo.rank || 'Unrated',
      maxRating: userInfo.maxRating || 0,
      ratingHistory,
      username: handle,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      return { rateLimited: true, message: 'Codeforces API rate limit exceeded. Please wait a minute before retrying.' };
    }
    console.error(`[Codeforces Service] Error for handle '${username}':`, error.message);
    return null;
  }
};

module.exports = { getCodeforcesStats };

