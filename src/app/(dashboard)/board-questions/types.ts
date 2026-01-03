// app/board-questions/types.ts

// --- From API response ---
export interface ApiBoardQuestionDetail {
  id: number;
  board_id: number;
  board_name: string;
  question_id: number;
  year: string;
  question_text: string;
  answer?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  chapter_name?: string;
  is_draft?: boolean;
  is_published?: boolean;
}

export interface ApiQuestion {
  id: number;
  question: string;
  answer?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  subject_id?: number;
  chapter_id?: number;
  is_published?: boolean;
  is_draft?: boolean;
}

// --- Frontend representation ---
export interface BoardQuestionItem {
  id: number;
  board_id: number;
  question_id: number;
  year: string;
  board_name: string;
  question: string;
  answer?: string;
  question_options?: {
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    option5?: string;
  };
  is_draft: boolean;
  is_published: boolean;
  subject_id?: number;
  chapter_id?: number;
  subject_name?: string;
  chapter_name?: string;
  group_key?: string;
}

export interface GroupedQuestion {
  key: string;
  board_id: number;
  board_name: string;
  year: string;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  chapter_name?: string;
  question_ids: number[];
  questions: BoardQuestionItem[];
  count: number;
}

// --- Lookup data ---
export interface Board {
  id: number;
  name: string;
}
export interface Subject {
  id: number;
  name: string;
}
export interface Chapter {
  id: number;
  name: string;
  subject_id: number;
}
