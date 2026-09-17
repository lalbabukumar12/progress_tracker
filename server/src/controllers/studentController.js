const Student = require('../models/Student');
const StatsSnapshot = require('../models/StatsSnapshot');
const MonthlyRecord = require('../models/MonthlyRecord');
const { getCodeforcesStats } = require('../services/codeforcesService');
const { getGithubStats } = require('../services/githubService');
const { getLeetcodeStats } = require('../services/leetcodeService');
const { getGfgStats } = require('../services/gfgService');
const { getCodechefStats } = require('../services/codechefService');
const { computeCompositeScore } = require('../services/scoringService');
const { getDisplayName } = require('../utils/studentUtils');



// @desc    Get all students with their latest stats snapshots (Excludes dob, adds disambiguated displayName)
// @route   GET /api/students
// @access  Public
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    const nameCounts = {};
    students.forEach((s) => {
      const nameKey = (s.name || '').trim().toLowerCase();
      nameCounts[nameKey] = (nameCounts[nameKey] || 0) + 1;
    });

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const nameKey = (student.name || '').trim().toLowerCase();
        const isDuplicateName = nameCounts[nameKey] > 1;
        const displayName = getDisplayName(student, isDuplicateName);

        const platforms = ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'];
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

        const compositeScore = computeCompositeScore(stats);

        return {
          ...student.toPublicJSON(),
          displayName,
          stats,
          compositeScore,
        };
      })
    );

    res.status(200).json(studentsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching students' });
  }
};

// @desc    Get logged-in user's own student profile (INCLUDES dob, adds displayName)
// @route   GET /api/students/me
// @access  Private
const getMyStudentProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      const generatedRoll = `ROLL-${req.user._id.toString().slice(-6).toUpperCase()}`;
      
      let rollNumber = generatedRoll;
      const existingRoll = await Student.findOne({ rollNumber });
      if (existingRoll) {
        rollNumber = `ROLL-${Date.now().toString().slice(-6)}`;
      }

      student = await Student.create({
        userId: req.user._id,
        name: req.user.username,
        rollNumber,
        dob: null,
        college: '',
        branch: '',
        section: '',
        leetcodeUsername: '',
        codeforcesUsername: '',
        githubUsername: '',
        gfgUsername: '',
        codechefUsername: '',
        problemsSolved: 0,
      });
    }

    const platforms = ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'];
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

    const displayName = getDisplayName(student);
    const compositeScore = computeCompositeScore(stats);

    res.status(200).json({
      ...student.toObject(),
      displayName,
      stats,
      compositeScore,
      latestSnapshots: snapshots.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching user profile' });
  }
};

// @desc    Update logged-in user's own student profile
// @route   PUT /api/students/me
// @access  Private
const updateMyStudentProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found for logged in user' });
    }

    const {
      name,
      college,
      branch,
      section,
      dob,
      leetcodeUsername,
      codeforcesUsername,
      githubUsername,
      gfgUsername,
      codechefUsername,
    } = req.body;

    // Validate DOB: must be a valid date in the past
    if (dob !== undefined && dob !== null && dob !== '') {
      const parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
        return res.status(400).json({ message: 'Date of birth must be a valid past date' });
      }
      student.dob = parsedDob;
    }

    const needsRefresh = {
      leetcode: false,
      codeforces: false,
      github: false,
      gfg: false,
      codechef: false,
    };

    if (name !== undefined) student.name = typeof name === 'string' ? name.trim() : name;
    if (college !== undefined) student.college = typeof college === 'string' ? college.trim() : college;
    if (branch !== undefined) student.branch = typeof branch === 'string' ? branch.trim() : branch;
    if (section !== undefined) student.section = typeof section === 'string' ? section.trim() : section;

    // Detect username changes and mark needsRefresh
    if (leetcodeUsername !== undefined) {
      const trimmed = typeof leetcodeUsername === 'string' ? leetcodeUsername.trim() : '';
      if (trimmed !== (student.leetcodeUsername || '')) {
        student.leetcodeUsername = trimmed;
        needsRefresh.leetcode = true;
      }
    }

    if (codeforcesUsername !== undefined) {
      const trimmed = typeof codeforcesUsername === 'string' ? codeforcesUsername.trim() : '';
      if (trimmed !== (student.codeforcesUsername || '')) {
        student.codeforcesUsername = trimmed;
        needsRefresh.codeforces = true;
      }
    }

    if (githubUsername !== undefined) {
      const trimmed = typeof githubUsername === 'string' ? githubUsername.trim() : '';
      if (trimmed !== (student.githubUsername || '')) {
        student.githubUsername = trimmed;
        needsRefresh.github = true;
      }
    }

    if (gfgUsername !== undefined) {
      const trimmed = typeof gfgUsername === 'string' ? gfgUsername.trim() : '';
      if (trimmed !== (student.gfgUsername || '')) {
        student.gfgUsername = trimmed;
        needsRefresh.gfg = true;
      }
    }

    if (codechefUsername !== undefined) {
      const trimmed = typeof codechefUsername === 'string' ? codechefUsername.trim() : '';
      if (trimmed !== (student.codechefUsername || '')) {
        student.codechefUsername = trimmed;
        needsRefresh.codechef = true;
      }
    }

    // Do NOT allow editing of userId, _id, or compositeScore directly through this route
    const updatedStudent = await student.save();
    const displayName = getDisplayName(updatedStudent);

    res.status(200).json({
      ...updatedStudent.toObject(),
      displayName,
      needsRefresh,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
};

// @desc    Get student by ID with latest stats snapshots
// @route   GET /api/students/:id
// @access  Public
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const platforms = ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'];
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

    const displayName = getDisplayName(student);
    const compositeScore = computeCompositeScore(stats);

    res.status(200).json({
      ...student.toPublicJSON(),
      displayName,
      stats,
      compositeScore,
      latestSnapshots: snapshots.filter(Boolean),
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error fetching student' });
  }
};




// @desc    Increment local practice problemsSolved counter for the logged-in student
// @route   PATCH /api/students/increment-solved
// @access  Private
const incrementProblemsSolved = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      const generatedRoll = `ROLL-${req.user._id.toString().slice(-6).toUpperCase()}`;
      let rollNumber = generatedRoll;
      const existingRoll = await Student.findOne({ rollNumber });
      if (existingRoll) {
        rollNumber = `ROLL-${Date.now().toString().slice(-6)}`;
      }

      student = await Student.create({
        userId: req.user._id,
        name: req.user.username,
        rollNumber,
        dob: null,
        college: '',
        branch: '',
        section: '',
        leetcodeUsername: '',
        codeforcesUsername: '',
        githubUsername: '',
        gfgUsername: '',
        codechefUsername: '',
        problemsSolved: 1,
      });
    } else {
      student.problemsSolved = (student.problemsSolved || 0) + 1;
      await student.save();
    }

    const displayName = getDisplayName(student);

    res.status(200).json({
      message: 'Problems solved counter incremented successfully',
      problemsSolved: student.problemsSolved,
      student: {
        ...student.toPublicJSON(),
        displayName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating problems solved count' });
  }
};

// @desc    Fetch & refresh stats from platforms and save StatsSnapshot documents
// @route   POST /api/students/:id/refresh-stats
// @access  Public
const refreshStudentStats = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const requestedPlatform = req.query.platform || req.body?.platform;
    const directUsername =
      req.body?.username ||
      req.query?.username ||
      req.body?.leetcodeUsername ||
      req.body?.codeforcesUsername ||
      req.body?.githubUsername ||
      req.body?.gfgUsername ||
      req.body?.codechefUsername;

    const platformFetchers = [
      {
        platform: 'leetcode',
        username: (requestedPlatform === 'leetcode' && directUsername) ? directUsername : student.leetcodeUsername,
        fn: getLeetcodeStats,
      },
      {
        platform: 'codeforces',
        username: (requestedPlatform === 'codeforces' && directUsername) ? directUsername : student.codeforcesUsername,
        fn: getCodeforcesStats,
      },
      {
        platform: 'github',
        username: (requestedPlatform === 'github' && directUsername) ? directUsername : student.githubUsername,
        fn: getGithubStats,
      },
      {
        platform: 'gfg',
        username: (requestedPlatform === 'gfg' && directUsername) ? directUsername : student.gfgUsername,
        fn: getGfgStats,
      },
      {
        platform: 'codechef',
        username: (requestedPlatform === 'codechef' && directUsername) ? directUsername : student.codechefUsername,
        fn: getCodechefStats,
      },
    ];

    const activeFetchers = requestedPlatform
      ? platformFetchers.filter((p) => p.platform.toLowerCase() === requestedPlatform.toString().toLowerCase())
      : platformFetchers;

    const results = await Promise.allSettled(
      activeFetchers.map(async ({ platform, username, fn }) => {
        if (!username || !username.trim()) {
          return { platform, status: 'skipped', reason: 'No username configured', data: null };
        }
        const trimmedUser = username.trim();
        const data = await fn(trimmedUser);
        if (!data || data.rateLimited || data.notFound || data.error) {
          const platformLabels = {
            leetcode: 'LeetCode',
            codeforces: 'Codeforces',
            github: 'GitHub',
            gfg: 'GeeksforGeeks',
            codechef: 'CodeChef',
          };
          const pLabel = platformLabels[platform.toLowerCase()] || platform.toUpperCase();
          const errorMsg =
            data?.message ||
            `Couldn't verify this ${pLabel} username right now, the source may be temporarily unavailable`;
          throw new Error(errorMsg);
        }
        const snap = await StatsSnapshot.create({
          studentId: student._id,
          platform,
          data,
        });
        return { platform, status: 'fulfilled', data, snapshot: snap };
      })
    );

    const summary = {
      succeeded: [],
      failed: [],
      skipped: [],
    };
    const createdSnapshots = [];
    const responsePayload = {};

    results.forEach((result, idx) => {
      const platform = activeFetchers[idx].platform;
      if (result.status === 'fulfilled') {
        if (result.value.status === 'skipped') {
          summary.skipped.push(platform);
          responsePayload[platform] = null;
        } else {
          summary.succeeded.push(platform);
          responsePayload[platform] = result.value.data;
          createdSnapshots.push(result.value.snapshot);
        }
      } else {
        summary.failed.push({
          platform,
          reason: result.reason?.message || 'Fetch failed',
        });
        responsePayload[platform] = null;
      }
    });

    res.status(200).json({
      studentId: student._id,
      summary,
      snapshots: createdSnapshots,
      ...responsePayload,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error refreshing student stats' });
  }
};



// @desc    Compare two students and get their profiles & latest stats snapshots
// @route   GET /api/students/compare?a=id1&b=id2
// @access  Public
const compareStudents = async (req, res) => {
  try {
    const { a, b } = req.query;

    if (!a || !b) {
      return res.status(400).json({ message: 'Both student IDs (a and b) are required for comparison' });
    }

    const [studentA, studentB] = await Promise.all([
      Student.findById(a),
      Student.findById(b),
    ]);

    if (!studentA || !studentB) {
      return res.status(404).json({
        message: !studentA && !studentB
          ? 'Neither student was found'
          : !studentA
          ? `Student A (${a}) not found`
          : `Student B (${b}) not found`,
      });
    }

    const platforms = ['leetcode', 'codeforces', 'github', 'gfg', 'codechef'];

    const [snapshotsA, snapshotsB] = await Promise.all([
      Promise.all(
        platforms.map((platform) =>
          StatsSnapshot.findOne({ studentId: studentA._id, platform }).sort({ fetchedAt: -1 })
        )
      ),
      Promise.all(
        platforms.map((platform) =>
          StatsSnapshot.findOne({ studentId: studentB._id, platform }).sort({ fetchedAt: -1 })
        )
      ),
    ]);

    const statsA = {
      leetcode: snapshotsA[0] ? snapshotsA[0].data : null,
      codeforces: snapshotsA[1] ? snapshotsA[1].data : null,
      github: snapshotsA[2] ? snapshotsA[2].data : null,
      gfg: snapshotsA[3] ? snapshotsA[3].data : null,
      codechef: snapshotsA[4] ? snapshotsA[4].data : null,
    };

    const statsB = {
      leetcode: snapshotsB[0] ? snapshotsB[0].data : null,
      codeforces: snapshotsB[1] ? snapshotsB[1].data : null,
      github: snapshotsB[2] ? snapshotsB[2].data : null,
      gfg: snapshotsB[3] ? snapshotsB[3].data : null,
      codechef: snapshotsB[4] ? snapshotsB[4].data : null,
    };

    const displayNameA = getDisplayName(studentA);
    const displayNameB = getDisplayName(studentB);

    const compositeScoreA = computeCompositeScore(statsA);
    const compositeScoreB = computeCompositeScore(statsB);

    res.status(200).json({
      studentA: {
        ...studentA.toPublicJSON(),
        displayName: displayNameA,
        stats: statsA,
        compositeScore: compositeScoreA,
      },
      studentB: {
        ...studentB.toPublicJSON(),
        displayName: displayNameB,
        stats: statsB,
        compositeScore: compositeScoreB,
      },
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error comparing students' });
  }
};

// @desc    Get monthly top performers and most improved students
// @route   GET /api/monthly-top-performers?month=YYYY-MM
// @access  Public
const getMonthlyTopPerformers = async (req, res) => {
  try {
    let { month } = req.query;

    // If no month is provided, default to current month or latest available month in DB
    if (!month) {
      const latestRecord = await MonthlyRecord.findOne().sort({ month: -1 });
      month = latestRecord ? latestRecord.month : new Date().toISOString().slice(0, 7);
    }

    const records = await MonthlyRecord.find({ month })
      .populate('studentId')
      .sort({ compositeScore: -1 });

    // Filter valid records where student exists
    const validRecords = records.filter((r) => r.studentId);

    // Format top 3 by composite score
    const topPerformers = validRecords.slice(0, 3).map((r) => {
      const student = r.studentId;
      return {
        _id: student._id,
        name: student.name,
        displayName: getDisplayName(student),
        college: student.college,
        branch: student.branch,
        section: student.section,
        compositeScore: r.compositeScore,
        scoreDelta: r.scoreDelta,
        rank: r.rank,
        leetcodeUsername: student.leetcodeUsername,
        codeforcesUsername: student.codeforcesUsername,
        githubUsername: student.githubUsername,
        gfgUsername: student.gfgUsername,
        codechefUsername: student.codechefUsername,
      };
    });

    // Format top 3 most improved (sorted by scoreDelta desc)
    const mostImproved = [...validRecords]
      .sort((a, b) => b.scoreDelta - a.scoreDelta)
      .slice(0, 3)
      .map((r) => {
        const student = r.studentId;
        return {
          _id: student._id,
          name: student.name,
          displayName: getDisplayName(student),
          college: student.college,
          branch: student.branch,
          section: student.section,
          compositeScore: r.compositeScore,
          scoreDelta: r.scoreDelta,
          rank: r.rank,
          leetcodeUsername: student.leetcodeUsername,
          codeforcesUsername: student.codeforcesUsername,
          githubUsername: student.githubUsername,
          gfgUsername: student.gfgUsername,
          codechefUsername: student.codechefUsername,
        };
      });

    res.status(200).json({
      month,
      topPerformers,
      mostImproved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching monthly top performers' });
  }
};

module.exports = {
  getAllStudents,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
  incrementProblemsSolved,
  refreshStudentStats,
  compareStudents,
  getMonthlyTopPerformers,
};
