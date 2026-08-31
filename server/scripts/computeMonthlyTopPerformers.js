const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../src/models/Student');
const StatsSnapshot = require('../src/models/StatsSnapshot');
const MonthlyRecord = require('../src/models/MonthlyRecord');
const { computeCompositeScore } = require('../src/services/scoringService');

/**
 * Get previous month string in YYYY-MM format
 * @param {string} monthStr - e.g. "2026-08"
 * @returns {string} - e.g. "2026-07"
 */
const getPreviousMonth = (monthStr) => {
  const [yearStr, monthNumStr] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10);

  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
};

const run = async () => {
  try {
    const targetMonth = process.argv[2] || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
      console.error('❌ Error: Month must be in YYYY-MM format (e.g. 2026-08)');
      process.exit(1);
    }

    const prevMonth = getPreviousMonth(targetMonth);
    console.log(`\n📊 Running Monthly Top Performers Computation`);
    console.log(`🎯 Target Month: ${targetMonth} (Comparing against: ${prevMonth})`);

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/progress-tracker';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB...\n');

    const students = await Student.find();
    if (students.length === 0) {
      console.log('ℹ️ No students found in database.');
      process.exit(0);
    }

    console.log(`Processing ${students.length} student(s)...`);

    const platforms = ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'];
    const calculatedRecords = [];

    for (const student of students) {
      // 1. Fetch latest snapshots
      const snapshots = await Promise.all(
        platforms.map((platform) =>
          StatsSnapshot.findOne({ studentId: student._id, platform }).sort({ fetchedAt: -1 })
        )
      );

      const stats = {
        leetcode: snapshots[0] ? snapshots[0].data : null,
        codeforces: snapshots[1] ? snapshots[1].data : null,
        github: snapshots[2] ? snapshots[2].data : null,
        gfg: snapshots[3] ? snapshots[3].data : null,
        codechef: snapshots[4] ? snapshots[4].data : null,
      };

      // 2. Compute composite score
      const compositeScore = computeCompositeScore(stats);

      // 3. Fetch previous month record
      const prevRecord = await MonthlyRecord.findOne({
        studentId: student._id,
        month: prevMonth,
      });

      const prevScore = prevRecord ? prevRecord.compositeScore : 0;
      const scoreDelta = Number((compositeScore - prevScore).toFixed(1));

      calculatedRecords.push({
        studentId: student._id,
        studentName: student.name,
        college: student.college || 'N/A',
        compositeScore,
        scoreDelta,
      });
    }

    // 4. Sort by compositeScore descending to assign rank
    calculatedRecords.sort((a, b) => b.compositeScore - a.compositeScore);

    // 5. Upsert MonthlyRecord documents
    for (let i = 0; i < calculatedRecords.length; i++) {
      const rec = calculatedRecords[i];
      rec.rank = i + 1;

      await MonthlyRecord.findOneAndUpdate(
        { studentId: rec.studentId, month: targetMonth },
        {
          compositeScore: rec.compositeScore,
          scoreDelta: rec.scoreDelta,
          rank: rec.rank,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`✅ Saved ${calculatedRecords.length} MonthlyRecord document(s) for month ${targetMonth}.\n`);

    // 6. Identify Top 3 by compositeScore
    const topPerformers = calculatedRecords.slice(0, 3);

    // 7. Identify Top 3 by scoreDelta (Most Improved)
    const mostImproved = [...calculatedRecords]
      .sort((a, b) => b.scoreDelta - a.scoreDelta)
      .slice(0, 3);

    console.log(`🏆 TOP 3 PERFORMERS (${targetMonth}):`);
    console.table(
      topPerformers.map((p) => ({
        Rank: `#${p.rank}`,
        Name: p.studentName,
        College: p.college,
        'Composite Score': p.compositeScore,
        'Score Delta': p.scoreDelta >= 0 ? `+${p.scoreDelta}` : `${p.scoreDelta}`,
      }))
    );

    console.log(`\n🚀 TOP 3 MOST IMPROVED (${targetMonth}):`);
    console.table(
      mostImproved.map((p) => ({
        Name: p.studentName,
        College: p.college,
        'Score Delta': p.scoreDelta >= 0 ? `+${p.scoreDelta}` : `${p.scoreDelta}`,
        'Current Score': p.compositeScore,
        'Overall Rank': `#${p.rank}`,
      }))
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error computing monthly records:', error.message);
    process.exit(1);
  }
};

run();
