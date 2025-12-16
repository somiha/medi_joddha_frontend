// app/courses/types.ts - Add these interfaces
export interface Chapter {
  id: number;
  subject_id: number;
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: string | null;
  serial_id: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterFormData {
  subject_id: number;
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: File | null;
  serial_id: number;
}

export interface ChapterWithSubject extends Chapter {
  subject_name?: string;
  subject_title?: string;
  course_name?: string;
  program_name?: string;
}

export interface ApiResponse {
  chapters: ChapterWithSubject[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
