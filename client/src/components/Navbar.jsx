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
    <nav className="bg-white/95 border-b border-[#E0D4F7] px-4 md:px-8 py-3.5 shadow-sm sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7C4DFF] flex items-center justify-center font-extrabold text-white shadow-sm shadow-[#7C4DFF]/30 tracking-tight text-sm">
            PT
          </div>
          <Link to="/" className="text-xl font-extrabold bg-gradient-to-r from-[#7C4DFF] via-[#8E5CF7] to-[#6C3CE9] bg-clip-text text-transparent tracking-tight">
            Progress Tracker
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#8A7FA3] hover:text-[#2B2438] text-xl p-1 focus:outline-none cursor-pointer"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Directory
          </NavLink>
          {myStudentId && (
            <NavLink 
              to={`/dashboard/${myStudentId}`} 
              className={({ isActive }) => 
                isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
              }
            >
              My Dashboard
            </NavLink>
          )}
          <NavLink 
            to="/leaderboard" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Leaderboard
          </NavLink>
          <NavLink 
            to="/compare" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Compare
          </NavLink>
          <NavLink 
            to="/contests" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Contests
          </NavLink>
          <NavLink 
            to="/chat" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Chat
          </NavLink>
          <NavLink 
            to="/ide" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            Code IDE
          </NavLink>
          {user && (
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
              }
            >
              Profile
            </NavLink>
          )}
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              isActive ? "text-[#7C4DFF] font-bold" : "text-[#8A7FA3] hover:text-[#2B2438] transition-colors"
            }
          >
            About
          </NavLink>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-[#E0D4F7]">
              <Link to="/profile" className="text-xs font-mono text-[#2B2438] bg-[#E8DEFB] hover:bg-[#DED0F7] px-3 py-1 rounded-full border border-[#C9B6F0] transition-colors shadow-xs">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-[#E74C3C] hover:text-[#DC2626] font-semibold cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pl-4 border-l border-[#E0D4F7]">
              <NavLink
                to="/login"
                className="px-3.5 py-1.5 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-xs rounded-xl shadow-sm shadow-[#7C4DFF]/25 transition-all"
              >
                Login / Register
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-3 border-t border-[#E0D4F7] mt-3 flex flex-col text-sm bg-white">
          <NavLink 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Directory
          </NavLink>
          {myStudentId && (
            <NavLink 
              to={`/dashboard/${myStudentId}`} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
            >
              My Dashboard
            </NavLink>
          )}
          <NavLink 
            to="/leaderboard" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Leaderboard
          </NavLink>
          <NavLink 
            to="/compare" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Compare
          </NavLink>
          <NavLink 
            to="/contests" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Contests
          </NavLink>
          <NavLink 
            to="/chat" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Chat
          </NavLink>
          <NavLink 
            to="/ide" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            Code IDE
          </NavLink>
          {user && (
            <NavLink 
              to="/profile" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
            >
              Profile
            </NavLink>
          )}
          <NavLink 
            to="/about" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8A7FA3] hover:text-[#7C4DFF] py-1 font-medium"
          >
            About
          </NavLink>

          {user ? (
            <div className="pt-2 border-t border-[#E0D4F7] flex items-center justify-between">
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-xs font-mono text-[#2B2438] bg-[#E8DEFB] px-3 py-1 rounded-full border border-[#C9B6F0]">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-[#E74C3C] hover:text-[#DC2626] font-semibold cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#E0D4F7]">
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-block w-full text-center py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-xs rounded-xl shadow-sm shadow-[#7C4DFF]/25"
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
