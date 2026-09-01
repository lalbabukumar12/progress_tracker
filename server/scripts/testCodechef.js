const axios = require('axios');

async function testCodechef(user) {
  try {
    const res = await axios.get(`https://www.codechef.com/users/${encodeURIComponent(user)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });
    const html = res.data;
    
    // Check all_rating JS variable
    const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[^;]+\]);/);
    if (allRatingMatch) {
      try {
        const ratingHistory = JSON.parse(allRatingMatch[1]);
        if (Array.isArray(ratingHistory) && ratingHistory.length > 0) {
          const latest = ratingHistory[ratingHistory.length - 1];
          const maxRating = Math.max(...ratingHistory.map(r => Number(r.rating) || 0));
          console.log('Parsed all_rating: latest rating =', latest.rating, 'highest =', maxRating);
        }
      } catch (e) {
        console.log('Error parsing all_rating JSON:', e.message);
      }
    }

    // Check stars
    const starMatch = html.match(/class="rating-star"[^>]*>([0-9★]+)/i) || 
                      html.match(/<span class="rating"[^>]*>([^<]+)<\/span>/i) ||
                      html.match(/(\d+★)/) ||
                      html.match(/(\d+)\s*&#9733;/);
    console.log('Star match:', starMatch?.[0], '=>', starMatch?.[1]);

    // Check rating number in div
    const ratingNumMatch = html.match(/<div class="rating-number">([^<]+)<\/div>/i);
    console.log('rating-number div:', ratingNumMatch?.[1]);

    // Check global rank
    const rankMatch = html.match(/Global Rank[^0-9]*([0-9]+)/i);
    console.log('Global rank:', rankMatch?.[1]);

    // Check solved
    const solvedMatch = html.match(/Fully Solved\s*\(([0-9]+)\)/i) || 
                        html.match(/Total Problems Solved:[^0-9]*([0-9]+)/i);
    console.log('Solved:', solvedMatch?.[1]);

  } catch (err) {
    console.log(`[CodeChef] Error:`, err.message);
  }
}

async function run() {
  await testCodechef('gennady.korotkevich');
  await testCodechef('krishnakt3xb');
}
run();
