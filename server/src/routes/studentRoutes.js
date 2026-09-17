const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
  incrementProblemsSolved,
  refreshStudentStats,
  compareStudents,
  getMonthlyTopPerformers,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Route for directory listing (read-only): GET /api/students
router.get('/', getAllStudents);

// Route for monthly top performers: GET /api/students/monthly-top-performers
router.get('/monthly-top-performers', getMonthlyTopPerformers);

// Route for comparing two students: GET /api/students/compare?a=id1&b=id2
router.get('/compare', compareStudents);

// Protected routes for logged in user's own profile: GET & PUT /api/students/me
router.route('/me')
  .get(protect, getMyStudentProfile)
  .put(protect, updateMyStudentProfile);

// Protected route for incrementing problems solved for logged-in user: PATCH /api/students/increment-solved
router.patch('/increment-solved', protect, incrementProblemsSolved);
router.patch('/me/increment-solved', protect, incrementProblemsSolved);

// Protected route for /api/students/:id/refresh-stats
router.post('/:id/refresh-stats', protect, refreshStudentStats);

// Route for single student details: GET /api/students/:id
router.get('/:id', getStudentById);

module.exports = router;
