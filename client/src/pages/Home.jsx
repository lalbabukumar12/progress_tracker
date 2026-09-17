import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

export default function Home() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter bar states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Derive dynamic options for multi-select dropdowns
  const distinctBranches = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.branch && s.branch.trim()) set.add(s.branch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const distinctSections = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.section && s.section.trim()) set.add(s.section.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const distinctColleges = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.college && s.college.trim()) set.add(s.college.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Client-side filtering logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = (student.name || '').toLowerCase().includes(q);
        const displayMatch = (student.displayName || '').toLowerCase().includes(q);
        if (!nameMatch && !displayMatch) return false;
      }

      if (selectedBranches.length > 0) {
        const sBranch = (student.branch || '').trim();
        if (!selectedBranches.includes(sBranch)) return false;
      }

      if (selectedSections.length > 0) {
        const sSection = (student.section || '').trim();
        if (!selectedSections.includes(sSection)) return false;
      }

      if (selectedColleges.length > 0) {
        const sCollege = (student.college || '').trim();
        if (!selectedColleges.includes(sCollege)) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedBranches, selectedSections, selectedColleges]);

  const isFilteringActive =
    searchQuery.trim() !== '' ||
    selectedBranches.length > 0 ||
    selectedSections.length > 0 ||
    selectedColleges.length > 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBranches([]);
    setSelectedSections([]);
    setSelectedColleges([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#2B2438]">
            Progress Tracker Directory
          </h1>
          <p className="text-[#8A7FA3] text-sm mt-1">
            Monitor competitive programming and GitHub progress across registered students.
          </p>
        </div>
      </header>

      {/* Student List Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0D4F7] pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#2B2438]">Registered Students</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#E8DEFB] text-[#7C4DFF] border border-[#C9B6F0]">
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E0D4F7] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by student name..."
              className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl pl-9 pr-8 py-2 text-[#2B2438] placeholder-[#8A7FA3] focus:outline-none focus:border-[#7C4DFF] text-xs transition-colors"
            />
            <span className="absolute left-3 top-2.5 text-[#8A7FA3]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-[#8A7FA3] hover:text-[#2B2438] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dynamic Multi-Select Dropdowns & Clear Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <MultiSelectDropdown
              label="Branch"
              options={distinctBranches}
              selectedValues={selectedBranches}
              onChange={setSelectedBranches}
            />
            <MultiSelectDropdown
              label="Section"
              options={distinctSections}
              selectedValues={selectedSections}
              onChange={setSelectedSections}
            />
            <MultiSelectDropdown
              label="College"
              options={distinctColleges}
              selectedValues={selectedColleges}
              onChange={setSelectedColleges}
            />

            {isFilteringActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2B2438] hover:text-[#7C4DFF] bg-[#E8DEFB] hover:bg-[#DED0F7] border border-[#C9B6F0] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>✕</span> Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white border border-[#E0D4F7] rounded-2xl shadow-sm" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <div className="text-[#2B2438] font-semibold">No registered students yet</div>
            <p className="text-[#8A7FA3] text-xs max-w-sm mx-auto">
              Create an account or register to appear in the directory.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DEFB] border border-[#C9B6F0] text-[#7C4DFF] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-[#2B2438] font-semibold text-base">No students match these filters</div>
            <p className="text-[#8A7FA3] text-xs max-w-sm mx-auto">
              Try adjusting your search query or dropdown filter selections to find matching student profiles.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-[#7C4DFF]/25 cursor-pointer"
            >
              <span>✕</span> Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              return (
                <div
                  key={student._id}
                  className="bg-white border border-[#E0D4F7] hover:border-[#C9B6F0] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 relative hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-[#2B2438] truncate flex-1">
                        {student.displayName || student.name}
                      </h3>

                      <span className="text-xs font-mono bg-[#FAF8FE] text-[#2B2438] border border-[#E0D4F7] px-2 py-0.5 rounded shrink-0">
                        {student.rollNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#8A7FA3] font-medium">
                      <span>{student.college || 'College N/A'}</span>
                      {(student.branch || student.section) && (
                        <span className="bg-[#E8DEFB] text-[#2B2438] border border-[#C9B6F0] text-[10px] font-mono px-2 py-0.5 rounded font-semibold">
                          {[student.branch, student.section ? `Sec ${student.section}` : null].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#EBE3F8] space-y-1.5 text-xs font-mono text-[#8A7FA3]">
                      <div className="flex justify-between">
                        <span>LeetCode:</span>
                        <span className="text-[#F39C12] font-semibold truncate max-w-[140px] text-right">{student.leetcodeUsername || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Codeforces:</span>
                        <span className="text-[#E74C3C] font-semibold truncate max-w-[140px] text-right">{student.codeforcesUsername || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GitHub:</span>
                        <span className="text-[#2B2438] font-semibold truncate max-w-[140px] text-right">{student.githubUsername || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GFG:</span>
                        <span className="text-[#27AE60] font-semibold truncate max-w-[140px] text-right">{student.gfgUsername || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CodeChef:</span>
                        <span className="text-[#F39C12] font-semibold truncate max-w-[140px] text-right">{student.codechefUsername || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/dashboard/${student._id}`}
                      className="py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white text-xs font-semibold rounded-xl text-center shadow-sm shadow-[#7C4DFF]/20 transition-all block"
                    >
                      Dashboard →
                    </Link>
                    <Link
                      to={`/compare?a=${student._id}`}
                      className="py-2 bg-[#E8DEFB] hover:bg-[#C9B6F0] text-[#2B2438] border border-[#C9B6F0] text-xs font-semibold rounded-xl text-center transition-colors block shadow-xs"
                    >
                      Compare
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
