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
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all cursor-pointer shadow-xs ${
          isSomeSelected
            ? 'bg-[#E8DEFB] border-[#C9B6F0] text-[#2B2438]'
            : 'bg-white border-[#E0D4F7] text-[#8A7FA3] hover:border-[#7C4DFF] hover:text-[#2B2438]'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-[#8A7FA3] font-normal">{label}:</span>
          <span className="font-semibold">
            {isSomeSelected ? (
              <span className="text-[#7C4DFF]">
                {selectedValues.length === 1 ? selectedValues[0] : `${selectedValues.length} selected`}
              </span>
            ) : (
              <span className="text-[#8A7FA3] font-normal">All</span>
            )}
          </span>
        </span>

        <span className="text-[10px] text-[#8A7FA3] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E0D4F7] shadow-xl z-50 p-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0D4F7] text-[11px] font-medium">
            <span className="text-[#8A7FA3] uppercase tracking-wider font-semibold text-[10px]">
              Select {label}
            </span>
            <div className="flex items-center gap-2">
              {!isAllSelected && options.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#7C4DFF] hover:text-[#6C3CE9] font-semibold transition-colors cursor-pointer"
                >
                  All
                </button>
              )}
              {isSomeSelected && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[#8A7FA3] hover:text-[#E74C3C] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {options.length === 0 ? (
              <div className="text-[#8A7FA3] text-xs py-3 text-center italic">
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
                        ? 'bg-[#E8DEFB] text-[#2B2438] font-semibold'
                        : 'text-[#2B2438] hover:bg-[#F3EFFB]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // Handled by label onClick
                      className="w-3.5 h-3.5 rounded border-[#C9B6F0] bg-white text-[#7C4DFF] focus:ring-[#7C4DFF] cursor-pointer"
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
