export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  streak: number;
  totalPoints: number;
  lastActive: string;
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  createdAt: any;
  subject: string;
}

export interface QuizResult {
  id: string;
  userId: string;
  subject: string;
  score: number;
  total: number;
  date?: string;
  timestamp?: any;
}

export interface StudyTask {
  id: string;
  userId: string;
  title: string;
  subject: string;
  time: string;
  completed: boolean;
  date: string;
}
