import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode (currently ${isDark ? 'Dark' : 'Light'})`}
      className={`group relative flex items-center justify-center rounded-xl border border-[#E0D4F7] bg-[#FAF8FE] hover:border-[#7C4DFF] hover:bg-[#E8DEFB]/50 text-[#2B2438] transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40 ${
        compact ? 'p-2 text-sm' : 'px-2.5 py-1.5 text-xs gap-1.5'
      }`}
    >
      {/* Icon with smooth rotate/scale effect */}
      <span className="text-sm select-none transition-transform duration-300 group-hover:scale-110 group-active:rotate-45" role="img" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>

      {!compact && (
        <span className="font-semibold hidden sm:inline-block">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
