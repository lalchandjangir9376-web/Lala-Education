export type Language = 'hi' | 'en';
export type ClassGrade = '9' | '10' | '11' | '12';
export type BoardType = 'RBSE' | 'CBSE';
export type Role = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: Role;
  classGrade: ClassGrade;
  board: BoardType;
  preferredLanguage: Language;
  coins: number;
  welcomeBonusGiven: boolean;
  unlockedMaterials: string[];
  unlockedTests: string[];
  completedVideos: string[];
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'welcome_bonus' | 'video_reward' | 'test_unlock' | 'pdf_unlock' | 'admin_adjustment';
  description: string;
  timestamp: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  classGrade: ClassGrade;
  subject: string;
  subjectHi: string;
  chapter: string;
  language: 'hi' | 'en' | 'bilingual';
  coinPrice: number;
  fileUrl: string;
  pageCount: number;
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'published';
  bodyContent?: string;
  fileType?: 'pdf' | 'rich_notes';
  contentSummary?: string;
  contentSummaryHi?: string;
  isUnlocked?: boolean;
}

export interface EducationalVideo {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  classGrade: ClassGrade;
  subject: string;
  subjectHi: string;
  chapter?: string;
  videoUrl: string;
  sourceType?: 'youtube' | 'direct_upload';
  videoFileName?: string;
  fileSizeMb?: number;
  thumbnailUrl: string;
  duration: string;
  coinReward: number;
  createdAt: string;
  status?: 'draft' | 'published';
  isCompleted?: boolean;
}

export interface TestQuestion {
  id: string;
  question: string;
  questionHi: string;
  options: string[];
  optionsHi: string[];
  correctAnswer?: number;
  explanation?: string;
  explanationHi?: string;
  marks: number;
}

export interface OnlineTestItem {
  id: string;
  title: string;
  titleHi: string;
  classGrade: ClassGrade;
  subject: string;
  subjectHi: string;
  durationMinutes: number;
  totalMarks: number;
  coinPrice: number;
  questionCount: number;
  isUnlocked: boolean;
  pastAttempt?: {
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: string;
  } | null;
}

export interface ActiveTest {
  id: string;
  title: string;
  titleHi: string;
  durationMinutes: number;
  totalMarks: number;
  questions: TestQuestion[];
}

export interface EvaluatedQuestion extends TestQuestion {
  selectedAnswer?: number;
  correctAnswer: number;
  isCorrect: boolean;
  marksObtained: number;
}

export interface TestEvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  questions: EvaluatedQuestion[];
  submittedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  titleHi: string;
  content: string;
  contentHi: string;
  category: 'exam' | 'notice' | 'scholarship' | 'materials';
  date: string;
  isImportant?: boolean;
}

export interface AdminStats {
  totalStudents: number;
  totalMaterials: number;
  totalVideos: number;
  totalTests: number;
  totalCoinsInCirculation: number;
  totalTestAttempts: number;
  recentUsers: User[];
}

export interface AiNotesRequest {
  topic: string;
  classGrade: ClassGrade;
  subject: string;
  chapter?: string;
  language: Language | 'bilingual';
  format: 'comprehensive' | 'summary' | 'qa' | 'mcq';
}

export interface AiNotesResponse {
  title: string;
  titleHi: string;
  chapter: string;
  contentSummary: string;
  contentSummaryHi: string;
  bodyContent: string;
}
