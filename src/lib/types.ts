export type JobType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'intern' | 'entry' | 'mid' | 'senior' | 'lead';
export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface UserProfile {
  fullName: string;
  email: string;
  dob: string; // YYYY-MM-DD
  resumeFileName?: string;
  resumeUploadedAt?: string;
  headline?: string;
  avatar?: string; // emoji fallback when no avatarImage
  avatarImage?: string; // data URL of an uploaded custom avatar
  connections?: {
    google?: boolean;
    linkedin?: boolean;
  };
}

export interface UserPreferences {
  jobTypes: JobType[];
  locations: string[];
  visaSponsorship: boolean;
  workAuthorization: 'citizen' | 'permanent' | 'visa-required' | 'student';
  experienceLevel: ExperienceLevel;
  desiredRoles: string[];
  keywords: string[];
  minSalary: number;
  maxSalary: number;
  willingToRelocate: boolean;
  remoteOnly: boolean;
  autoRefreshMinutes: number;
}

export interface RecruiterContact {
  name: string;
  title: string;
  linkedinUrl: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyEmoji: string;
  location: string;
  type: JobType;
  salaryMin: number;
  salaryMax: number;
  postedAt: string; // ISO date
  description: string;
  tags: string[];
  visaSponsorship: boolean;
  experience: ExperienceLevel;
  matchScore: number; // 0-100
  source: 'LinkedIn' | 'Indeed' | 'Wellfound' | 'Greenhouse' | 'Lever' | 'Direct';
  status?: ApplicationStatus;
  url?: string;
  recruiterSearchUrl?: string;
  recruiterContacts?: RecruiterContact[];
  outreachMessage?: string;
}
