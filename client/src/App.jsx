import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
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
    <Router>
      <div className="min-h-screen bg-[#F3EFFB] text-[#2B2438] flex flex-col font-sans selection:bg-[#7C4DFF]/20 selection:text-[#2B2438]">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#2B2438',
              border: '1px solid #E0D4F7',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              boxShadow: '0 10px 25px -5px rgba(124, 77, 255, 0.12), 0 8px 10px -6px rgba(124, 77, 255, 0.08)',
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
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
