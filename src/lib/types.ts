export type JobType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'intern' | 'entry' | 'mid' | 'senior' | 'lead';
export type ApplicationStatus =
  | 'saved'
  | 'interested'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected';

export type EmploymentType = 'permanent' | 'contract' | 'casual' | 'internship' | 'temp';

export type PostingAgeKind = 'fresh' | 'normal' | 'stale';

export type SalaryComparisonKind = 'below' | 'within' | 'above' | 'overlap';

export type TrackedSource = 'manual' | 'email' | 'rule';

export interface DescriptionSection {
  heading?: string;
  bullets: string[];
}

export interface SalaryComparison {
  kind: SalaryComparisonKind;
  deltaMinPct?: number;
  deltaMaxPct?: number;
  summary: string;
}

export interface PostingAge {
  days: number;
  kind: PostingAgeKind;
}

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
  marketSalaryMin?: number;
  marketSalaryMax?: number;
  marketSalaryCurrency?: string;
  marketSalarySource?: 'adzuna' | 'table' | string;
  techSkills?: string[];
  descriptionSections?: DescriptionSection[];
  salaryComparison?: SalaryComparison | null;
  postingAge?: PostingAge;
  employmentType?: EmploymentType;
  contractMonths?: number;
  contractDetail?: string;
}

export interface TrackedJob {
  jobId: string;
  status: ApplicationStatus;
  trackedAt: string; // ISO with "Z" suffix
  updatedAt: string;
  appliedAt: string | null;
  interviewAt: string | null;
  interviewLocation: string | null;
  lastEvidenceThreadId: string | null;
  isStale: boolean;
  daysSinceApplied: number | null;
  source: TrackedSource;
  job: Job;
}
