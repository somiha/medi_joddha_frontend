// app/courses/types.ts - Add these interfaces
export interface Subject {
  id: number;
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: string | null;
  course_id?: number; // For subjects linked to courses
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseSubjectLink {
  id?: number;
  course_id: number;
  subject_id: number;
  course_name?: string; // For display
  subject_name?: string; // For display
}

export interface SubjectFormData {
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: File | null;
  course_id?: number;
}

export interface ApiResponse {
  subjects: Subject[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
