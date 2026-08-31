const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
  updateStudent,
  incrementProblemsSolved,
  refreshStudentStats,
  deleteStudent,
  bulkDeleteStudents,
  adminEditStudent,
  compareStudents,
  getMonthlyTopPerformers,
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Routes for /api/students
router.route('/')
  .post(createStudent)
  .get(getAllStudents);

// Route for monthly top performers: GET /api/students/monthly-top-performers
router.get('/monthly-top-performers', getMonthlyTopPerformers);

// Route for comparing two students: GET /api/students/compare?a=id1&b=id2
router.get('/compare', compareStudents);

// Protected routes for logged in user's own profile: GET & PUT /api/students/me
router.route('/me')
  .get(protect, getMyStudentProfile)
  .put(protect, updateMyStudentProfile);

// Admin-only route for bulk deletion: POST /api/students/bulk-delete
router.post('/bulk-delete', protect, adminOnly, bulkDeleteStudents);

// Protected route for /api/students/:id/admin-edit (Admin only)
router.put('/:id/admin-edit', protect, adminOnly, adminEditStudent);

// Protected route for /api/students/:id/refresh-stats
router.post('/:id/refresh-stats', protect, refreshStudentStats);

// Route for /api/students/:id/increment-solved
router.patch('/:id/increment-solved', incrementProblemsSolved);

// Routes for /api/students/:id
router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(protect, deleteStudent);

module.exports = router;
