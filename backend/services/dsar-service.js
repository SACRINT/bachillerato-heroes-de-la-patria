/**
 * 📋 DSAR SERVICE - v2.0.0
 * GDPR Article 15/20 - Refactorizado: 04 Diciembre 2025
 */

const DsarDAO = require('../data/dsar.dao.js');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

async function createDSARRequest(userId, requestType, email, metadata = {}) {
  const requestId = crypto.randomUUID();
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const result = await DsarDAO.createRequest(requestId, userId, requestType, email, verificationToken, metadata);
  console.log(`[DSAR] Request created: ${requestId} for user ${userId}`);
  await sendVerificationEmail(email, verificationToken, requestId);
  return result;
}

async function verifyDSARRequest(token) {
  const request = await DsarDAO.verifyRequest(token);
  if (!request) throw new Error('Invalid or expired verification token');
  console.log(`[DSAR] Request verified: ${request.id}`);
  await processDSARRequest(request.id);
  return request;
}

async function collectUserData(userId) {
  console.log(`[DSAR] Collecting data for user: ${userId}`);
  return {
    profile: await DsarDAO.getUserProfile(userId),
    academic: await DsarDAO.getAcademicData(userId),
    activity: await DsarDAO.getActivityLogs(userId),
    consents: await DsarDAO.getUserConsents(userId),
    communications: await DsarDAO.getCommunications(userId),
    financial: await DsarDAO.getFinancialData(userId),
    files: await DsarDAO.getUserFiles(userId),
    processing_metadata: getProcessingMetadata()
  };
}

function getProcessingMetadata() {
  return { data_controller: { name: 'BGE Héroes de la Patria', email: 'privacy@bge-heroes.edu.mx' }, legal_basis: ['Contract (Article 6(1)(b))', 'Legitimate interest (Article 6(1)(f))'], purposes: ['Educational services', 'Academic tracking', 'Communication'], retention_periods: { profile_data: '7 years', academic_records: 'Permanent' } };
}

async function processDSARRequest(requestId) {
  console.log(`[DSAR] Processing request: ${requestId}`);
  await DsarDAO.updateStatus(requestId, 'processing');
  try {
    const request = await DsarDAO.getById(requestId);
    const userData = await collectUserData(request.user_id);
    const exportPath = request.request_type === 'portability' ? await generatePortabilityExport(requestId, userData) : await generateAccessExport(requestId, userData);
    await DsarDAO.updateStatus(requestId, 'completed', { exportPath });
    await sendCompletionEmail(request.email, requestId, exportPath);
    console.log(`[DSAR] Request completed: ${requestId}`);
  } catch (error) {
    console.error(`[DSAR] Processing failed for ${requestId}:`, error);
    await DsarDAO.updateStatus(requestId, 'failed', { error: error.message });
    throw error;
  }
}

async function generateAccessExport(requestId, userData) {
  const exportDir = path.join(__dirname, '../../exports/dsar', requestId);
  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(path.join(exportDir, 'personal_data.json'), JSON.stringify(userData, null, 2));
  await generatePDF(userData, path.join(exportDir, 'personal_data.pdf'));
  const zipPath = path.join(__dirname, '../../exports/dsar', `${requestId}.zip`);
  await createZipArchive(exportDir, zipPath);
  return zipPath;
}

async function generatePortabilityExport(requestId, userData) {
  const exportDir = path.join(__dirname, '../../exports/dsar', requestId);
  await fs.mkdir(exportDir, { recursive: true });
  await fs.writeFile(path.join(exportDir, 'data_export.json'), JSON.stringify(userData, null, 2));
  if (userData.academic?.grades?.length) await fs.writeFile(path.join(exportDir, 'grades.csv'), convertToCSV(userData.academic.grades));
  const zipPath = path.join(__dirname, '../../exports/dsar', `${requestId}_portable.zip`);
  await createZipArchive(exportDir, zipPath);
  return zipPath;
}

async function generatePDF(userData, outputPath) {
  const doc = new PDFDocument();
  const stream = require('fs').createWriteStream(outputPath);
  doc.pipe(stream);
  doc.fontSize(20).text('Your Personal Data', { align: 'center' }).moveDown();
  doc.fontSize(16).text('Profile Information');
  if (userData.profile) { doc.fontSize(12).text(`Name: ${userData.profile.nombre} ${userData.profile.apellido_paterno || ''}`).text(`Email: ${userData.profile.email}`).text(`Role: ${userData.profile.role}`).moveDown(); }
  if (userData.academic) { doc.fontSize(16).text('Academic Data').fontSize(12).text(`Grades: ${userData.academic.grades?.length || 0} records`).text(`Attendance: ${userData.academic.attendance?.length || 0} records`).moveDown(); }
  doc.end();
  return new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
}

function convertToCSV(data) { if (!data?.length) return ''; const headers = Object.keys(data[0]); return [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n'); }

async function createZipArchive(sourceDir, outputPath) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = require('fs').createWriteStream(outputPath);
  return new Promise((resolve, reject) => { archive.directory(sourceDir, false).on('error', reject).pipe(stream); stream.on('close', resolve); archive.finalize(); });
}

async function sendVerificationEmail(email, token, requestId) { console.log(`[DSAR] Verification email sent to ${email} - link: /api/dsar/verify/${token}`); }
async function sendCompletionEmail(email, requestId, exportPath) { console.log(`[DSAR] Completion email sent to ${email} - download: /api/dsar/download/${requestId}`); }

module.exports = { createDSARRequest, verifyDSARRequest, processDSARRequest, collectUserData, generateAccessExport, generatePortabilityExport };
