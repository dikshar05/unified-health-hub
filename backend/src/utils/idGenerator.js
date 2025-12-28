const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomPart}`.toUpperCase();
};

const generatePatientId = () => generateId('PAT-');
const generateDoctorId = () => generateId('DOC-');
const generateVisitId = () => generateId('VIS-');
const generatePrescriptionId = () => generateId('PRE-');

module.exports = {
  generateId,
  generatePatientId,
  generateDoctorId,
  generateVisitId,
  generatePrescriptionId
};
