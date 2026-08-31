const axios = require('axios');

/**
 * Fetch GitHub statistics for a user
 * @param {string} username - GitHub username
 * @returns {Promise<Object|null>} Normalized stats object or rate-limited error object
 */
const getGithubStats = async (username) => {
  if (!username || typeof username !== 'string' || !username.trim()) {
    return null;
  }

  const user = username.trim();
  const headers = {
    'User-Agent': 'Progress-Tracker-App',
    'Accept': 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  try {
    const [userRes, reposRes] = await Promise.allSettled([
      axios.get(`https://api.github.com/users/${user}`, { headers, timeout: 8000 }),
      axios.get(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`, { headers, timeout: 8000 }),
    ]);

    if (
      (userRes.status === 'rejected' && (userRes.reason?.response?.status === 429 || userRes.reason?.response?.status === 403)) ||
      (reposRes.status === 'rejected' && (reposRes.reason?.response?.status === 429 || reposRes.reason?.response?.status === 403))
    ) {
      return { rateLimited: true, message: 'GitHub API rate limit exceeded. Please try again in a minute.' };
    }

    if (userRes.status !== 'fulfilled') {
      return null;
    }

    const userData = userRes.value.data;
    const reposData = reposRes.status === 'fulfilled' && Array.isArray(reposRes.value.data) ? reposRes.value.data : [];

    const topRepos = reposData
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 5)
      .map((repo) => ({
        name: repo.name,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language || 'Unknown',
        url: repo.html_url,
      }));

    return {
      repoCount: userData.public_repos || reposData.length,
      followers: userData.followers || 0,
      publicRepos: userData.public_repos || 0,
      topRepos,
    };
  } catch (error) {
    if (error.response?.status === 429 || error.response?.status === 403) {
      return { rateLimited: true, message: 'GitHub API rate limit exceeded. Please try again in a minute.' };
    }
    console.error(`GitHub service error for user '${username}':`, error.message);
    return null;
  }
};

module.exports = { getGithubStats };
