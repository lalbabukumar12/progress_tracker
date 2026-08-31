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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #1e293b',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
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
