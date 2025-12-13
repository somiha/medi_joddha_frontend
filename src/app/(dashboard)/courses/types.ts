export interface CourseItem {
  id: number;
  program_id: number;
  name: string;
  title: string;
  short_des?: string | null;
  image?: string | null;
  is_draft: boolean;
  is_published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramOption {
  id: number;
  name: string;
  title: string;
}

export interface ApiResponse {
  courses: CourseItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
