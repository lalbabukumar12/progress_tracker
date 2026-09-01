import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="bg-white border border-[#E0D4F7] rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-sm">
          <div className="w-14 h-14 bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0] rounded-2xl flex items-center justify-center font-bold text-lg mx-auto shadow-xs">
            Chat
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#2B2438]">Student Community Chat</h1>
            <p className="text-[#8A7FA3] text-sm max-w-md mx-auto">
              Connect with fellow coders in real time, discuss programming contest problems, and share solutions.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="px-6 py-3 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-sm rounded-xl shadow-md shadow-[#7C4DFF]/25 transition-all inline-block"
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
      <div className="bg-white border border-[#E0D4F7] rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between gap-4 shrink-0 text-[#2B2438]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C4DFF] flex items-center justify-center font-bold text-base text-white shadow-sm shadow-[#7C4DFF]/25">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#2B2438]">Global Student Chat</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0]">
                #general
              </span>
            </div>
            <p className="text-xs text-[#8A7FA3]">Real-time discussion & contest chat</p>
          </div>
        </div>

        {/* Live Presence & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8FE] border border-[#E0D4F7] text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#27AE60] animate-pulse shadow-sm shadow-[#27AE60]' : 'bg-[#E74C3C]'
              }`}
            />
            <span className="text-[#2B2438] font-mono">{onlineCount} online</span>
          </div>
        </div>
      </div>

      {/* Message Stream Box */}
      <div className="flex-1 bg-white border border-[#E0D4F7] rounded-2xl p-4 md:p-6 shadow-sm overflow-y-auto space-y-4 flex flex-col">
        {loadingHistory ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8A7FA3] space-y-3">
            <div className="w-8 h-8 border-2 border-[#7C4DFF] border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-medium">Loading chat history...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8A7FA3] space-y-2">
            <p className="text-sm font-semibold text-[#2B2438]">No messages yet</p>
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
                  <div className="w-8 h-8 rounded-full bg-[#E8DEFB] border border-[#C9B6F0] text-[#7C4DFF] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {senderInitial}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] md:max-w-md rounded-2xl px-4 py-2.5 shadow-xs space-y-1 ${
                    isOwn
                      ? 'bg-[#7C4DFF] text-white rounded-br-none'
                      : 'bg-[#FAF8FE] border border-[#E0D4F7] text-[#2B2438] rounded-bl-none'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-[11px] font-bold text-[#7C4DFF] flex items-center gap-1.5">
                      <span>{msg.senderName}</span>
                    </div>
                  )}

                  <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>

                  <div
                    className={`text-[10px] font-mono text-right ${
                      isOwn ? 'text-white/80' : 'text-[#8A7FA3]'
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>

                {/* Right Avatar for Own User */}
                {isOwn && (
                  <div className="w-8 h-8 rounded-full bg-[#8E5CF7] border border-[#7C4DFF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
        className="bg-white border border-[#E0D4F7] rounded-2xl p-2.5 shadow-sm flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message in #general... (Press Enter to send)"
          className="flex-1 bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-4 py-3 text-[#2B2438] placeholder-[#8A7FA3] text-xs md:text-sm focus:outline-none focus:border-[#7C4DFF]"
          maxLength={2000}
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected}
          className="px-5 py-3 bg-[#7C4DFF] hover:bg-[#6C3CE9] disabled:opacity-50 text-white font-semibold text-xs md:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-[#7C4DFF]/25 disabled:shadow-none"
        >
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
