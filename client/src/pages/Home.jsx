import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

export default function Home() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter bar states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  // Selection state for admin bulk operations
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { isBulk: boolean, singleStudent?: object, count: number }
  const [deleting, setDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // Edit modal state
  const [editTarget, setEditTarget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    college: '',
    branch: '',
    section: '',
    leetcodeUsername: '',
    codeforcesUsername: '',
    githubUsername: '',
    gfgUsername: '',
    codechefUsername: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    college: '',
    branch: '',
    section: '',
    leetcodeUsername: '',
    codeforcesUsername: '',
    githubUsername: '',
    gfgUsername: '',
    codechefUsername: '',
  });
  const [creating, setCreating] = useState(false);

  const loadCurrentUser = () => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

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
    loadCurrentUser();
    fetchStudents();

    window.addEventListener('storage', loadCurrentUser);
    return () => window.removeEventListener('storage', loadCurrentUser);
  }, []);

  const isAdmin = currentUser?.isAdmin === true;

  const handleSelectToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const toastId = toast.loading(deleteTarget.isBulk ? `Deleting ${deleteTarget.count} student profile(s)...` : `Deleting ${deleteTarget.singleStudent.name}...`);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      let res;
      let idsToRemove = [];

      if (deleteTarget.isBulk) {
        idsToRemove = [...selectedIds];
        res = await fetch('http://localhost:5000/api/students/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: idsToRemove }),
        });
      } else {
        const singleId = deleteTarget.singleStudent._id;
        idsToRemove = [singleId];
        res = await fetch(`http://localhost:5000/api/students/${singleId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete student profiles');

      toast.success(
        deleteTarget.isBulk
          ? `${data.deletedCount || idsToRemove.length} student profiles deleted successfully!`
          : 'Deleted successfully',
        { id: toastId }
      );

      setDeletingIds((prev) => [...prev, ...idsToRemove]);
      
      setTimeout(() => {
        setStudents((prev) => prev.filter((s) => !idsToRemove.includes(s._id)));
        setSelectedIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
        setDeletingIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
      }, 300);

      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Error deleting profile', { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (student) => {
    setEditTarget(student);
    setEditFormData({
      name: student.name || '',
      college: student.college || '',
      branch: student.branch || '',
      section: student.section || '',
      leetcodeUsername: student.leetcodeUsername || '',
      codeforcesUsername: student.codeforcesUsername || '',
      githubUsername: student.githubUsername || '',
      gfgUsername: student.gfgUsername || '',
      codechefUsername: student.codechefUsername || '',
    });
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    setEditing(true);
    const toastId = toast.loading('Saving changes...');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const res = await fetch(`http://localhost:5000/api/students/${editTarget._id}/admin-edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update student');

      toast.success('Student profile updated successfully!', { id: toastId });

      setStudents((prev) => prev.map((s) => (s._id === editTarget._id ? data : s)));
      setEditTarget(null);
    } catch (err) {
      toast.error(err.message || 'Error updating student', { id: toastId });
    } finally {
      setEditing(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNumber) return;

    setCreating(true);
    const toastId = toast.loading('Registering new student...');

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create student');
      }

      toast.success(`Student '${data.name}' created successfully!`, { id: toastId });
      setShowAddModal(false);
      setFormData({
        name: '',
        rollNumber: '',
        college: '',
        branch: '',
        section: '',
        leetcodeUsername: '',
        codeforcesUsername: '',
        githubUsername: '',
        gfgUsername: '',
        codechefUsername: '',
      });

      fetch(`http://localhost:5000/api/students/${data._id}/refresh-stats`, { method: 'POST', headers }).catch(() => {});

      await fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Error creating student', { id: toastId });
    } finally {
      setCreating(false);
    }
  };

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

      {/* Floating Action Bar for Bulk Selection (Admin Only) */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 bg-white border-2 border-[#7C4DFF] text-[#2B2438] p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C4DFF] animate-ping" />
            <span>{selectedIds.length} student profile(s) selected</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={handleClearSelection}
              className="text-[#8A7FA3] hover:text-[#2B2438] underline cursor-pointer"
            >
              Clear selection
            </button>

            <button
              onClick={() => setDeleteTarget({ isBulk: true, count: selectedIds.length })}
              className="px-4 py-2 bg-[#E74C3C] hover:bg-[#DC2626] text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 font-bold"
            >
              <span>❗</span> Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#2B2438]">
            Progress Tracker Directory
          </h1>
          <p className="text-[#8A7FA3] text-sm mt-1">
            Monitor competitive programming and GitHub progress across registered students.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#7C4DFF] hover:bg-[#6C3CE9] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#7C4DFF]/25 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span>+</span> Add Student
        </button>
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
          {isAdmin && students.length > 0 && (
            <span className="text-xs text-[#7C4DFF] font-mono font-semibold">Admin Mode Enabled</span>
          )}
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
            <div className="text-[#2B2438] font-semibold">No students registered yet</div>
            <p className="text-[#8A7FA3] text-xs max-w-sm mx-auto">
              Click "+ Add Student" to register a student with LeetCode, Codeforces, and GitHub handles.
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
                  className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between transition-all duration-300 relative hover:shadow-md ${
                    selectedIds.includes(student._id) ? 'border-[#7C4DFF] ring-2 ring-[#7C4DFF]/25 bg-[#FAF8FE]' : 'border-[#E0D4F7] hover:border-[#C9B6F0]'
                  } ${deletingIds.includes(student._id) ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student._id)}
                            onChange={() => handleSelectToggle(student._id)}
                            className="w-4 h-4 rounded border-[#C9B6F0] text-[#7C4DFF] focus:ring-[#7C4DFF] bg-white cursor-pointer"
                          />
                        )}

                        <h3 className="text-lg font-bold text-[#2B2438] truncate">
                          {student.displayName || student.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-[#FAF8FE] text-[#2B2438] border border-[#E0D4F7] px-2 py-0.5 rounded shrink-0">
                          {student.rollNumber}
                        </span>
                        
                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(student)}
                            title="Edit Student Profile"
                            className="text-[#8A7FA3] hover:text-[#7C4DFF] p-1 transition-colors cursor-pointer text-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget({ isBulk: false, singleStudent: student, count: 1 })}
                          title="Delete Student Profile"
                          className="text-[#E74C3C] hover:text-[#DC2626] p-1 transition-colors cursor-pointer text-xs font-bold"
                        >
                          ❗
                        </button>
                      </div>
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2B2438]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 text-[#2B2438]">
            <div className="flex items-center justify-between border-b border-[#E0D4F7] pb-4">
              <h3 className="text-lg font-bold text-[#2B2438]">Add New Student Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8A7FA3] hover:text-[#2B2438] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. CS2026-042"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">College / University</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. Stanford"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. IT, CS, ECE"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. A, B, C"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#8A7FA3] uppercase tracking-wider">Platform Usernames</div>
                <div>
                  <input
                    type="text"
                    value={formData.leetcodeUsername}
                    onChange={(e) => setFormData({ ...formData, leetcodeUsername: e.target.value })}
                    placeholder="LeetCode Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.codeforcesUsername}
                    onChange={(e) => setFormData({ ...formData, codeforcesUsername: e.target.value })}
                    placeholder="Codeforces Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.githubUsername}
                    onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                    placeholder="GitHub Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.gfgUsername}
                    onChange={(e) => setFormData({ ...formData, gfgUsername: e.target.value })}
                    placeholder="GeeksforGeeks Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.codechefUsername}
                    onChange={(e) => setFormData({ ...formData, codechefUsername: e.target.value })}
                    placeholder="CodeChef Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E0D4F7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#8A7FA3] hover:text-[#2B2438] border border-[#E0D4F7] text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm shadow-[#7C4DFF]/25 transition-colors cursor-pointer"
                >
                  {creating ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#2B2438]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center text-[#2B2438]">
            <div className="w-12 h-12 bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/30 rounded-full flex items-center justify-center mx-auto text-xl font-extrabold">
              ❗
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#2B2438]">
                {deleteTarget.isBulk ? `Delete ${deleteTarget.count} Profiles?` : `Delete ${deleteTarget.singleStudent?.name}'s profile?`}
              </h3>
              <p className="text-[#8A7FA3] text-xs leading-relaxed">
                {deleteTarget.isBulk ? <>Delete <strong className="text-[#2B2438]">{deleteTarget.count}</strong> student profile(s)? </> : null}This action is destructive and cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#8A7FA3] hover:text-[#2B2438] border border-[#E0D4F7] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#E74C3C] hover:bg-[#DC2626] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? 'Deleting...' : '❗ Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal (Admin Only) */}
      {editTarget && (
        <div className="fixed inset-0 bg-[#2B2438]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0D4F7] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 text-[#2B2438]">
            <div className="flex items-center justify-between border-b border-[#E0D4F7] pb-4">
              <h3 className="text-lg font-bold text-[#2B2438]">Edit Student Profile</h3>
              <button
                onClick={() => setEditTarget(null)}
                className="text-[#8A7FA3] hover:text-[#2B2438] text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditStudent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#2B2438] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">College / University</label>
                  <input
                    type="text"
                    value={editFormData.college}
                    onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Branch</label>
                  <input
                    type="text"
                    value={editFormData.branch}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    placeholder="e.g. IT, CS"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B2438] mb-1">Section</label>
                  <input
                    type="text"
                    value={editFormData.section}
                    onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                    placeholder="e.g. A, B"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#8A7FA3] uppercase tracking-wider">Platform Usernames</div>
                <div>
                  <input
                    type="text"
                    value={editFormData.leetcodeUsername}
                    onChange={(e) => setEditFormData({ ...editFormData, leetcodeUsername: e.target.value })}
                    placeholder="LeetCode Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={editFormData.codeforcesUsername}
                    onChange={(e) => setEditFormData({ ...editFormData, codeforcesUsername: e.target.value })}
                    placeholder="Codeforces Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={editFormData.githubUsername}
                    onChange={(e) => setEditFormData({ ...editFormData, githubUsername: e.target.value })}
                    placeholder="GitHub Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={editFormData.gfgUsername}
                    onChange={(e) => setEditFormData({ ...editFormData, gfgUsername: e.target.value })}
                    placeholder="GeeksforGeeks Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={editFormData.codechefUsername}
                    onChange={(e) => setEditFormData({ ...editFormData, codechefUsername: e.target.value })}
                    placeholder="CodeChef Username"
                    className="w-full bg-[#FAF8FE] border border-[#E0D4F7] rounded-xl px-3.5 py-2.5 text-[#2B2438] focus:outline-none focus:border-[#7C4DFF] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E0D4F7]">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 bg-[#FAF8FE] hover:bg-[#E8DEFB] text-[#8A7FA3] hover:text-[#2B2438] border border-[#E0D4F7] text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C3CE9] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm shadow-[#7C4DFF]/25 transition-colors cursor-pointer"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
