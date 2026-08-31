import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-20 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4 shadow-xl">
      <h1 className="text-4xl font-extrabold text-rose-500">404</h1>
      <p className="text-slate-300">Page Not Found</p>
      <Link 
        to="/" 
        className="inline-block px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
