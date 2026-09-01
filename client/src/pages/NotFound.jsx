import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center text-[#2B2438]">
      <div className="w-20 h-20 rounded-3xl bg-[#E8DEFB] border border-[#C9B6F0] text-[#7C4DFF] flex items-center justify-center text-3xl font-extrabold mb-6 shadow-sm">
        404
      </div>
      <h1 className="text-3xl font-extrabold text-[#2B2438] mb-2">Page Not Found</h1>
      <p className="text-[#8A7FA3] max-w-md mb-8 text-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-xl bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-sm transition-all shadow-md shadow-[#7C4DFF]/25"
      >
        Back to Directory
      </Link>
    </div>
  );
}

export default NotFound;
