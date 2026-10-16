// One-off, read-only-on-Firebase importer: Firestore -> Supabase PostgreSQL.
//
// Run this ONCE (locally or in a trusted environment, never in the browser) to copy
// existing Firestore records into Supabase. The running app no longer reads Firestore.
//
//   node scripts/migrate-firestore-to-supabase.mjs --dry-run   # counts + reference checks only
//   node scripts/migrate-firestore-to-supabase.mjs             # perform the import
//
// Required environment variables (server-side only):
//   FIREBASE_SERVICE_ACCOUNT_JSON  Firebase Admin service account (JSON string)
//   FIRESTORE_DATABASE_ID          ID of the Firestore database to read from
//   SUPABASE_URL                   https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY      Supabase service-role key. NEVER put this in a VITE_ variable.
//
// Firestore data is only read, never modified or deleted. The import is idempotent:
// parent rows are upserted by primary key; history/attachment rows are replaced
// per grievance. Apply supabase/migrations/*.sql first.

import 'dotenv/config';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 200;

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function iso(value) {
  if (value == null || value === '') return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
const text = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const optText = (value) => (typeof value === 'string' && value !== '' ? value : null);
const optNum = (value) =>
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

function initFirestore() {
  const serviceAccount = JSON.parse(required('FIREBASE_SERVICE_ACCOUNT_JSON'));
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount) });
  return getFirestore(app, required('FIRESTORE_DATABASE_ID'));
}

async function readCollection(firestore, name) {
  const snapshot = await firestore.collection(name).get();
  return snapshot.docs.map((doc) => ({ ...doc.data(), __docId: doc.id }));
}

// --- mappers: Firestore document -> Supabase row -----------------------------
const mapAdmin = (d) => ({
  id: d.__docId,
  email: optText(d.email),
  active: d.active === true,
  provisioned_at: iso(d.provisionedAt) ?? new Date().toISOString(),
});

const mapDepartment = (d) => ({
  id: d.__docId,
  name: text(d.name),
  name_tamil: text(d.nameTamil),
  code: text(d.code),
  head_name: text(d.headName),
  contact_number: text(d.contactNumber),
  email: text(d.email),
  total_grievances: optNum(d.totalGrievances) ?? 0,
  pending_count: optNum(d.pendingCount) ?? 0,
  resolved_count: optNum(d.resolvedCount) ?? 0,
  sla_days: optNum(d.slaDays) ?? 0,
  icon_name: text(d.iconName),
});

const mapOfficer = (d) => ({
  id: d.__docId,
  name: text(d.name),
  name_tamil: optText(d.nameTamil),
  department_id: d.departmentId,
  department_name: text(d.departmentName),
  designation: text(d.designation),
  phone: text(d.phone),
  email: text(d.email),
  active_count: optNum(d.activeCount) ?? 0,
  resolved_count: optNum(d.resolvedCount) ?? 0,
  avatar: text(d.avatar),
  zone: text(d.zone),
});

function mapGrievance(d) {
  const loc = d.location || {};
  const fb = d.feedback || null;
  const createdAt = iso(d.createdAt) ?? new Date().toISOString();
  return {
    id: d.__docId,
    track_id: text(d.trackId, d.__docId),
    citizen_id: optText(d.citizenId),
    verification_method: d.verificationMethod === 'phone' || d.verificationMethod === 'email' ? d.verificationMethod : null,
    citizen_name: text(d.citizenName),
    citizen_phone: text(d.citizenPhone),
    citizen_email: optText(d.citizenEmail),
    language: d.language,
    original_transcript: text(d.originalTranscript),
    summary_en: text(d.summaryEn),
    summary_ta: text(d.summaryTa),
    category: d.category,
    department_id: optText(d.departmentId),
    department_name: text(d.departmentName),
    priority: d.priority,
    priority_reason: text(d.priorityReason),
    confidence_score: optNum(d.confidenceScore) ?? 0,
    location_address: text(loc.address),
    location_landmark: optText(loc.landmark),
    location_district: text(loc.district),
    location_constituency: optText(loc.constituency),
    location_ward_number: optText(loc.wardNumber),
    location_pincode: optText(loc.pincode),
    location_lat: optNum(loc.lat),
    location_lng: optNum(loc.lng),
    status: d.status,
    assigned_officer_id: optText(d.assignedOfficerId),
    assigned_officer_name: optText(d.assignedOfficerName),
    assigned_officer_phone: optText(d.assignedOfficerPhone),
    assigned_at: iso(d.assignedAt),
    target_resolution_date: iso(d.targetResolutionDate),
    estimated_days: optNum(d.estimatedDays),
    resolved_at: iso(d.resolvedAt),
    resolution_remarks: optText(d.resolutionRemarks),
    resolution_evidence_url: optText(d.resolutionEvidenceUrl),
    feedback_rating: fb ? optNum(fb.rating) : null,
    feedback_comment: fb ? optText(fb.comment) : null,
    feedback_satisfied: fb && typeof fb.isResolvedSatisfied === 'boolean' ? fb.isResolvedSatisfied : null,
    feedback_submitted_at: fb ? iso(fb.submittedAt) : null,
    entities: d.entities && typeof d.entities === 'object' ? d.entities : {},
    is_duplicate_of: optText(d.isDuplicateOf),
    created_at: createdAt,
    updated_at: iso(d.updatedAt) ?? createdAt,
  };
}

function mapHistory(d, grievanceRow) {
  const items = Array.isArray(d.statusHistory) ? d.statusHistory : [];
  return items.map((h) => ({
    grievance_id: grievanceRow.id,
    status: h.status,
    occurred_at: iso(h.timestamp) ?? grievanceRow.created_at,
    updated_by: text(h.updatedBy),
    role: h.role,
    remarks: text(h.remarks),
    evidence_url: optText(h.evidenceUrl),
  }));
}

function mapAttachments(d, grievanceRow) {
  const items = Array.isArray(d.attachments) ? d.attachments : [];
  return items.map((a, index) => ({
    grievance_id: grievanceRow.id,
    attachment_id: text(a.id, `attachment-${index + 1}`),
    url: text(a.url),
    name: text(a.name),
    type: a.type,
    uploaded_at: iso(a.uploadedAt) ?? grievanceRow.created_at,
  }));
}

const mapAuditLog = (d, validGrievanceIds) => ({
  id: d.__docId,
  occurred_at: iso(d.timestamp) ?? new Date().toISOString(),
  user_id: text(d.userId),
  user_name: text(d.userName),
  user_role: d.userRole,
  action: text(d.action),
  details: text(d.details),
  grievance_id: d.grievanceId && validGrievanceIds.has(d.grievanceId) ? d.grievanceId : null,
});

// --- Supabase writers ---------------------------------------------------------
function makeWriters(supabase) {
  return {
    async upsert(table, rows, onConflict = 'id') {
      console.log(`${table}: ${rows.length} row(s)${DRY_RUN ? ' [dry run, not written]' : ''}`);
      if (DRY_RUN) return;
      for (const part of chunk(rows, BATCH)) {
        const { error } = await supabase.from(table).upsert(part, { onConflict });
        if (error) throw new Error(`${table}: ${error.message}`);
      }
    },
    async replaceChildren(table, grievanceIds, rows) {
      console.log(`${table}: ${rows.length} row(s)${DRY_RUN ? ' [dry run, not written]' : ''}`);
      if (DRY_RUN) return;
      for (const ids of chunk(grievanceIds, BATCH)) {
        const { error } = await supabase.from(table).delete().in('grievance_id', ids);
        if (error) throw new Error(`${table} (clear): ${error.message}`);
      }
      for (const part of chunk(rows, BATCH)) {
        const { error } = await supabase.from(table).insert(part);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
    },
  };
}

// Grievances keep department_id as a plain AI-assigned ID (no foreign key), so only
// officers -> departments and grievances -> officers must resolve.
function findMissingReferences(departments, officers, grievances) {
  const departmentIds = new Set(departments.map((r) => r.id));
  const officerIds = new Set(officers.map((r) => r.id));
  const missingDepartments = new Set();
  const missingOfficers = new Set();
  for (const o of officers) if (!departmentIds.has(o.department_id)) missingDepartments.add(o.department_id);
  for (const g of grievances) {
    if (g.assigned_officer_id && !officerIds.has(g.assigned_officer_id)) missingOfficers.add(g.assigned_officer_id);
  }
  return { missingDepartments: [...missingDepartments], missingOfficers: [...missingOfficers] };
}

async function main() {
  const firestore = initFirestore();

  const [rawAdmins, rawDepartments, rawOfficers, rawGrievances, rawAudit] = await Promise.all([
    readCollection(firestore, 'admins'),
    readCollection(firestore, 'departments'),
    readCollection(firestore, 'officers'),
    readCollection(firestore, 'grievances'),
    readCollection(firestore, 'auditLogs'),
  ]);

  const admins = rawAdmins.map(mapAdmin);
  const departments = rawDepartments.map(mapDepartment);
  const officers = rawOfficers.map(mapOfficer);
  const grievances = rawGrievances.map(mapGrievance);
  const history = rawGrievances.flatMap((d, i) => mapHistory(d, grievances[i]));
  const attachments = rawGrievances.flatMap((d, i) => mapAttachments(d, grievances[i]));
  const grievanceIds = new Set(grievances.map((g) => g.id));
  const auditLogs = rawAudit.map((d) => mapAuditLog(d, grievanceIds));

  const { missingDepartments, missingOfficers } = findMissingReferences(departments, officers, grievances);
  if (missingDepartments.length || missingOfficers.length) {
    console.error('Referenced records are missing from Firestore, so foreign keys would fail:');
    if (missingDepartments.length) console.error(`  departments: ${missingDepartments.join(', ')}`);
    if (missingOfficers.length) console.error(`  officers: ${missingOfficers.join(', ')}`);
    console.error('Provision these records (or fix the references) and re-run.');
    if (!DRY_RUN) process.exit(1);
  }

  console.log(`Source (Firestore): admins=${admins.length} departments=${departments.length} officers=${officers.length} grievances=${grievances.length} auditLogs=${auditLogs.length}`);
  if (DRY_RUN) console.log('Dry run: nothing will be written to Supabase.');

  const supabase = DRY_RUN
    ? null
    : createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
  const writers = makeWriters(supabase);

  // Parents before children so foreign keys resolve.
  await writers.upsert('admins', admins);
  await writers.upsert('departments', departments);
  await writers.upsert('officers', officers);
  await writers.upsert('grievances', grievances);
  await writers.replaceChildren('grievance_status_history', [...grievanceIds], history);
  await writers.replaceChildren('grievance_attachments', [...grievanceIds], attachments);
  await writers.upsert('audit_logs', auditLogs);

  console.log(DRY_RUN ? 'Dry run complete.' : 'Import complete. Compare the counts above with the Supabase tables.');
}

main().catch((error) => {
  // Do not print row data (it contains citizen PII); the message names only the table and database error.
  console.error('Migration failed:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
});
