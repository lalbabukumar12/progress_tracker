const axios = require('axios');

const LANGUAGE_MAP = {
  python: 71,   // Python (3.8.1)
  py: 71,
  cpp: 54,      // C++ (GCC 9.2.0)
  'c++': 54,
  java: 62,     // Java (OpenJDK 13.0.1)
};

/**
 * Execute code using Judge0 API
 * @param {Object} params
 * @param {string} params.language - 'python', 'cpp', or 'java'
 * @param {string} params.code - source code string
 * @param {string} [params.stdin] - input string
 * @returns {Promise<Object>} Execution result object
 */
const executeCode = async ({ language, code, stdin = '' }) => {
  const langKey = (language || '').toLowerCase().trim();
  const languageId = LANGUAGE_MAP[langKey] || 71;

  const payload = {
    language_id: languageId,
    source_code: code,
    stdin: stdin || '',
  };

  const rapidApiKey = process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.trim() : '';

  let apiUrl = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
  const headers = {
    'Content-Type': 'application/json',
  };

  if (rapidApiKey) {
    headers['x-rapidapi-host'] = 'judge0-ce.p.rapidapi.com';
    headers['x-rapidapi-key'] = rapidApiKey;
  } else {
    // Open community Judge0 instance fallback
    apiUrl = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
  }

  try {
    const response = await axios.post(apiUrl, payload, { headers, timeout: 15000 });
    const data = response.data;

    return {
      stdout: data.stdout || '',
      stderr: data.stderr || data.compile_output || '',
      status: data.status?.description || 'Executed',
      time: data.time ? `${data.time} s` : '0 s',
      memory: data.memory ? `${data.memory} KB` : '0 KB',
    };
  } catch (error) {
    console.error('Judge0 execution error:', error.response?.data || error.message);
    
    // Attempt open community fallback if primary fails
    if (rapidApiKey) {
      try {
        const fallbackRes = await axios.post(
          'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
          payload,
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );
        const data = fallbackRes.data;
        return {
          stdout: data.stdout || '',
          stderr: data.stderr || data.compile_output || '',
          status: data.status?.description || 'Executed',
          time: data.time ? `${data.time} s` : '0 s',
          memory: data.memory ? `${data.memory} KB` : '0 KB',
        };
      } catch (fallbackErr) {
        console.error('Judge0 fallback error:', fallbackErr.message);
      }
    }

    return {
      stdout: '',
      stderr: error.response?.data?.message || error.message || 'Execution error',
      status: 'Error',
      time: '0 s',
      memory: '0 KB',
    };
  }
};

module.exports = { executeCode, LANGUAGE_MAP };
