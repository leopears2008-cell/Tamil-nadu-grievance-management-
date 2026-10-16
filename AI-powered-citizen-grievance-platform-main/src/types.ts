export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export type GrievanceCategory =
  | 'Street Light'
  | 'Water Supply'
  | 'Roads & Potholes'
  | 'Sanitation & Drainage'
  | 'Electricity & Power'
  | 'Public Health & Fogging'
  | 'Transport & Traffic'
  | 'Encroachment & Parks'
  | 'Other';

export type GrievancePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type GrievanceStatus =
  | 'Submitted'
  | 'AI Classified'
  | 'Assigned'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Reopened'
  | 'Rejected';

export interface StatusHistoryItem {
  status: GrievanceStatus;
  timestamp: string;
  updatedBy: string;
  role: UserRole;
  remarks: string;
  evidenceUrl?: string;
}

export interface Officer {
  id: string;
  name: string;
  nameTamil?: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  phone: string;
  email: string;
  activeCount: number;
  resolvedCount: number;
  avatar: string;
  zone: string;
}

export interface Department {
  id: string;
  name: string;
  nameTamil: string;
  code: string;
  headName: string;
  contactNumber: string;
  email: string;
  totalGrievances: number;
  pendingCount: number;
  resolvedCount: number;
  slaDays: number;
  iconName: string;
}

export interface Grievance {
  id: string; // Document ID
  trackId: string; // GRV-2026-XXXXX
  citizenId?: string; // Firebase Auth UID
  citizenName: string;
  citizenPhone: string;
  citizenEmail?: string;
  language: 'Tamil' | 'English' | 'Tanglish' | 'Other';
  originalTranscript: string;
  summaryEn: string;
  summaryTa: string;
  category: GrievanceCategory;
  departmentId: string;
  departmentName: string;
  priority: GrievancePriority;
  priorityReason: string;
  confidenceScore: number;
  location: {
    address: string;
    landmark?: string;
    district: string;
    constituency?: string;
    wardNumber?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
  };
  attachments: Array<{
    id: string;
    url: string;
    name: string;
    type: 'image' | 'audio' | 'document';
    uploadedAt: string;
  }>;
  status: GrievanceStatus;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedOfficerPhone?: string;
  assignedAt?: string;
  targetResolutionDate: string;
  resolvedAt?: string;
  resolutionRemarks?: string;
  resolutionEvidenceUrl?: string;
  feedback?: {
    rating: number;
    comment: string;
    isResolvedSatisfied: boolean;
    submittedAt: string;
  };
  statusHistory: StatusHistoryItem[];
  entities: {
    duration?: string;
    affectedCount?: string;
    equipment?: string;
    urgencyMarkers?: string[];
  };
  createdAt: string;
  updatedAt: string;
  isDuplicateOf?: string;
}

export interface AIAnalysisResponse {
  language: 'Tamil' | 'English' | 'Tanglish' | 'Other';
  category: GrievanceCategory;
  department: string;
  departmentId: string;
  priority: GrievancePriority;
  priorityReason: string;
  location: string;
  summary: string;
  summaryTamil: string;
  confidence: number;
  entities: {
    duration?: string;
    affectedCount?: string;
    equipment?: string;
    urgencyMarkers?: string[];
  };
  suggestedOfficerRole?: string;
  estimatedDays: number;
  isLowConfidence?: boolean;
}

export interface DuplicateMatch {
  id: string;
  summary: string;
  category: string;
  location: string;
  status: GrievanceStatus;
  similarityScore: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  grievanceId: string;
  title: string;
  titleTa: string;
  message: string;
  messageTa: string;
  type: 'status_update' | 'assignment' | 'resolution' | 'info_requested';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  grievanceId?: string;
}
