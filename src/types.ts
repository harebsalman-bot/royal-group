/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  area: string;
  city: string;
  coverImage: string;
  images: string[];
  beforeImage?: string;
  afterImage?: string;
  category: string; // e.g., 'مطابخ', 'غرف نوم', etc.
  featured: boolean;
  createdAt: number;
  orderIndex?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ColorVariant {
  id: string;
  name: string;
  type: 'wood' | 'marble' | 'wall' | 'flooring';
  colorValue: string; // Hex code or gradient
  image: string; // Image URL of the design with this variant
  createdAt: number;
}

export type RequestStatus = 'New' | 'Under Review' | 'Contacted' | 'Approved' | 'In Progress' | 'Completed' | 'Rejected' | 'pending' | 'reviewed';

export type RejectionReason = 'Outside our scope' | 'Missing project information' | 'Schedule fully booked' | 'Budget mismatch' | 'Other';

export interface DesignRequest {
  id: string;
  name: string;
  phone: string;
  city: string;
  projectType: string;
  area: string;
  budget: string;
  plansUrl?: string[];
  imageUrl?: string[];
  status: RequestStatus;
  createdAt: number;
  requestNumber?: string;
  rejectionReason?: RejectionReason;
  rejectionNotes?: string;
  adminNotes?: string;
  viewed?: boolean;
  ticketId?: string;
  assignedEngineerId?: string | null;
  assignedEngineerName?: string | null;
  assignedAt?: number;
}

export interface CompanySettings {
  address: string;
  phone: string;
  whatsapp: string;
  aboutText: string;
  aboutImage?: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}

export interface ActiveColorState {
  wood: string;
  marble: string;
  wall: string;
  flooring: string;
}

export interface BedroomOption {
  id: string;
  section: 'bed' | 'headboard' | 'nightstand' | 'vanity' | 'wardrobe' | 'tvUnit' | 'curtains' | 'flooring' | 'ceiling' | 'lighting';
  name: string;
  image: string;
  description?: string;
  createdAt: number;
}

export interface BedroomSubmission {
  id: string;
  clientName: string;
  clientPhone: string;
  selections: {
    [key: string]: {
      optionId: string;
      name: string;
      image: string;
    };
  };
  status: RequestStatus;
  createdAt: number;
  requestNumber?: string;
  rejectionReason?: RejectionReason;
  rejectionNotes?: string;
  adminNotes?: string;
  viewed?: boolean;
  ticketId?: string;
  assignedEngineerId?: string | null;
  assignedEngineerName?: string | null;
  assignedAt?: number;
}

// ==========================================
// ROYAL GROUP PROJECT TICKET SYSTEM TYPES
// ==========================================

export interface Engineer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty?: string;
  specialization?: string; // Standardized field
  active: boolean;
  role: 'engineer';
  createdAt: number;
  currentTickets?: number;
  currentProjects?: number;
}

export type TicketStatus = 'open' | 'in_progress' | 'under_review' | 'closed';

export interface Ticket {
  id: string; // Automatically generated ticket ID (e.g. RG-TKT-1001)
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  title: string;
  subject?: string; // Compatible with legacy tickets which use subject instead of title
  description: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  assignedEngineerId?: string | null;
  assignedEngineerName?: string | null;
  assignedAt?: number;
  sourceId?: string;
  sourceType?: 'design_request' | 'bedroom_submission' | 'direct';
  requestId?: string;
  trackingId?: string;
  relatedRequestNumber?: string; // Compatible with legacy tickets linked to requests
  attachments?: string[];
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string; // 'admin' | 'client' | engineer email
  senderName: string;
  senderRole: 'admin' | 'client' | 'engineer';
  content: string;
  attachments?: { name: string; url: string; type: string }[];
  createdAt: number;
  read?: boolean;
}

export interface TicketNotification {
  id: string;
  ticketId: string;
  recipientId: string; // 'admin' | 'client' | engineer email
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

