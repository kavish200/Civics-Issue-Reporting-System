import { IssueCategory, IssuePriority, IssueStatus } from '../../constants';

export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

export interface StatusHistoryItem {
  status: IssueStatus;
  remark?: string;
  changedBy?: {
    _id?: string;
    name?: string;
  };
  createdAt: string;
}

export interface Issue {
  _id: string;
  trackingId: string;
  category: IssueCategory;
  description: string;
  image?: string;
  location: LocationPoint;
  status: IssueStatus;
  statusHistory: StatusHistoryItem[];
  priority: IssuePriority;
  priorityScore: number;
  duplicateCandidate: boolean;
  duplicateOf?: string;
  citizenConfirmed?: boolean | null;
  rating?: number;
  feedback?: string;
  clientId?: string;
  reporter?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocalDraft {
  id: string;
  category: IssueCategory;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUri?: string;
  createdAt: string;
  lastAttemptError?: string;
}

export interface CreateIssueInput {
  category: IssueCategory;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUri?: string;
  clientId?: string;
}
