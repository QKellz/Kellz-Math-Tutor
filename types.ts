
export enum AppState {
  SETUP,
  PROBLEM_SOLVER,
  PRACTICE,
}

export enum Difficulty {
  ELEMENTARY = "Elementary",
  MIDDLE_SCHOOL = "Middle School",
  HIGH_SCHOOL = "High School",
  COLLEGE = "College",
}

export enum Rigor {
  NOVICE = "Novice",
  INTERMEDIATE = "Intermediate",
  PRO = "Pro",
}

export enum Sender {
  USER = "user",
  AI = "ai",
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  actions?: Action[];
  userWorkRequest?: boolean;
  isCorrectAnswer?: boolean;
  image?: string;
}

export interface Action {
    label: string;
    value: string;
}

export interface QuizQuestion {
  question: string;
  // For simplicity, we'll assume multiple choice for generated quizzes
  options?: string[]; 
  answer: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: (string | null)[];
  isComplete: boolean;
}