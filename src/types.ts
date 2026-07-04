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
}
