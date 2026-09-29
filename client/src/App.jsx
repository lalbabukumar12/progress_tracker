import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Compare from './pages/Compare';
import Contests from './pages/Contests';
import Chat from './pages/Chat';
import IDE from './pages/IDE';
import Login from './pages/Login';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-[#F3EFFB] text-[#2B2438] flex flex-col font-sans transition-colors duration-200">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-card)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              },
              success: {
                iconTheme: {
                  primary: '#27AE60',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#E74C3C',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/contests" element={<Contests />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/dashboard/:studentId" element={<Dashboard />} />
              <Route path="/ide" element={<IDE />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
