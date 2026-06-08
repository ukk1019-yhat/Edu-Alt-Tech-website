export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  email: string;
  image: string;
  linkedin?: string;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Unified User Types
export type GlobalUserRole = 'admin';

export interface UserObject {
  uid: string;
  name: string;
  email: string;
  role?: GlobalUserRole;
  profilePic?: string;
  createdAt: any;
  preferences?: string[]; // E.g., 'jee-mains', 'music'
  classYear?: string;
  location?: string;
}

// Course Types
export type CourseCategory = 'education' | 'alternative';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price?: number; // in INR, 0 = free
  thumbnailUrl?: string; // Optional thumbnail
  createdAt: any;
  createdBy: string; // admin or system
}


// Enrollment / Application Types
export type StudentStatus = 'waitlisted' | 'active' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'not-required';

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  role: 'student' | 'teacher';
  
  // Student specific
  studentStatus?: StudentStatus;
  paymentStatus?: PaymentStatus;
  mentorId?: string; // Teacher's UID
  
  // Timestamps
  createdAt: any;
  updatedAt?: any;
  completedModules?: string[]; // IDs of completed roadmap modules
}

export type TeacherAppStatus = 'pending' | 'approved_for_interview' | 'scheduled' | 'approved' | 'rejected';


export interface TeacherApplication {
  id: string; // Document ID
  userId: string;
  courseId: string;
  status: TeacherAppStatus;
  meetingLink?: string;
  meetingDate?: any;
  appliedAt: any;
  updatedAt?: any;
  
  // Mentor Profile Info
  userName?: string;
  userEmail?: string;
  experience?: string;
  skills?: string;
  message?: string;
  
  // Curriculum Path
  proposedPath?: string[];
}

export interface PathClass {
  id: string;              // unique ID for the class
  title: string;           // E.g., "Live Intro Session"
  meetingLink?: string;
  recordedLink?: string;
  createdAt?: any;
}

export interface ModuleLecture {
  id: string;
  title: string;
  meetingLink?: string;
  recordedLink?: string;
  createdAt?: any;
}

export interface CourseModule {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  order: number;
  lectures: ModuleLecture[]; // Lectures/Classes inside this module
  createdAt: any;
  thumbnailUrl?: string; // Optional thumbnail
}

export interface Lecture {
  id: string;
  courseId: string;
  moduleId: string; // Linked to a Module
  teacherId: string;
  title: string;
  description: string;
  order: number;
  classes: PathClass[];
  createdAt: any;
  meetingLink?: string;
  recordedLink?: string;
  thumbnailUrl?: string;
}


export interface CourseResource {
  id: string;
  courseId: string;
  moduleId?: string; // Optional: can be global or per module
  lectureId?: string; // Optional: If null, it's global for the course
  title: string;
  url: string;
  createdAt: any;
}


// System Updates
export interface PatchNote {
  id: string;
  version: string;
  title: string;
  content: string; // Markdown or rich text
  createdAt: any;
  createdBy: string; // Admin User ID
}

// LMS internal structs for when active
export interface Subject {
  id: string;
  courseId: string;
  title: string;
  createdAt: any;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  createdAt: any;
}

export interface ClassSession {
  id: string;
  chapterId: string;
  subjectId: string;
  courseId: string;
  title: string;
  date: any;
  meetLink: string;
  type: 'Live' | 'Recorded';
  teacherId: string; // Reference to the assigned mentor/teacher
  createdAt: any;
}

export interface Attendance {
  id: string; 
  classId: string;
  studentId: string;
  courseId: string;
  status: 'Present' | 'Absent';
  joinedAt: any;
}

export interface FlashCard {
  front: string;
  back: string;
}

export interface FlashcardSet {
  title: string;
  cards: FlashCard[];
}

// ========== QUIZ / TEST GENERATION ==========
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: Difficulty;
  topic?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  moduleId?: string;
  title: string;
  questions: QuizQuestion[];
  userAnswers: number[];
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: any;
  difficulty: Difficulty;
}

// ========== USER METRICS / ADAPTIVE LEARNING ==========
export type AdaptiveLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserMetrics {
  userId: string;
  courseId: string;
  avgScore: number;
  totalTimeSpent: number;
  completedModules: number;
  totalModules: number;
  quizAttempts: number;
  currentDifficulty: AdaptiveLevel;
  strengths: string[];
  weaknesses: string[];
  lastActivityAt: any;
  engagementScore: number;
  consistencyScore: number;
  predictedDropoutRisk: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

// ========== LEARNING PATH / PERSONALIZED ROADMAPS ==========
export interface LearningPathModule {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedHours: number;
  prerequisites?: string[];
  topics?: string[];
}

export interface LearningPath {
  id: string;
  userId: string;
  courseId: string;
  goal: string;
  modules: LearningPathModule[];
  createdAt: any;
  updatedAt: any;
  currentDifficulty: AdaptiveLevel;
}

// ========== ACTIVITY TRACKING / ANALYTICS ==========
export type ActivityType = 'page_view' | 'module_complete' | 'quiz_attempt' | 'login' | 'enrollment' | 'resource_access' | 'doubt_asked' | 'mentor_session';

export interface UserActivity {
  id: string;
  userId: string;
  courseId?: string;
  type: ActivityType;
  metadata?: Record<string, any>;
  timestamp: any;
}

// ========== DOUBT SOLVER ==========
export interface DoubtQuestion {
  id: string;
  userId: string;
  courseId: string;
  moduleId?: string;
  question: string;
  answer?: string;
  context?: string;
  status: 'pending' | 'answered';
  createdAt: any;
  answeredAt?: any;
}

// ========== AI MENTOR SESSION ==========
export interface MentorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: any;
}

export interface MentorSession {
  id: string;
  userId: string;
  courseId: string;
  messages: MentorMessage[];
  summary?: string;
  createdAt: any;
  updatedAt: any;
  progressContext?: {
    completedModules: string[];
    avgScore: number;
    currentDifficulty: AdaptiveLevel;
    strengths: string[];
    weaknesses: string[];
  };
}

// ========== BEHAVIOR INSIGHTS ==========
export interface BehaviorInsight {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avgSessionDuration: number;
  totalActiveDays: number;
  loginConsistency: number;
  moduleCompletionRate: number;
  quizAvgScore: number;
  peakActivityHours: number[];
  preferredDays: string[];
  engagementTrend: 'rising' | 'stable' | 'declining';
  dropoutProbability: number;
  lastActive: any;
  courseIds: string[];
  updatedAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: any;
  type?: 'course_deleted' | 'system';
}