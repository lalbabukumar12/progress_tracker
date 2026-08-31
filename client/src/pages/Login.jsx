import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(isRegister ? 'Creating account...' : 'Logging in...');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { username: formData.username, email: formData.email, password: formData.password }
      : { email: formData.email || formData.username, password: formData.password };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save token and user details to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Notify window to update Navbar
      window.dispatchEvent(new Event('storage'));

      toast.success(isRegister ? 'Account registered successfully!' : `Welcome back, ${data.user.username}!`, { id: toastId });
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Error authenticating', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 md:my-16 p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-100">
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </h1>
        <p className="text-xs text-slate-400">
          {isRegister
            ? 'Sign up to execute code & refresh student statistics'
            : 'Login to access protected features and run code'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. johndoe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {isRegister ? 'Email Address' : 'Email or Username'}
          </label>
          <input
            type="text"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={isRegister ? 'john@example.com' : 'Enter email or username'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Log In'}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          {isRegister ? 'Already have an account? Log In' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
