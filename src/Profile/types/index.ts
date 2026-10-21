export interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface ProfileFormData {
  fullName: string;
}
