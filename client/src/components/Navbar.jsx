import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [myStudentId, setMyStudentId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const loadUser = async () => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));

        // Fetch logged in user's student profile ID
        const res = await fetch('http://localhost:5000/api/students/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMyStudentId(data._id);
        }
      } catch (err) {
        console.error('Error fetching my student profile:', err);
      }
    } else {
      setUser(null);
      setMyStudentId(null);
    }
  };

  useEffect(() => {
    loadUser();

    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMyStudentId(null);
    window.dispatchEvent(new Event('storage'));
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 shadow-lg sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            PT
          </div>
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Progress Tracker
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-400 hover:text-white text-xl p-1 focus:outline-none"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Directory
          </NavLink>
          {myStudentId && (
            <NavLink 
              to={`/dashboard/${myStudentId}`} 
              className={({ isActive }) => 
                isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
              }
            >
              My Dashboard
            </NavLink>
          )}
          <NavLink 
            to="/leaderboard" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Leaderboard
          </NavLink>
          <NavLink 
            to="/compare" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Compare
          </NavLink>
          <NavLink 
            to="/contests" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Contests
          </NavLink>
          <NavLink 
            to="/chat" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Chat
          </NavLink>
          <NavLink 
            to="/ide" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            Code IDE
          </NavLink>
          {user && (
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
              }
            >
              Profile
            </NavLink>
          )}
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            About
          </NavLink>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <Link to="/profile" className="text-xs font-mono text-indigo-300 bg-indigo-950 hover:bg-indigo-900 px-2.5 py-1 rounded-full border border-indigo-800/60 transition-colors">
                👤 {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pl-4 border-l border-slate-800">
              <NavLink
                to="/login"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Login / Register
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-slate-800/80 mt-3 flex flex-col text-sm">
          <NavLink 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Directory
          </NavLink>
          {myStudentId && (
            <NavLink 
              to={`/dashboard/${myStudentId}`} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
            >
              My Dashboard
            </NavLink>
          )}
          <NavLink 
            to="/leaderboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Leaderboard
          </NavLink>
          <NavLink 
            to="/compare" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Compare
          </NavLink>
          <NavLink 
            to="/contests" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Contests
          </NavLink>
          <NavLink 
            to="/chat" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Chat
          </NavLink>
          <NavLink 
            to="/ide" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            Code IDE
          </NavLink>
          {user && (
            <NavLink 
              to="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
            >
              Profile
            </NavLink>
          )}
          <NavLink 
            to="/about" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-300 hover:text-indigo-400 py-1 font-medium"
          >
            About
          </NavLink>

          {user ? (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-xs font-mono text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800/60">
                👤 {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/80">
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
              >
                Login / Register
              </NavLink>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
