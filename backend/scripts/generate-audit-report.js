/**
 * 📊 AUDIT REPORT GENERATOR - SEMANA 15
 * Generate comprehensive audit reports for compliance
 *
 * Features:
 * - CSV/JSON/PDF report generation
 * - Customizable date range
 * - Filter by user, action, resource
 * - Summary statistics
 * - Integrity verification report
 *
 * Usage:
 *   node backend/scripts/generate-audit-report.js --start 2025-01-01 --end 2025-12-31 --format csv
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const auditLogger = require('../middleware/audit-logger');

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

// Parse command-line arguments
const args = process.argv.slice(2);

const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : defaultValue;
};

const START_DATE = getArg('start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
const END_DATE = getArg('end', new Date().toISOString().split('T')[0]);
const FORMAT = getArg('format', 'csv'); // csv, json, html
const USER_ID = getArg('user', null);
const ACTION = getArg('action', null);
const RESOURCE = getArg('resource', null);

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'audit-reports');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function log(message) {
  console.log(`[AUDIT-REPORT] ${message}`);
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchAuditLogs() {
  log(`Fetching audit logs from ${START_DATE} to ${END_DATE}...`);

  // Build query with filters
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Date range (always applied)
  conditions.push(`timestamp >= $${paramIndex}`);
  params.push(`${START_DATE}T00:00:00Z`);
  paramIndex++;

  conditions.push(`timestamp <= $${paramIndex}`);
  params.push(`${END_DATE}T23:59:59Z`);
  paramIndex++;

  // Optional filters
  if (USER_ID) {
    conditions.push(`user_id = $${paramIndex}`);
    params.push(USER_ID);
    paramIndex++;
  }

  if (ACTION) {
    conditions.push(`action = $${paramIndex}`);
    params.push(ACTION);
    paramIndex++;
  }

  if (RESOURCE) {
    conditions.push(`resource = $${paramIndex}`);
    params.push(RESOURCE);
    paramIndex++;
  }

  const query = `
    SELECT id, user_id, action, resource, resource_id, timestamp, ip_address, user_agent, changes
    FROM audit_logs
    WHERE ${conditions.join(' AND ')}
    ORDER BY timestamp DESC
  `;

  const result = await pool.query(query, params);

  log(`Found ${result.rows.length} audit logs`);

  return result.rows;
}

// =============================================================================
// STATISTICS
// =============================================================================

async function generateStatistics(logs) {
  log('Generating statistics...');

  const stats = {
    total_logs: logs.length,
    date_range: {
      start: START_DATE,
      end: END_DATE
    },
    by_action: {},
    by_resource: {},
    by_user: {},
    by_ip: {},
    unique_users: new Set(),
    unique_ips: new Set()
  };

  for (const log of logs) {
    // Count by action
    stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

    // Count by resource
    stats.by_resource[log.resource] = (stats.by_resource[log.resource] || 0) + 1;

    // Count by user
    stats.by_user[log.user_id] = (stats.by_user[log.user_id] || 0) + 1;

    // Count by IP
    stats.by_ip[log.ip_address] = (stats.by_ip[log.ip_address] || 0) + 1;

    // Track unique users and IPs
    stats.unique_users.add(log.user_id);
    stats.unique_ips.add(log.ip_address);
  }

  // Convert Sets to counts
  stats.unique_user_count = stats.unique_users.size;
  stats.unique_ip_count = stats.unique_ips.size;
  delete stats.unique_users;
  delete stats.unique_ips;

  // Sort by count (top 10)
  stats.top_actions = Object.entries(stats.by_action)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }));

  stats.top_resources = Object.entries(stats.by_resource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([resource, count]) => ({ resource, count }));

  stats.top_users = Object.entries(stats.by_user)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user_id, count]) => ({ user_id, count }));

  return stats;
}

// =============================================================================
// INTEGRITY VERIFICATION
// =============================================================================

async function verifyIntegrity() {
  log('Verifying audit log integrity (blockchain-style hash chain)...');

  try {
    const result = await auditLogger.verifyAuditLogIntegrity();

    if (result.valid) {
      log('✅ Integrity check PASSED - No tampering detected');
      return { valid: true };
    } else {
      log(`❌ Integrity check FAILED - Tampering detected at log ID: ${result.tamperedIndex}`);
      return {
        valid: false,
        tampered_index: result.tamperedIndex,
        tampered_log: result.tamperedLog,
        reason: result.reason
      };
    }
  } catch (error) {
    log(`⚠️  Integrity check ERROR: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateCSV(logs, stats, integrity) {
  log('Generating CSV report...');

  let csv = 'ID,Timestamp,User ID,Action,Resource,Resource ID,IP Address,User Agent,Changes\n';

  for (const log of logs) {
    const changes = JSON.stringify(log.changes || {}).replace(/"/g, '""');
    csv += `${log.id},"${log.timestamp}","${log.user_id}","${log.action}","${log.resource}","${log.resource_id}","${log.ip_address}","${log.user_agent}","${changes}"\n`;
  }

  // Add statistics as comments
  csv += `\n# STATISTICS\n`;
  csv += `# Total Logs: ${stats.total_logs}\n`;
  csv += `# Date Range: ${stats.date_range.start} to ${stats.date_range.end}\n`;
  csv += `# Unique Users: ${stats.unique_user_count}\n`;
  csv += `# Unique IPs: ${stats.unique_ip_count}\n`;
  csv += `# Integrity Check: ${integrity.valid ? 'PASSED' : 'FAILED'}\n`;

  return csv;
}

function generateJSON(logs, stats, integrity) {
  log('Generating JSON report...');

  return JSON.stringify({
    metadata: {
      generated_at: new Date().toISOString(),
      date_range: {
        start: START_DATE,
        end: END_DATE
      },
      filters: {
        user_id: USER_ID,
        action: ACTION,
        resource: RESOURCE
      }
    },
    statistics: stats,
    integrity_check: integrity,
    logs
  }, null, 2);
}

function generateHTML(logs, stats, integrity) {
  log('Generating HTML report...');

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Report ${START_DATE} to ${END_DATE}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .stats { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .integrity-pass { color: green; font-weight: bold; }
    .integrity-fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>📊 Audit Report</h1>
  <p><strong>Date Range:</strong> ${START_DATE} to ${END_DATE}</p>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>

  <div class="stats">
    <h2>📈 Statistics</h2>
    <p><strong>Total Logs:</strong> ${stats.total_logs}</p>
    <p><strong>Unique Users:</strong> ${stats.unique_user_count}</p>
    <p><strong>Unique IPs:</strong> ${stats.unique_ip_count}</p>

    <h3>Top Actions</h3>
    <ul>
      ${stats.top_actions.map(a => `<li>${a.action}: ${a.count}</li>`).join('')}
    </ul>

    <h3>Top Resources</h3>
    <ul>
      ${stats.top_resources.map(r => `<li>${r.resource}: ${r.count}</li>`).join('')}
    </ul>

    <h3>🔒 Integrity Check</h3>
    <p class="${integrity.valid ? 'integrity-pass' : 'integrity-fail'}">
      ${integrity.valid ? '✅ PASSED - No tampering detected' : '❌ FAILED - Tampering detected'}
    </p>
  </div>

  <h2>📋 Audit Logs</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Timestamp</th>
        <th>User</th>
        <th>Action</th>
        <th>Resource</th>
        <th>Resource ID</th>
        <th>IP Address</th>
      </tr>
    </thead>
    <tbody>
      ${logs.map(log => `
        <tr>
          <td>${log.id}</td>
          <td>${log.timestamp}</td>
          <td>${log.user_id}</td>
          <td>${log.action}</td>
          <td>${log.resource}</td>
          <td>${log.resource_id}</td>
          <td>${log.ip_address}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
`;

  return html;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  log('============================================');
  log('📊 AUDIT REPORT GENERATOR');
  log('============================================');
  log(`Date Range: ${START_DATE} to ${END_DATE}`);
  log(`Format: ${FORMAT}`);
  log(`Filters: User=${USER_ID || 'ALL'}, Action=${ACTION || 'ALL'}, Resource=${RESOURCE || 'ALL'}`);
  log('');

  try {
    // Ensure output directory exists
    ensureOutputDir();

    // Fetch audit logs
    const logs = await fetchAuditLogs();

    if (logs.length === 0) {
      log('⚠️  No audit logs found for the specified criteria');
      process.exit(0);
    }

    // Generate statistics
    const stats = await generateStatistics(logs);

    // Verify integrity
    const integrity = await verifyIntegrity();

    // Generate report based on format
    let report;
    let fileExtension;

    switch (FORMAT.toLowerCase()) {
      case 'csv':
        report = generateCSV(logs, stats, integrity);
        fileExtension = 'csv';
        break;
      case 'json':
        report = generateJSON(logs, stats, integrity);
        fileExtension = 'json';
        break;
      case 'html':
        report = generateHTML(logs, stats, integrity);
        fileExtension = 'html';
        break;
      default:
        throw new Error(`Unknown format: ${FORMAT}`);
    }

    // Save report to file
    const filename = `audit-report-${START_DATE}-to-${END_DATE}.${fileExtension}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, report);

    log('');
    log('============================================');
    log('✅ AUDIT REPORT GENERATED');
    log('============================================');
    log(`Report saved to: ${filepath}`);
    log(`Total logs: ${stats.total_logs}`);
    log(`Integrity check: ${integrity.valid ? 'PASSED ✅' : 'FAILED ❌'}`);
    log('');

    if (!integrity.valid) {
      log('⚠️  WARNING: Audit log integrity check failed');
      log('   This indicates tampering or corruption in the audit trail');
      log('   Immediate investigation required');
    }

    process.exit(0);
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
main();
