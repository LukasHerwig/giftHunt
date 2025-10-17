export interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface ProfileState {
  profile: ProfileData | null;
  loading: boolean;
  saving: boolean;
  fullName: string;
}

export interface ProfileActions {
  loadProfile: () => Promise<void>;
  handleSave: (e: React.FormEvent) => Promise<void>;
  setFullName: (name: string) => void;
}

export interface ProfileFormData {
  fullName: string;
}
