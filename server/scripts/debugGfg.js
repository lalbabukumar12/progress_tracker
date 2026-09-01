const axios = require('axios');

function parseGfgHtml(html) {
  let score = null;
  let totalSolved = null;
  let rank = 0;

  const scoreMatch = html.match(/\\?"score\\?":\s*([0-9]+)/) ||
                     html.match(/\\?"codingScore\\?":\s*([0-9]+)/) ||
                     html.match(/\\?"total_score\\?":\s*([0-9]+)/);
  if (scoreMatch) score = parseInt(scoreMatch[1], 10);

  const solvedMatch = html.match(/\\?"total_problems_solved\\?":\s*([0-9]+)/) ||
                      html.match(/\\?"totalProblemsSolved\\?":\s*([0-9]+)/) ||
                      html.match(/\\?"problemsSolved\\?":\s*([0-9]+)/);
  if (solvedMatch) totalSolved = parseInt(solvedMatch[1], 10);

  const rankMatch = html.match(/\\?"institute_rank\\?":\s*\\?"?([0-9]+)?\\?"?/) ||
                    html.match(/\\?"instituteRank\\?":\s*\\?"?([0-9]+)?\\?"?/);
  if (rankMatch && rankMatch[1]) rank = parseInt(rankMatch[1], 10);

  if (score !== null || totalSolved !== null) {
    return {
      codingScore: Number(score) || 0,
      problemsSolved: Number(totalSolved) || 0,
      instituteRank: Number(rank) || 0
    };
  }
  return null;
}

async function check(user) {
  try {
    const r = await axios.get(`https://www.geeksforgeeks.org/user/${user}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    console.log(user, '=>', parseGfgHtml(r.data));
  } catch (e) {
    console.log(user, 'Failed:', e.message);
  }
}

async function run() {
  const list = ['sandeep', 'ayush', 'aman', 'rohit'];
  for (const u of list) {
    await check(u);
  }
}
run();
