import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      setCurrentUser(null);
      setLoadingHistory(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }

    // 1. Fetch initial message history
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/chat/history?room=general&limit=50');
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom(false), 100);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();

    // 2. Initialize Socket.IO connection
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
      if (err.message.includes('Authentication error')) {
        toast.error('Session expired. Please log in again.');
      }
    });

    socket.on('online_count', (data) => {
      if (data && typeof data.count === 'number') {
        setOnlineCount(data.count);
      }
    });

    socket.on('new_message', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => scrollToBottom(true), 50);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle message sending
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    if (!socketRef.current || !isConnected) {
      toast.error('Chat is disconnected. Reconnecting...');
      return;
    }

    socketRef.current.emit('send_message', { message: text, room: 'general' }, (res) => {
      if (res?.error) {
        toast.error(res.error);
      }
    });

    setInputMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time for message bubbles
  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            💬
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">Join the Student Community Chat</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Connect with fellow coders in real time, discuss programming contest problems, and share solutions.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all inline-block"
            >
              Log in to Join Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 h-[calc(100vh-85px)] flex flex-col space-y-4">
      {/* Chat Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-xl flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/20">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">Global Student Chat</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-indigo-400 border border-indigo-500/30">
                #general
              </span>
            </div>
            <p className="text-xs text-slate-400">Real-time discussion & contest chat</p>
          </div>
        </div>

        {/* Live Presence & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-mono">{onlineCount} online</span>
          </div>
        </div>
      </div>

      {/* Message Stream Box */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl overflow-y-auto space-y-4 flex flex-col">
        {loadingHistory ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-medium">Loading chat history...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <div className="text-3xl">👋</div>
            <p className="text-sm font-semibold text-slate-400">No messages yet</p>
            <p className="text-xs">Be the first to say hello in #general!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser._id || msg.senderId === currentUser.id;
            const senderInitial = (msg.senderName || 'U').charAt(0).toUpperCase();

            return (
              <div
                key={msg._id || `${msg.createdAt}-${index}`}
                className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {/* Left Avatar for Others */}
                {!isOwn && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                    {senderInitial}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] md:max-w-md rounded-2xl px-4 py-2.5 shadow-md space-y-1 ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>{msg.senderName}</span>
                    </div>
                  )}

                  <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>

                  <div
                    className={`text-[10px] font-mono text-right ${
                      isOwn ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>

                {/* Right Avatar for Own User */}
                {isOwn && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-md shadow-indigo-600/30">
                    {senderInitial}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & Send Form */}
      <form
        onSubmit={handleSendMessage}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message in #general... (Press Enter to send)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs md:text-sm focus:outline-none focus:border-indigo-500"
          maxLength={2000}
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs md:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:shadow-none"
        >
          <span>Send</span>
          <span>🚀</span>
        </button>
      </form>
    </div>
  );
}
