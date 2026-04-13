export type UserRole = 'responder' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type EmergencyStatus = 'active' | 'attended' | 'cancelled' | 'expired';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ResponderProfile {
  id: string;
  user_id: string;
  credential_type: string;
  credential_name: string;
  issuing_entity: string;
  issue_date: string;
  expiry_date?: string;
  credential_image_url: string;
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  is_available: boolean;
  last_location_lat?: number;
  last_location_lng?: number;
  last_location_updated?: string;
  push_token?: string;
}

export interface Emergency {
  id: string;
  triggered_by_user_id?: string;
  triggered_by_name?: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  status: EmergencyStatus;
  notes?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}
