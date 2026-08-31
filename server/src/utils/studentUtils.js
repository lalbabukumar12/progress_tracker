/**
 * Helper function to generate a safe, privacy-conscious display name label for a student.
 * Never uses or exposes DOB. Uses college and roll number/identifier for disambiguation.
 * @param {Object} student 
 * @param {boolean} forceDisambiguate 
 * @returns {string} Formatted display label
 */
const getDisplayName = (student, forceDisambiguate = false) => {
  if (!student || !student.name) return 'Anonymous Student';

  const name = student.name.trim();
  const college = student.college ? student.college.trim() : '';
  const roll = student.rollNumber ? student.rollNumber.trim() : '';

  if (forceDisambiguate && (college || roll)) {
    const details = [college, roll].filter(Boolean).join(', ');
    return `${name} (${details})`;
  }

  return name;
};

module.exports = { getDisplayName };
