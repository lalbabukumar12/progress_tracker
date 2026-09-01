const axios = require('axios');

/**
 * Fetch CodeChef statistics for a user with detailed server logging and multiple strategies
 * @param {string} username - CodeChef username/handle
 * @returns {Promise<Object|null>} Normalized stats object or null on failure
 */
const getCodechefStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();
  const directUrl = `https://www.codechef.com/users/${encodeURIComponent(user)}`;

  // Strategy 1: Direct profile page scraping with full browser headers
  try {
    console.log(`[CodeChef Service] Fetching direct profile URL: ${directUrl}`);
    const response = await axios.get(directUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const html = response.data;
    if (!html || typeof html !== 'string') {
      console.warn(`[CodeChef Service] Empty response body for URL: ${directUrl} (Status: ${response.status})`);
    } else if (html.includes('Could not find page you are looking for') || response.status === 404) {
      console.warn(`[CodeChef Service] User '${user}' not found on CodeChef (404 / Missing page)`);
      return null;
    } else if (html.includes('challenge-platform') || html.includes('Just a moment...')) {
      console.warn(
        `[CodeChef Service] Blocked by Cloudflare anti-bot challenge for '${user}'. URL: ${directUrl} | Status: ${response.status}`
      );
    } else {
      let rating = 0;
      let stars = '1★';
      let globalRank = 0;
      let problemsSolved = 0;
      let highestRating = 0;
      let foundData = false;

      // Rating & highest rating extraction from embedded all_rating history chart
      const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[^;]+\]);/);
      if (allRatingMatch && allRatingMatch[1]) {
        try {
          const ratingHistory = JSON.parse(allRatingMatch[1]);
          if (Array.isArray(ratingHistory) && ratingHistory.length > 0) {
            const latest = ratingHistory[ratingHistory.length - 1];
            rating = Number(latest.rating) || 0;
            highestRating = Math.max(...ratingHistory.map((r) => Number(r.rating) || 0));
            foundData = true;
          }
        } catch (e) {
          // ignore json parse error
        }
      }

      // Fallback rating extraction from HTML elements
      if (!rating) {
        const ratingMatch =
          html.match(/<div class="rating-number">([^<]+)<\/div>/i) ||
          html.match(/class="rating-number"[^>]*>([0-9]+)/i) ||
          html.match(/rating-header[^>]*>\s*([0-9]+)/i);
        if (ratingMatch) {
          rating = parseInt(ratingMatch[1].trim(), 10);
          foundData = true;
        }
      }

      // Stars extraction: e.g. <span class="rating">1★</span> or 7&#9733; or class="rating-star"
      const starMatch =
        html.match(/class="rating-star"[^>]*>([0-9★]+)/i) ||
        html.match(/(\d+)\s*&#9733;/) ||
        html.match(/<span class="rating"[^>]*>([^<]+)<\/span>/i) ||
        html.match(/(\d+★)/);
      if (starMatch) {
        const rawStar = starMatch[1].trim();
        stars = rawStar.includes('★') ? rawStar : `${rawStar}★`;
      }

      // Global rank extraction: Global Rank</strong> <a ...> 12345 </a>
      const rankMatch = html.match(/Global Rank[^0-9]*([0-9]+)/i);
      if (rankMatch) {
        globalRank = parseInt(rankMatch[1], 10);
        foundData = true;
      }

      // Problems solved extraction: Fully Solved (123) or Total Problems Solved
      const solvedMatch =
        html.match(/Fully Solved\s*\(([0-9]+)\)/i) ||
        html.match(/Total Problems Solved:[^0-9]*([0-9]+)/i) ||
        html.match(/Problems Solved[^0-9]*([0-9]+)/i);
      if (solvedMatch) {
        problemsSolved = parseInt(solvedMatch[1], 10);
        foundData = true;
      }

      if (foundData || rating > 0 || problemsSolved > 0) {
        console.log(
          `[CodeChef Service] Successfully parsed direct profile for '${user}': rating=${rating}, stars=${stars}, rank=${globalRank}, solved=${problemsSolved}`
        );
        return {
          rating: Number(rating) || 0,
          stars,
          globalRank: Number(globalRank) || 0,
          problemsSolved: Number(problemsSolved) || 0,
          highestRating: Number(highestRating || rating) || 0,
          username: user,
        };
      }

      console.warn(
        `[CodeChef Service] Direct scrape yielded no stats for '${user}'. URL: ${directUrl} | Status: ${response.status} | Response preview: ${html.slice(0, 500)}`
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
      `[CodeChef Service] Direct fetch failed for '${user}'. Requested URL: ${directUrl} | HTTP Status: ${statusCode} | Error: ${error.message} | Response Body (first 500 chars): ${preview}`
    );
  }

  // Strategy 2: Community API Fallback (codechef-api)
  const apiUrl = `https://codechef-api.vercel.app/handle/${encodeURIComponent(user)}`;
  try {
    console.log(`[CodeChef Service] Attempting API fallback: ${apiUrl}`);
    const res = await axios.get(apiUrl, { timeout: 6000 });
    if (res.data && (res.data.currentRating || res.data.rating || res.data.stars)) {
      const data = res.data;
      console.log(`[CodeChef Service] Community API succeeded for '${user}'`);
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
    const statusCode = apiErr.response?.status || 'NO_STATUS';
    const preview = typeof apiErr.response?.data === 'string'
      ? apiErr.response.data.slice(0, 500)
      : apiErr.response?.data
      ? JSON.stringify(apiErr.response.data).slice(0, 500)
      : apiErr.message;

    console.warn(
      `[CodeChef Service] Community API fallback failed for '${user}'. Requested URL: ${apiUrl} | HTTP Status: ${statusCode} | Response Body: ${preview}`
    );
  }

  console.warn(`[CodeChef Service] All fetch strategies failed for CodeChef user '${user}'`);
  return null;
};

module.exports = { getCodechefStats };
