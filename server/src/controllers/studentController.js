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

// @desc    Create a new student
// @route   POST /api/students
// @access  Public
const createStudent = async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      dob,
      college,
      branch,
      section,
      leetcodeUsername,
      codeforcesUsername,
      githubUsername,
      gfgUsername,
      codechefUsername,
    } = req.body;

    if (!name || !rollNumber) {
      return res.status(400).json({ message: 'Name and roll number are required' });
    }

    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ message: `Student with roll number '${rollNumber}' already exists` });
    }

    let parsedDob = null;
    if (dob) {
      parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
        return res.status(400).json({ message: 'Date of birth must be a valid past date' });
      }
    }

    const studentData = {
      name,
      rollNumber,
      dob: parsedDob,
      college: college || '',
      branch: branch || '',
      section: section || '',
      leetcodeUsername: leetcodeUsername || '',
      codeforcesUsername: codeforcesUsername || '',
      githubUsername: githubUsername || '',
      gfgUsername: gfgUsername || '',
      codechefUsername: codechefUsername || '',
      problemsSolved: 0,
    };

    if (req.user) {
      studentData.userId = req.user._id;
    }

    const student = await Student.create(studentData);
    const displayName = getDisplayName(student);

    res.status(201).json({
      ...student.toPublicJSON(),
      displayName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error creating student' });
  }
};

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

// @desc    Update student by ID
// @route   PUT /api/students/:id
// @access  Public
const updateStudent = async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      dob,
      college,
      branch,
      section,
      leetcodeUsername,
      codeforcesUsername,
      githubUsername,
      gfgUsername,
      codechefUsername,
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (rollNumber && rollNumber !== student.rollNumber) {
      const existing = await Student.findOne({ rollNumber });
      if (existing) {
        return res.status(400).json({ message: `Roll number '${rollNumber}' is already in use` });
      }
    }

    if (dob !== undefined) {
      const parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime()) || parsedDob >= new Date()) {
        return res.status(400).json({ message: 'Date of birth must be a valid past date' });
      }
      student.dob = parsedDob;
    }

    student.name = name !== undefined ? name : student.name;
    student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
    student.college = college !== undefined ? college : student.college;
    student.branch = branch !== undefined ? branch : student.branch;
    student.section = section !== undefined ? section : student.section;
    student.leetcodeUsername = leetcodeUsername !== undefined ? leetcodeUsername : student.leetcodeUsername;
    student.codeforcesUsername = codeforcesUsername !== undefined ? codeforcesUsername : student.codeforcesUsername;
    student.githubUsername = githubUsername !== undefined ? githubUsername : student.githubUsername;
    student.gfgUsername = gfgUsername !== undefined ? gfgUsername : student.gfgUsername;
    student.codechefUsername = codechefUsername !== undefined ? codechefUsername : student.codechefUsername;

    const updatedStudent = await student.save();
    const displayName = getDisplayName(updatedStudent);

    res.status(200).json({
      ...updatedStudent.toPublicJSON(),
      displayName,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error updating student' });
  }
};


// @desc    Increment local practice problemsSolved counter for a student
// @route   PATCH /api/students/:id/increment-solved
// @access  Public
const incrementProblemsSolved = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $inc: { problemsSolved: 1 } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
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
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
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

// @desc    Admin edit student profile
// @route   PUT /api/students/:id/admin-edit
// @access  Private/Admin
const adminEditStudent = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const {
      name,
      college,
      branch,
      section,
      leetcodeUsername,
      codeforcesUsername,
      githubUsername,
      gfgUsername,
      codechefUsername,
    } = req.body;

    const needsRefresh = {
      leetcode: false,
      codeforces: false,
      github: false,
      gfg: false,
      codechef: false,
    };

    if (name !== undefined) student.name = name;
    if (college !== undefined) student.college = college;
    if (branch !== undefined) student.branch = branch;
    if (section !== undefined) student.section = section;

    if (leetcodeUsername !== undefined && leetcodeUsername.trim() !== student.leetcodeUsername) {
      student.leetcodeUsername = leetcodeUsername.trim();
      needsRefresh.leetcode = true;
    }

    if (codeforcesUsername !== undefined && codeforcesUsername.trim() !== student.codeforcesUsername) {
      student.codeforcesUsername = codeforcesUsername.trim();
      needsRefresh.codeforces = true;
    }

    if (githubUsername !== undefined && githubUsername.trim() !== student.githubUsername) {
      student.githubUsername = githubUsername.trim();
      needsRefresh.github = true;
    }

    if (gfgUsername !== undefined && gfgUsername.trim() !== student.gfgUsername) {
      student.gfgUsername = gfgUsername.trim();
      needsRefresh.gfg = true;
    }

    if (codechefUsername !== undefined && codechefUsername.trim() !== student.codechefUsername) {
      student.codechefUsername = codechefUsername.trim();
      needsRefresh.codechef = true;
    }

    const updatedStudent = await student.save();
    const displayName = getDisplayName(updatedStudent);

    res.status(200).json({
      ...updatedStudent.toObject(),
      displayName,
      needsRefresh,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error updating profile as admin' });
  }
};

// @desc    Delete single student by ID (Admin Only)
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {


    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade deletion of StatsSnapshot records
    await StatsSnapshot.deleteMany({ studentId: student._id });

    // Delete Student document
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Student and related stats snapshots deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    res.status(500).json({ message: error.message || 'Server error deleting student profile' });
  }
};

// @desc    Bulk delete student profiles by IDs (Admin Only)
// @route   POST /api/students/bulk-delete
// @access  Private/Admin
const bulkDeleteStudents = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Array of student IDs is required for bulk deletion' });
    }

    // Cascade delete all matching StatsSnapshots
    await StatsSnapshot.deleteMany({ studentId: { $in: ids } });

    // Delete matching Student documents
    const result = await Student.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      message: `${result.deletedCount} student profile(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error during bulk deletion' });
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
  createStudent,
  getAllStudents,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
  updateStudent,
  incrementProblemsSolved,
  refreshStudentStats,
  adminEditStudent,
  deleteStudent,
  bulkDeleteStudents,
  compareStudents,
  getMonthlyTopPerformers,
};
