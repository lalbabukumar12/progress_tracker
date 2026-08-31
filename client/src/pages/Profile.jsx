import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [isDobSet, setIsDobSet] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    branch: '',
    section: '',
    dob: '',
    leetcodeUsername: '',
    codeforcesUsername: '',
    githubUsername: '',
    gfgUsername: '',
    codechefUsername: '',
  });

  const [initialUsernames, setInitialUsernames] = useState({
    leetcodeUsername: '',
    codeforcesUsername: '',
    githubUsername: '',
    gfgUsername: '',
    codechefUsername: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to view your profile.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/students/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error('Failed to load profile data');
      }

      const data = await res.json();
      setStudentId(data._id);

      let formattedDob = '';
      let dobAlreadyPresent = false;

      if (data.dob) {
        const parsed = new Date(data.dob);
        if (!isNaN(parsed.getTime())) {
          formattedDob = parsed.toISOString().split('T')[0];
          dobAlreadyPresent = true;
        }
      }

      setIsDobSet(dobAlreadyPresent);

      const currentFormData = {
        name: data.name || '',
        college: data.college || '',
        branch: data.branch || '',
        section: data.section || '',
        dob: formattedDob,
        leetcodeUsername: data.leetcodeUsername || '',
        codeforcesUsername: data.codeforcesUsername || '',
        githubUsername: data.githubUsername || '',
        gfgUsername: data.gfgUsername || '',
        codechefUsername: data.codechefUsername || '',
      };

      setFormData(currentFormData);
      setInitialUsernames({
        leetcodeUsername: data.leetcodeUsername || '',
        codeforcesUsername: data.codeforcesUsername || '',
        githubUsername: data.githubUsername || '',
        gfgUsername: data.gfgUsername || '',
        codechefUsername: data.codechefUsername || '',
      });
    } catch (err) {
      toast.error(err.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving profile changes...');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5000/api/students/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.message || 'Failed to update profile');
      }

      toast.success('Profile saved successfully!', { id: toastId });

      // Check if platform usernames were newly added or changed
      const leetcodeChanged = formData.leetcodeUsername && formData.leetcodeUsername !== initialUsernames.leetcodeUsername;
      const codeforcesChanged = formData.codeforcesUsername && formData.codeforcesUsername !== initialUsernames.codeforcesUsername;
      const githubChanged = formData.githubUsername && formData.githubUsername !== initialUsernames.githubUsername;
      const gfgChanged = formData.gfgUsername && formData.gfgUsername !== initialUsernames.gfgUsername;
      const codechefChanged = formData.codechefUsername && formData.codechefUsername !== initialUsernames.codechefUsername;

      if (leetcodeChanged || codeforcesChanged || githubChanged || gfgChanged || codechefChanged) {
        const refreshToast = toast.loading('Fetching updated platform stats...');
        try {
          await fetch(`http://localhost:5000/api/students/${studentId}/refresh-stats`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Platform stats updated!', { id: refreshToast });
        } catch (refreshErr) {
          toast.error('Stats auto-refresh failed, try manual refresh in Dashboard', { id: refreshToast });
        }
      }

      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Error saving profile', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="space-y-4">
          <div className="h-10 bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">Student Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal profile details and competitive coding platform usernames.
          </p>
        </div>

        {studentId && (
          <Link
            to={`/dashboard/${studentId}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors hidden sm:block"
          >
            View Dashboard →
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">College / University</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="Enter college name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. IT, CS, ECE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g. A, B, C"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Date of Birth Field with Lock Icon & Tooltip */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs font-semibold text-slate-300">Date of Birth {isDobSet ? '' : '*'}</label>
              <span
                className="inline-flex items-center text-amber-400 text-xs cursor-help"
                title="Your date of birth is private and only used to distinguish students with the same name. It is never shown publicly."
              >
                🔒 <span className="text-[10px] text-slate-400 underline ml-1 font-mono">Private</span>
              </span>
            </div>
            <input
              type="date"
              required={!isDobSet}
              disabled={isDobSet}
              max={new Date().toISOString().split('T')[0]}
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none ${
                isDobSet
                  ? 'bg-slate-950/50 text-slate-500 border-slate-800/60 cursor-not-allowed'
                  : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
              }`}
            />
            {isDobSet ? (
              <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1 font-mono">
                🔒 Date of birth can only be set once and cannot be edited later.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>🔒</span> Your date of birth is private and only used to distinguish students with the same name. It is never shown publicly.
              </p>
            )}
          </div>
        </div>

        {/* Platform Usernames Section */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
            Coding Platform Usernames
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-amber-400 mb-1">LeetCode Username</label>
              <input
                type="text"
                value={formData.leetcodeUsername}
                onChange={(e) => setFormData({ ...formData, leetcodeUsername: e.target.value })}
                placeholder="Add your LeetCode username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cyan-400 mb-1">Codeforces Username</label>
              <input
                type="text"
                value={formData.codeforcesUsername}
                onChange={(e) => setFormData({ ...formData, codeforcesUsername: e.target.value })}
                placeholder="Add your Codeforces username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-400 mb-1">GitHub Username</label>
              <input
                type="text"
                value={formData.githubUsername}
                onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                placeholder="Add your GitHub username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">GeeksforGeeks Username</label>
              <input
                type="text"
                value={formData.gfgUsername}
                onChange={(e) => setFormData({ ...formData, gfgUsername: e.target.value })}
                placeholder="Add your GeeksforGeeks username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-500 mb-1">CodeChef Username</label>
              <input
                type="text"
                value={formData.codechefUsername}
                onChange={(e) => setFormData({ ...formData, codechefUsername: e.target.value })}
                placeholder="Add your CodeChef username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
