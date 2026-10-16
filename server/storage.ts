import { randomUUID } from 'node:crypto';
import { getSupabase } from './supabase';

const DEFAULT_BUCKET = 'grievance-evidence';
const MAX_BYTES = 400_000;
const ALLOWED = new Map<string, { extension: string; type: 'image' }>([
  ['image/jpeg', { extension: 'jpg', type: 'image' }],
  ['image/png', { extension: 'png', type: 'image' }],
  ['image/webp', { extension: 'webp', type: 'image' }],
]);

export type StoredEvidence = {
  attachmentId: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

function sniff(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function malwareScan(bytes: Buffer): Promise<void> {
  if (process.env.CLAMAV_SCAN_URL) {
    const response = await fetch(process.env.CLAMAV_SCAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: bytes,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Malware scanner returned HTTP ${response.status}`);
    const result = await response.text();
    if (/infected|malware|virus|found/i.test(result)) throw new Error('Uploaded evidence failed malware scanning.');
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Malware scanning is required but CLAMAV_SCAN_URL is not configured.');
  }
}

export async function storeEvidence(dataUrl: string, grievanceId: string, name: string, requestedAttachmentId?: string): Promise<StoredEvidence> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
  if (!match) throw new Error('Only JPEG, PNG, and WebP evidence is accepted.');
  const declaredType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Evidence exceeds the size limit.');
  const detectedType = sniff(bytes);
  if (!detectedType || detectedType !== declaredType || !ALLOWED.has(detectedType)) throw new Error('Evidence content does not match its declared type.');
  await malwareScan(bytes);

  const db = getSupabase();
  if (!db) throw new Error('Storage service is not configured.');
  const bucket = process.env.GRIEVANCE_STORAGE_BUCKET || DEFAULT_BUCKET;
  const { data: existingBucket } = await db.storage.getBucket(bucket);
  if (!existingBucket) {
    const { error: bucketError } = await db.storage.createBucket(bucket, { public: false, fileSizeLimit: '400KB', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] });
    if (bucketError && !/already exists/i.test(bucketError.message)) throw new Error('Evidence storage bucket is unavailable.');
  }
  const attachmentId = requestedAttachmentId && /^[A-Za-z0-9_-]{1,80}$/.test(requestedAttachmentId) ? requestedAttachmentId : randomUUID();
  const extension = ALLOWED.get(detectedType)!.extension;
  const storagePath = `grievances/${grievanceId}/${attachmentId}.${extension}`;

  const { error: uploadError } = await db.storage.from(bucket).upload(storagePath, bytes, {
    contentType: detectedType,
    upsert: false,
    cacheControl: '3600',
  });
  if (uploadError) throw new Error('Evidence storage upload failed.');

  return { attachmentId, storagePath, mimeType: detectedType, sizeBytes: bytes.length };
}

export async function downloadEvidence(storagePath: string) {
  const db = getSupabase();
  if (!db) throw new Error('Storage service is not configured.');
  const bucket = process.env.GRIEVANCE_STORAGE_BUCKET || DEFAULT_BUCKET;
  const { data, error } = await db.storage.from(bucket).download(storagePath);
  if (error || !data) throw new Error('Evidence could not be retrieved.');
  return data;
}

export function attachmentProxyUrl(grievanceId: string, attachmentId: string) {
  const base = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');
  return `${base}/api/grievances/${encodeURIComponent(grievanceId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

export function safeAttachmentName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'evidence';
}

export async function removeEvidence(storagePath: string) {
  const db = getSupabase();
  if (!db) return;
  const bucket = process.env.GRIEVANCE_STORAGE_BUCKET || DEFAULT_BUCKET;
  await db.storage.from(bucket).remove([storagePath]);
}
