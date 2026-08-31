const axios = require('axios');

/**
 * Fetch CodeChef statistics for a user using community APIs with scraping fallback
 * @param {string} username - CodeChef username/handle
 * @returns {Promise<Object|null>} Normalized stats object or null on failure
 */
const getCodechefStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();

  // Try API Wrapper 1: codechef-api.vercel.app
  try {
    const res = await axios.get(`https://codechef-api.vercel.app/handle/${encodeURIComponent(user)}`, {
      timeout: 6000,
    });
    if (res.data && (res.data.currentRating || res.data.rating || res.data.stars)) {
      const data = res.data;
      return {
        rating: Number(data.currentRating || data.rating) || 0,
        stars: typeof data.stars === 'string' ? data.stars : `${data.stars || 1}★`,
        globalRank: Number(data.globalRank || data.global_rank) || 0,
        problemsSolved: Number(data.totalProblemsSolved || data.problemsSolved || data.fullySolved?.count) || 0,
        highestRating: Number(data.highestRating || data.maxRating) || 0,
        username: user,
      };
    }
  } catch (apiErr) {
    // Try API Wrapper 2: competitive-coding-api.herokuapp.com
    try {
      const res = await axios.get(`https://competitive-coding-api.herokuapp.com/api/codechef/${encodeURIComponent(user)}`, {
        timeout: 6000,
      });
      if (res.data && res.data.status === 200 && res.data.rating) {
        const data = res.data;
        return {
          rating: Number(data.rating) || 0,
          stars: data.stars || '1★',
          globalRank: Number(data.global_rank) || 0,
          problemsSolved: Number(data.fully_solved?.count || data.problems_solved) || 0,
          highestRating: Number(data.highest_rating) || 0,
          username: user,
        };
      }
    } catch (apiErr2) {
      // Fall back to direct profile HTML scraping
    }
  }

  // Fallback: Direct scraping of CodeChef profile page
  try {
    const response = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 8000,
    });

    const html = response.data;
    if (!html || typeof html !== 'string') {
      console.warn(`[CodeChef Service] Empty profile page for user '${user}'`);
      return null;
    }

    if (html.includes('Could not find page you are looking for') || response.status === 404) {
      console.warn(`[CodeChef Service] User '${user}' not found on CodeChef`);
      return null;
    }

    let rating = 0;
    let stars = '1★';
    let globalRank = 0;
    let problemsSolved = 0;

    // Rating extraction: <div class="rating-number">1542</div>
    const ratingMatch = html.match(/class="rating-number"[^>]*>([0-9]+)/i) || html.match(/rating-header[^>]*>\s*([0-9]+)/i);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
    }

    // Stars extraction: <span class="rating">1★</span> or rating-star
    const starMatch = html.match(/class="rating-star"[^>]*>([0-9★]+)/i) || html.match(/<span class="rating"[^>]*>([^<]+)<\/span>/i);
    if (starMatch) {
      stars = starMatch[1].trim();
    }

    // Global rank extraction: Global Rank</strong> <a ...> 12345 </a>
    const rankMatch = html.match(/Global Rank[^0-9]*([0-9]+)/i);
    if (rankMatch) {
      globalRank = parseInt(rankMatch[1], 10);
    }

    // Problems solved extraction: Fully Solved (123) or Total Problems Solved
    const solvedMatch = html.match(/Fully Solved\s*\(([0-9]+)\)/i) || html.match(/Total Problems Solved:[^0-9]*([0-9]+)/i);
    if (solvedMatch) {
      problemsSolved = parseInt(solvedMatch[1], 10);
    }

    return {
      rating: Number(rating) || 0,
      stars,
      globalRank: Number(globalRank) || 0,
      problemsSolved: Number(problemsSolved) || 0,
      username: user,
    };
  } catch (error) {
    console.warn(`[CodeChef Service] Error fetching stats for user '${username}':`, error.message);
    return null;
  }
};

module.exports = { getCodechefStats };
