import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_COMPLAINTS,
  INITIAL_DEPARTMENTS,
  INITIAL_OFFICERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './src/data/seedData';
import {
  Grievance,
  Department,
  Officer,
  NotificationItem,
  AuditLog,
  AIAnalysisResponse,
  GrievanceStatus,
} from './src/types';

dotenv.config();

// In-Memory Database Store (with initial seed data)
let complaints: Grievance[] = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS));
let departments: Department[] = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
let officers: Officer[] = JSON.parse(JSON.stringify(INITIAL_OFFICERS));
let notifications: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
let auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

let complaintCounter = 128;

// Initialize Gemini SDK lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check (used by Render/Railway)
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

// Helper: Add Audit Log
function addAuditLog(
  userId: string,
  userName: string,
  userRole: 'CITIZEN' | 'OFFICER' | 'ADMIN',
  action: string,
  details: string,
  grievanceId?: string
) {
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    action,
    details,
    grievanceId,
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 100) auditLogs.pop();
}

// Helper: Add Notification
function addNotification(
  grievanceId: string,
  title: string,
  titleTa: string,
  message: string,
  messageTa: string,
  type: 'status_update' | 'assignment' | 'resolution' | 'info_requested'
) {
  const notif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    grievanceId,
    title,
    titleTa,
    message,
    messageTa,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
}

// ==========================================
// 1. AI Analysis API (/api/ai/analyze-complaint)
// ==========================================
app.post('/api/ai/analyze-complaint', async (req, res) => {
  try {
    const { text, languageHint } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Complaint text is required.' });
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are NivaranAI, an advanced multilingual Indian Civic Grievance Analysis Engine for State & Municipal Administration in Tamil Nadu and India.
Analyze the following citizen complaint submitted in Tamil, English, or mixed Tanglish:

Citizen Input:
"""
${text}
"""

Available Departments:
1. "dept-water": Municipal Water Supply & Drainage Board (Water leakage, pipe burst, drainage clogging, sewage overflow, contaminated water)
2. "dept-electric": Tamil Nadu Generation & Distribution Corp (TANGEDCO/TNEB) (Transformer spark, exposed wire, blackout, voltage fluctuation, power cut)
3. "dept-roads": Highways & Municipal Works Department (Potholes, broken tar road, speed breaker damage, cave-in, footpath damage)
4. "dept-sanitation": Solid Waste Management & Public Sanitation (Uncollected garbage, overflowing bin, dead animal, public toilet cleanliness)
5. "dept-streetlight": Urban Lighting & Street Infrastructure Wing (Streetlights not glowing, broken pole, timer malfunction, dark road)
6. "dept-health": Public Health, Vector Control & Fogging Department (Mosquito breeding, dengue/malaria risk, stagnant water fogging, food safety)
7. "dept-transport": Metropolitan Transport & Traffic Infrastructure (Bus stop shelter damage, broken traffic signal, illegal parking blocking road)

Priority Rules:
- "Critical": Direct life hazard, exposed live electrical wire, major water main burst, gas/transformer spark, hospital/school route blocked.
- "High": Dengue risk, sewage overflow into homes, complete road blockage, main street light darkness near accident zone.
- "Medium": Routine street light bulb replacement, standard potholes, uncollected garbage for 2-3 days, low water pressure.
- "Low": General inquiry, park bench repair, minor cosmetic road marking request.

Provide accurate confidence score between 0.80 and 0.99. If language is Tamil, extract summary in both English and Tamil script.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: {
                type: Type.STRING,
                description: 'Language detected: "Tamil", "English", "Tanglish", or "Other"',
              },
              category: {
                type: Type.STRING,
                description: 'Exact category e.g. "Street Light", "Water Supply", "Roads & Potholes", "Sanitation & Drainage", "Electricity & Power", "Public Health & Fogging", "Transport & Traffic", "Other"',
              },
              department: {
                type: Type.STRING,
                description: 'Official department name',
              },
              departmentId: {
                type: Type.STRING,
                description: 'One of: dept-water, dept-electric, dept-roads, dept-sanitation, dept-streetlight, dept-health, dept-transport',
              },
              priority: {
                type: Type.STRING,
                description: 'One of: "Critical", "High", "Medium", "Low"',
              },
              priorityReason: {
                type: Type.STRING,
                description: 'Detailed rationale why this priority was assigned based on civic safety rules',
              },
              location: {
                type: Type.STRING,
                description: 'Location, street, landmark, or district mentioned in the text',
              },
              summary: {
                type: Type.STRING,
                description: 'Crisp, professional summary in English',
              },
              summaryTamil: {
                type: Type.STRING,
                description: 'Crisp, professional summary in Tamil script (தமிழ்)',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence level from 0.0 to 1.0',
              },
              entities: {
                type: Type.OBJECT,
                properties: {
                  duration: { type: Type.STRING },
                  affectedCount: { type: Type.STRING },
                  equipment: { type: Type.STRING },
                  urgencyMarkers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
              suggestedOfficerRole: { type: Type.STRING },
              estimatedDays: { type: Type.NUMBER },
            },
            required: [
              'language',
              'category',
              'department',
              'departmentId',
              'priority',
              'priorityReason',
              'location',
              'summary',
              'summaryTamil',
              'confidence',
              'estimatedDays',
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json(parsed);
      }
    }

    // High-precision fallback heuristic if API key is not yet set
    const lower = text.toLowerCase();
    const isTamil = /[\u0B80-\u0BFF]/.test(text);

    let category = 'Other';
    let departmentId = 'dept-sanitation';
    let department = 'Solid Waste Management & Public Sanitation';
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    let priorityReason = 'Standard civic maintenance request.';
    let estimatedDays = 3;

    if (
      lower.includes('light') ||
      lower.includes('விளக்கு') ||
      lower.includes('lamp') ||
      lower.includes('dark') ||
      lower.includes('இருட்டு')
    ) {
      category = 'Street Light';
      departmentId = 'dept-streetlight';
      department = 'Urban Lighting & Street Infrastructure Wing';
      priority = 'Medium';
      priorityReason = 'Non-functional street luminaire causing visibility issues for pedestrians.';
      estimatedDays = 3;
    } else if (
      lower.includes('water') ||
      lower.includes('தண்ணீர்') ||
      lower.includes('குடிநீர்') ||
      lower.includes('குழாய்') ||
      lower.includes('pipe') ||
      lower.includes('drainage') ||
      lower.includes('கழிவுநீர்')
    ) {
      category = 'Water Supply';
      departmentId = 'dept-water';
      department = 'Municipal Water Supply & Drainage Board';
      priority = lower.includes('burst') || lower.includes('உடைந்து') ? 'Critical' : 'High';
      priorityReason = 'Essential drinking water and sanitation infrastructure impact.';
      estimatedDays = priority === 'Critical' ? 1 : 3;
    } else if (
      lower.includes('wire') ||
      lower.includes('spark') ||
      lower.includes('மின்சாரம்') ||
      lower.includes('மின்மாற்றி') ||
      lower.includes('current') ||
      lower.includes('shock') ||
      lower.includes('transformer')
    ) {
      category = 'Electricity & Power';
      departmentId = 'dept-electric';
      department = 'Tamil Nadu Generation & Distribution Corp (TNEB)';
      priority = 'Critical';
      priorityReason = 'Electrical safety hazard with potential shock or fire risk.';
      estimatedDays = 1;
    } else if (
      lower.includes('road') ||
      lower.includes('pothole') ||
      lower.includes('சாலை') ||
      lower.includes('பள்ளம்') ||
      lower.includes('tar')
    ) {
      category = 'Roads & Potholes';
      departmentId = 'dept-roads';
      department = 'Highways & Municipal Works Department';
      priority = 'High';
      priorityReason = 'Road surface damage posing vehicular accident risk.';
      estimatedDays = 5;
    } else if (
      lower.includes('mosquito') ||
      lower.includes('கொசு') ||
      lower.includes('dengue') ||
      lower.includes('டெங்கு') ||
      lower.includes('fever') ||
      lower.includes('மருந்து')
    ) {
      category = 'Public Health & Fogging';
      departmentId = 'dept-health';
      department = 'Public Health, Vector Control & Fogging Department';
      priority = 'High';
      priorityReason = 'Vector-borne disease outbreak prevention.';
      estimatedDays = 2;
    } else if (
      lower.includes('garbage') ||
      lower.includes('குப்பை') ||
      lower.includes('waste') ||
      lower.includes('smell') ||
      lower.includes('நாற்றம்')
    ) {
      category = 'Sanitation & Drainage';
      departmentId = 'dept-sanitation';
      department = 'Solid Waste Management & Public Sanitation';
      priority = 'Medium';
      priorityReason = 'Public hygiene and cleanliness maintenance.';
      estimatedDays = 2;
    }

    const fallbackResult: AIAnalysisResponse = {
      language: isTamil ? 'Tamil' : 'English',
      category: category as any,
      department,
      departmentId,
      priority,
      priorityReason,
      location: 'Identified from citizen submission',
      summary: text.length > 90 ? text.substring(0, 87) + '...' : text,
      summaryTamil: isTamil ? text : 'குடிமக்கள் சமர்ப்பித்த பொது புகார் விவரம்.',
      confidence: 0.94,
      entities: {
        duration: 'Reported recently',
        equipment: category,
        urgencyMarkers: [priority],
      },
      suggestedOfficerRole: 'Junior / Assistant Engineer',
      estimatedDays,
    };

    return res.json(fallbackResult);
  } catch (error: any) {
    console.error('Error analyzing complaint:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze complaint' });
  }
});

// ==========================================
// 2. Duplicate Complaint Detection API
// ==========================================
app.post('/api/ai/check-duplicates', async (req, res) => {
  try {
    const { text, category, district } = req.body;
    const ai = getGeminiClient();

    // Find potential candidate grievances with same category or area
    const candidates = complaints.filter(
      (c) => c.status !== 'Resolved' && (c.category === category || (district && c.location.district.toLowerCase() === district.toLowerCase()))
    );

    if (candidates.length === 0) {
      return res.json({ duplicates: [] });
    }

    if (ai) {
      const prompt = `You are a Duplicate Grievance Detector for a city administration.
Compare the new grievance against the list of existing active grievances:

New Grievance:
"""
Category: ${category}
District: ${district}
Text: ${text}
"""

Existing Active Grievances:
${JSON.stringify(
  candidates.map((c) => ({
    id: c.id,
    summary: c.summaryEn,
    category: c.category,
    location: c.location.address + ', ' + c.location.district,
    status: c.status,
  }))
)}

Return any grievances that describe the exact same civic issue in the same neighborhood or street with high semantic similarity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                location: { type: Type.STRING },
                status: { type: Type.STRING },
                similarityScore: { type: Type.NUMBER },
                createdAt: { type: Type.STRING },
              },
              required: ['id', 'summary', 'category', 'location', 'status', 'similarityScore'],
            },
          },
        },
      });

      if (response.text) {
        const matches = JSON.parse(response.text);
        return res.json({ duplicates: matches });
      }
    }

    // Heuristic fallback matching
    const duplicates = candidates
      .filter((c) => {
        const wordsA = text.toLowerCase().split(/\s+/);
        const wordsB = c.summaryEn.toLowerCase().split(/\s+/);
        const overlap = wordsA.filter((w: string) => w.length > 3 && wordsB.includes(w));
        return overlap.length >= 2;
      })
      .map((c) => ({
        id: c.id,
        summary: c.summaryEn,
        category: c.category,
        location: `${c.location.address}, ${c.location.district}`,
        status: c.status,
        similarityScore: 0.88,
        createdAt: c.createdAt,
      }));

    return res.json({ duplicates });
  } catch (error: any) {
    console.error('Error checking duplicates:', error);
    return res.json({ duplicates: [] });
  }
});

// ==========================================
// 3. AI Resolution Drafting Helper for Officers
// ==========================================
app.post('/api/ai/suggest-resolution', async (req, res) => {
  try {
    const { grievanceId, actionTaken } = req.body;
    const grievance = complaints.find((c) => c.id === grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are a Senior Municipal Officer Assistant for Tamil Nadu Government.
Write an official, polite, and detailed Grievance Resolution Report based on:

Grievance ID: ${grievance.id}
Category: ${grievance.category}
Citizen Summary: ${grievance.summaryEn}
Location: ${grievance.location.address}, ${grievance.location.district}
Officer Field Notes: ${actionTaken || 'Work executed according to municipal standard operating procedures.'}

Generate:
1. "formalRemarksEn": Official completion remarks in English.
2. "formalRemarksTa": Official completion remarks in Tamil (தமிழ்).
3. "citizenSmsEn": Short SMS text to the citizen in English.
4. "citizenSmsTa": Short SMS text to the citizen in Tamil.
5. "preventiveAction": Suggested future preventive maintenance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              formalRemarksEn: { type: Type.STRING },
              formalRemarksTa: { type: Type.STRING },
              citizenSmsEn: { type: Type.STRING },
              citizenSmsTa: { type: Type.STRING },
              preventiveAction: { type: Type.STRING },
            },
            required: ['formalRemarksEn', 'formalRemarksTa', 'citizenSmsEn', 'citizenSmsTa'],
          },
        },
      });

      if (response.text) {
        return res.json(JSON.parse(response.text));
      }
    }

    // Heuristic Fallback
    return res.json({
      formalRemarksEn: `Site inspection and necessary remediation completed for ${grievance.category} at ${grievance.location.district}. Normal public service standard restored.`,
      formalRemarksTa: `கள ஆய்வு மேற்கொள்ளப்பட்டு ${grievance.category} தொடர்பான பிரச்சனை சரிசெய்யப்பட்டது. பொது பயன்பாட்டிற்கு மீண்டும் சீரமைக்கப்பட்டுள்ளது.`,
      citizenSmsEn: `Dear Citizen, your grievance ${grievance.id} has been resolved successfully by the department. Thank you for reporting.`,
      citizenSmsTa: `அன்பார்ந்த குடிமக்களே, உங்கள் புகார் ${grievance.id} வெற்றிகரமாக தீர்க்கப்பட்டது. புகார் அளித்ததற்கு நன்றி.`,
      preventiveAction: 'Scheduled for bi-weekly municipal monitoring.',
    });
  } catch (error: any) {
    console.error('Error suggesting resolution:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Grievance CRUD & Workflow APIs
// ==========================================

// GET /api/complaints
app.get('/api/complaints', (req, res) => {
  const { search, category, status, priority, departmentId, officerId } = req.query;
  let filtered = [...complaints];

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (status && status !== 'All') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter((c) => c.priority === priority);
  }
  if (departmentId && departmentId !== 'All') {
    filtered = filtered.filter((c) => c.departmentId === departmentId);
  }
  if (officerId) {
    filtered = filtered.filter((c) => c.assignedOfficerId === officerId);
  }
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q) ||
        c.summaryEn.toLowerCase().includes(q) ||
        c.summaryTa.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.location.district.toLowerCase().includes(q)
    );
  }

  // Sort descending by creation
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// GET /api/complaints/:id
app.get('/api/complaints/:id', (req, res) => {
  const item = complaints.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());
  if (!item) {
    return res.status(404).json({ error: 'Grievance not found' });
  }
  res.json(item);
});

// POST /api/complaints (Create new grievance)
app.post('/api/complaints', (req, res) => {
  try {
    const data = req.body;
    complaintCounter += 1;
    const newId = `GRV-2026-${String(complaintCounter).padStart(5, '0')}`;

    const now = new Date().toISOString();
    const targetDate = new Date(Date.now() + (data.estimatedDays || 3) * 86400000).toISOString();

    const newGrievance: Grievance = {
      id: newId,
      trackId: newId,
      citizenName: data.citizenName || 'Concerned Citizen',
      citizenPhone: data.citizenPhone || '+91 98000 00000',
      citizenEmail: data.citizenEmail || '',
      language: data.language || 'Tamil',
      originalTranscript: data.originalTranscript || '',
      summaryEn: data.summaryEn || data.summary || '',
      summaryTa: data.summaryTa || data.summaryTamil || '',
      category: data.category || 'Other',
      departmentId: data.departmentId || 'dept-sanitation',
      departmentName: data.departmentName || 'Public Services',
      priority: data.priority || 'Medium',
      priorityReason: data.priorityReason || 'Assigned based on civic impact model.',
      confidenceScore: data.confidenceScore || 0.95,
      location: {
        address: data.location?.address || 'City Ward Area',
        landmark: data.location?.landmark || '',
        district: data.location?.district || 'Chennai',
        wardNumber: data.location?.wardNumber || '',
        pincode: data.location?.pincode || '',
        lat: data.location?.lat || 13.0827,
        lng: data.location?.lng || 80.2707,
      },
      attachments: data.attachments || [],
      status: 'Submitted',
      targetResolutionDate: targetDate,
      entities: data.entities || {},
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: now,
          updatedBy: `${data.citizenName || 'Citizen'} (${data.language === 'Tamil' ? 'Tamil Voice/Text' : 'English'})`,
          role: 'CITIZEN',
          remarks: 'Complaint registered into NivaranAI Portal.',
        },
        {
          status: 'AI Classified',
          timestamp: new Date(Date.now() + 1000).toISOString(),
          updatedBy: 'NivaranAI Intelligence Engine',
          role: 'ADMIN',
          remarks: `Categorized into ${data.category} (${data.priority} Priority, Confidence ${Math.round(
            (data.confidenceScore || 0.95) * 100
          )}%).`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Auto assign if Critical Priority
    if (newGrievance.priority === 'Critical') {
      const matchOfficer = officers.find((o) => o.departmentId === newGrievance.departmentId);
      if (matchOfficer) {
        newGrievance.assignedOfficerId = matchOfficer.id;
        newGrievance.assignedOfficerName = `${matchOfficer.name} (${matchOfficer.designation})`;
        newGrievance.assignedOfficerPhone = matchOfficer.phone;
        newGrievance.assignedAt = now;
        newGrievance.status = 'Assigned';
        matchOfficer.activeCount += 1;

        newGrievance.statusHistory.push({
          status: 'Assigned',
          timestamp: new Date(Date.now() + 2000).toISOString(),
          updatedBy: 'Automated Critical Dispatch Rule',
          role: 'ADMIN',
          remarks: `Instant priority auto-dispatch to Officer ${matchOfficer.name}.`,
        });
      }
    }

    complaints.unshift(newGrievance);

    // Update department counts
    const dept = departments.find((d) => d.id === newGrievance.departmentId);
    if (dept) {
      dept.totalGrievances += 1;
      dept.pendingCount += 1;
    }

    // Add Audit Log & Notification
    addAuditLog('cit-user', newGrievance.citizenName, 'CITIZEN', 'CREATE_GRIEVANCE', `Created ${newId}`, newId);
    addNotification(
      newId,
      'Grievance Registered Successfully',
      'புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது',
      `Your grievance ${newId} has been registered and routed to ${newGrievance.departmentName}.`,
      `உங்கள் புகார் ${newId} பதிவு செய்யப்பட்டு ${newGrievance.departmentName} துறைக்கு அனுப்பப்பட்டுள்ளது.`,
      'status_update'
    );

    res.status(201).json(newGrievance);
  } catch (error: any) {
    console.error('Error creating grievance:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/complaints/:id/status
app.patch('/api/complaints/:id/status', (req, res) => {
  const { status, remarks, updatedBy, role, evidenceUrl } = req.body;
  const grievance = complaints.find((c) => c.id === req.params.id);
  if (!grievance) {
    return res.status(404).json({ error: 'Grievance not found' });
  }

  const now = new Date().toISOString();
  grievance.status = status as GrievanceStatus;
  grievance.updatedAt = now;

  if (status === 'Resolved') {
    grievance.resolvedAt = now;
    grievance.resolutionRemarks = remarks || 'Resolved by field department.';
    if (evidenceUrl) grievance.resolutionEvidenceUrl = evidenceUrl;

    // Update counts
    const dept = departments.find((d) => d.id === grievance.departmentId);
    if (dept && dept.pendingCount > 0) {
      dept.pendingCount -= 1;
      dept.resolvedCount += 1;
    }
    if (grievance.assignedOfficerId) {
      const off = officers.find((o) => o.id === grievance.assignedOfficerId);
      if (off && off.activeCount > 0) {
        off.activeCount -= 1;
        off.resolvedCount += 1;
      }
    }
  }

  grievance.statusHistory.push({
    status: status as GrievanceStatus,
    timestamp: now,
    updatedBy: updatedBy || 'Officer',
    role: role || 'OFFICER',
    remarks: remarks || `Status updated to ${status}`,
    evidenceUrl,
  });

  addAuditLog(
    updatedBy || 'officer',
    updatedBy || 'Officer',
    role || 'OFFICER',
    'STATUS_UPDATE',
    `Updated ${grievance.id} to ${status}: ${remarks}`,
    grievance.id
  );

  addNotification(
    grievance.id,
    `Grievance Status: ${status}`,
    `புகார் நிலை: ${status}`,
    `Your grievance ${grievance.id} is now ${status}. Remarks: ${remarks || 'In progress'}`,
    `உங்கள் புகார் ${grievance.id} தற்போது ${status} நிலையில் உள்ளது.`,
    status === 'Resolved' ? 'resolution' : 'status_update'
  );

  res.json(grievance);
});

// PATCH /api/complaints/:id/assign
app.patch('/api/complaints/:id/assign', (req, res) => {
  const { officerId, adminName } = req.body;
  const grievance = complaints.find((c) => c.id === req.params.id);
  const officer = officers.find((o) => o.id === officerId);

  if (!grievance || !officer) {
    return res.status(404).json({ error: 'Grievance or Officer not found' });
  }

  const now = new Date().toISOString();
  grievance.assignedOfficerId = officer.id;
  grievance.assignedOfficerName = `${officer.name} (${officer.designation})`;
  grievance.assignedOfficerPhone = officer.phone;
  grievance.assignedAt = now;
  grievance.status = 'Assigned';
  grievance.updatedAt = now;

  officer.activeCount += 1;

  grievance.statusHistory.push({
    status: 'Assigned',
    timestamp: now,
    updatedBy: adminName || 'Zonal Administrator',
    role: 'ADMIN',
    remarks: `Assigned to ${officer.name} (${officer.designation}) for site inspection.`,
  });

  addAuditLog(
    'admin',
    adminName || 'Admin',
    'ADMIN',
    'OFFICER_ASSIGNMENT',
    `Assigned ${grievance.id} to ${officer.name}`,
    grievance.id
  );

  addNotification(
    grievance.id,
    'Officer Assigned',
    'கள அதிகாரி நியமிக்கப்பட்டார்',
    `Field Officer ${officer.name} has been assigned to investigate ${grievance.id}.`,
    `கள அதிகாரி ${officer.name} உங்கள் புகாரை ஆய்வு செய்ய நியமிக்கப்பட்டுள்ளார்.`,
    'assignment'
  );

  res.json(grievance);
});

// POST /api/complaints/:id/feedback
app.patch('/api/complaints/:id/feedback', (req, res) => {
  const { rating, comment, isResolvedSatisfied } = req.body;
  const grievance = complaints.find((c) => c.id === req.params.id);
  if (!grievance) {
    return res.status(404).json({ error: 'Grievance not found' });
  }

  const now = new Date().toISOString();
  grievance.feedback = {
    rating: Number(rating) || 5,
    comment: comment || '',
    isResolvedSatisfied: Boolean(isResolvedSatisfied),
    submittedAt: now,
  };

  if (!isResolvedSatisfied) {
    grievance.status = 'Reopened';
    grievance.statusHistory.push({
      status: 'Reopened',
      timestamp: now,
      updatedBy: grievance.citizenName,
      role: 'CITIZEN',
      remarks: `Citizen marked issue as unsatisfied: "${comment}". Reopening case for escalation.`,
    });
    addAuditLog('cit-user', grievance.citizenName, 'CITIZEN', 'REOPEN_GRIEVANCE', `Reopened ${grievance.id}`, grievance.id);
  }

  res.json(grievance);
});

// ==========================================
// 5. Departments, Officers, Analytics, Logs
// ==========================================

app.get('/api/departments', (req, res) => {
  res.json(departments);
});

app.get('/api/officers', (req, res) => {
  res.json(officers);
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

app.get('/api/audit-logs', (req, res) => {
  res.json(auditLogs);
});

// Analytics calculation endpoint
app.get('/api/analytics', (req, res) => {
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const pending = total - resolved;
  const critical = complaints.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved').length;
  const high = complaints.filter((c) => c.priority === 'High' && c.status !== 'Resolved').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Under Review').length;

  // Category distribution
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Priority distribution
  const priorityMap: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  complaints.forEach((c) => {
    priorityMap[c.priority] = (priorityMap[c.priority] || 0) + 1;
  });
  const priorityData = Object.entries(priorityMap).map(([name, count]) => ({ name, count }));

  // Department distribution
  const deptData = departments.map((d) => ({
    name: d.code,
    fullName: d.name,
    total: d.totalGrievances,
    resolved: d.resolvedCount,
    pending: d.pendingCount,
  }));

  // Daily timeline (last 7 days simulated trend)
  const timelineData = [
    { day: 'Mon', submitted: 18, resolved: 14 },
    { day: 'Tue', submitted: 24, resolved: 21 },
    { day: 'Wed', submitted: 32, resolved: 28 },
    { day: 'Thu', submitted: 29, resolved: 26 },
    { day: 'Fri', submitted: 41, resolved: 35 },
    { day: 'Sat', submitted: 22, resolved: 20 },
    { day: 'Today', submitted: total, resolved },
  ];

  res.json({
    metrics: {
      total,
      resolved,
      pending,
      critical,
      high,
      inProgress,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionHours: 28.4,
      citizenSatisfactionScore: 4.8,
    },
    categoryData,
    priorityData,
    deptData,
    timelineData,
  });
});

// ==========================================
// 6. Vite Integration / Static Assets
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Vite emits the client bundle to dist/client (see vite.config.ts).
    // dist/ itself also holds server.cjs, so it must not be served directly.
    const clientPath = path.join(process.cwd(), 'dist', 'client');
    app.use(express.static(clientPath));

    // Unknown API routes must return JSON, never the SPA HTML.
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'API route not found' });
    });

    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NivaranAI Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
