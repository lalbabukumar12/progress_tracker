const { executeCode } = require('../services/judge0Service');

// @desc    Execute code using Judge0 API
// @route   POST /api/execute
// @access  Public
const handleCodeExecution = async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Source code is required' });
    }

    if (!language) {
      return res.status(400).json({ message: 'Language specification is required' });
    }

    const result = await executeCode({ language, code, stdin });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      stdout: '',
      stderr: error.message || 'Internal server error executing code',
      status: 'Server Error',
      time: '0 s',
      memory: '0 KB',
    });
  }
};

module.exports = { handleCodeExecution };
