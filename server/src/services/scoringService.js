const { WEIGHTS, TARGETS } = require('../config/scoringConfig');

/**
 * Computes a normalized composite score (0-100) for a student from their latest stats snapshots.
 *
 * @param {Object|Array} statsSnapshot - Either a stats map { leetcode: {...}, ... } or an array of StatsSnapshot docs
 * @returns {number} Normalized composite score between 0.0 and 100.0
 */
const computeCompositeScore = (statsSnapshot) => {
  if (!statsSnapshot) return 0;

  let stats = {};

  // If passed an array of snapshot documents, transform into platform map
  if (Array.isArray(statsSnapshot)) {
    statsSnapshot.forEach((snap) => {
      if (snap && snap.platform && snap.data) {
        stats[snap.platform] = snap.data;
      }
    });
  } else if (typeof statsSnapshot === 'object') {
    stats = statsSnapshot;
  }

  // 1. LeetCode Normalized Score (0-100): based on totalSolved / 500
  const leetcodeData = stats.leetcode || {};
  const leetcodeSolved = Number(leetcodeData.totalSolved || 0);
  const leetcodeNorm = Math.min(100, Math.max(0, (leetcodeSolved / TARGETS.leetcodeSolved) * 100));

  // 2. Codeforces Normalized Score (0-100): based on rating / 3000
  const codeforcesData = stats.codeforces || {};
  const codeforcesRating = Number(codeforcesData.rating || 0);
  const codeforcesNorm = Math.min(100, Math.max(0, (codeforcesRating / TARGETS.codeforcesRating) * 100));

  // 3. GFG Normalized Score (0-100): based on codingScore / 2000
  const gfgData = stats.gfg || {};
  const gfgScore = Number(gfgData.codingScore || gfgData.score || 0);
  const gfgNorm = Math.min(100, Math.max(0, (gfgScore / TARGETS.gfgCodingScore) * 100));

  // 4. CodeChef Normalized Score (0-100): based on rating / 3000
  const codechefData = stats.codechef || {};
  const codechefRating = Number(codechefData.rating || 0);
  const codechefNorm = Math.min(100, Math.max(0, (codechefRating / TARGETS.codechefRating) * 100));

  // 5. GitHub Normalized Score (0-100): blended repoCount (70%) + followers/contributions (30%)
  const githubData = stats.github || {};
  const githubRepos = Number(githubData.repoCount || githubData.publicRepos || 0);
  const githubFollowers = Number(githubData.followers || 0);
  const repoNorm = Math.min(100, Math.max(0, (githubRepos / TARGETS.githubRepos) * 100));
  const followerNorm = Math.min(100, Math.max(0, (githubFollowers / TARGETS.githubFollowers) * 100));
  const githubNorm = Math.min(100, Math.max(0, repoNorm * 0.7 + followerNorm * 0.3));

  // Calculate weighted sum
  const composite =
    leetcodeNorm * (WEIGHTS.leetcode || 0.25) +
    codeforcesNorm * (WEIGHTS.codeforces || 0.20) +
    gfgNorm * (WEIGHTS.gfg || 0.20) +
    codechefNorm * (WEIGHTS.codechef || 0.15) +
    githubNorm * (WEIGHTS.github || 0.20);

  // Return single 0-100 number rounded to 1 decimal place
  return Number(Math.min(100, Math.max(0, composite)).toFixed(1));
};

module.exports = {
  computeCompositeScore,
};
