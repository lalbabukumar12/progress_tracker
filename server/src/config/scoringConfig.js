/**
 * Configurable weights and normalization targets for computing student composite scores.
 */
const SCORING_CONFIG = {
  // Platform weight contribution to total composite score (Sum = 1.0)
  WEIGHTS: {
    leetcode: 0.25,   // based on totalSolved
    codeforces: 0.20, // based on rating
    gfg: 0.20,        // based on codingScore
    codechef: 0.15,   // based on rating
    github: 0.20,     // based on a blended repoCount + contributions/followers figure
  },

  // Ceilings / baselines for normalizing raw platform stats to a 0-100 scale
  TARGETS: {
    leetcodeSolved: 500,     // 500 problems solved = 100%
    codeforcesRating: 3000,  // 3000 rating = 100%
    gfgCodingScore: 2000,    // 2000 score = 100%
    codechefRating: 3000,    // 3000 rating = 100%
    githubRepos: 50,         // 50 repos = 100% of repo component
    githubFollowers: 100,    // 100 followers = 100% of follower component
  },
};

module.exports = SCORING_CONFIG;
