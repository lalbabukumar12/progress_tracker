import { useState, useRef, useEffect } from 'react';

export default function MultiSelectDropdown({ label, options = [], selectedValues = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;
  const isSomeSelected = selectedValues.length > 0;

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all cursor-pointer ${
          isSomeSelected
            ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200 shadow-sm shadow-indigo-900/30'
            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-slate-400 font-normal">{label}:</span>
          <span className="font-semibold">
            {isSomeSelected ? (
              <span className="text-indigo-300">
                {selectedValues.length === 1 ? selectedValues[0] : `${selectedValues.length} selected`}
              </span>
            ) : (
              <span className="text-slate-400 font-normal">All</span>
            )}
          </span>
        </span>

        <span className="text-[10px] text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px] font-medium">
            <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              Select {label}
            </span>
            <div className="flex items-center gap-2">
              {!isAllSelected && options.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  All
                </button>
              )}
              {isSomeSelected && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {options.length === 0 ? (
              <div className="text-slate-500 text-xs py-3 text-center italic">
                No {label.toLowerCase()}s found
              </div>
            ) : (
              options.map((option) => {
                const checked = selectedValues.includes(option);
                return (
                  <label
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-indigo-950/80 text-indigo-200 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // Handled by label onClick
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="truncate">{option}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
