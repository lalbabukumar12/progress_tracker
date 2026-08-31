import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

const STARTER_SNIPPETS = {
  python: `# Python 3 Starter Code\nprint("Hello World!")\n`,
  cpp: `// C++ GCC Starter Code\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}\n`,
  java: `// Java OpenJDK Starter Code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}\n`,
};

export default function IDE() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER_SNIPPETS.python);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [executing, setExecuting] = useState(false);

  // Student selection and practice solver states
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [markingSolved, setMarkingSolved] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) {
            setSelectedStudentId(data[0]._id);
          }
        }
      })
      .catch((err) => console.error('Failed to load students for IDE:', err));
  }, []);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(STARTER_SNIPPETS[newLang] || '');
    setOutput(null);
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setOutput(null);
    const toastId = toast.loading('Running code in sandbox...');

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify({ language, code, stdin }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Authentication required. Please log in to run code.', { id: toastId });
          return;
        }
        throw new Error(data.message || 'Execution failed');
      }

      setOutput(data);
      if (data.status === 'Accepted' || data.status === 'Executed') {
        toast.success(`Executed cleanly (${data.time})`, { id: toastId });
      } else {
        toast.error(`Status: ${data.status}`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || 'Error executing code', { id: toastId });
      setOutput({
        stdout: '',
        stderr: err.message || 'Error communicating with execution server',
        status: 'Error',
        time: '0 s',
        memory: '0 KB',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleMarkAsSolved = async () => {
    if (!selectedStudentId) {
      toast.error('Please select or create a student profile first.');
      return;
    }

    setMarkingSolved(true);
    const toastId = toast.loading('Recording solved problem...');

    try {
      const res = await fetch(`http://localhost:5000/api/students/${selectedStudentId}/increment-solved`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error('Failed to increment solved counter');
      }

      const data = await res.json();
      toast.success(`✓ Marked as Solved! Total Practice Problems: ${data.problemsSolved}`, { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Error marking problem as solved', { id: toastId });
    } finally {
      setMarkingSolved(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>💻</span> Online Code IDE
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Write, compile, and execute Python, C++, and Java code using Judge0 sandbox.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Student Selector */}
          {students.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-400">Student:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer flex-1 sm:flex-initial"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java (OpenJDK)</option>
          </select>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRunCode}
              disabled={executing}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-950 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {executing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span> Run Code
                </>
              )}
            </button>

            <button
              onClick={handleMarkAsSolved}
              disabled={markingSolved || !selectedStudentId}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {markingSolved ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span>✓</span> Mark as Solved
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Input Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monaco Code Editor (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>main.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}</span>
            <span className="text-slate-500">Monaco Editor (vs-dark)</span>
          </div>
          <div className="flex-1 min-h-[380px]">
            <Editor
              height="400px"
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'java'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>

        {/* Input (stdin) Panel (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Standard Input (stdin)
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input values here..."
            rows={12}
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none min-h-[140px]"
          />
        </div>
      </div>

      {/* Output Console Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Execution Console
          </h3>

          {output && (
            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <span className={`px-2.5 py-0.5 rounded border font-semibold ${
                output.status === 'Accepted' || output.status === 'Executed'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950 text-rose-400 border-rose-800/60'
              }`}>
                {output.status}
              </span>
              <span className="text-slate-400">Time: <strong className="text-slate-200">{output.time}</strong></span>
              <span className="text-slate-400">Memory: <strong className="text-slate-200">{output.memory}</strong></span>
            </div>
          )}
        </div>

        {executing && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            Sending payload to Judge0 container engine...
          </div>
        )}

        {!executing && !output && (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono text-center">
            Click "▶ Run Code" above to execute your snippet.
          </div>
        )}

        {!executing && output && (
          <div className="space-y-3 font-mono text-xs">
            {/* Standard Output */}
            {output.stdout && (
              <div className="space-y-1">
                <div className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                  Standard Output (stdout):
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {output.stdout}
                </pre>
              </div>
            )}

            {/* Standard Error / Compilation Errors */}
            {output.stderr && (
              <div className="space-y-1">
                <div className="text-rose-400 font-semibold text-[11px] uppercase tracking-wider">
                  Errors / Diagnostics (stderr):
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-rose-950/60 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                  {output.stderr}
                </pre>
              </div>
            )}

            {!output.stdout && !output.stderr && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-400 italic">
                Program completed with no output.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
