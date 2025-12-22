export interface Topic {
  id: number;
  chapter_id: number;
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

export interface TopicFormData {
  chapter_id: number;
  name: string;
  title: string;
  short_des: string;
  is_draft: boolean;
  is_published: boolean;
  image?: File | null;
  serial_id: number;
}

export interface TopicWithHierarchy extends Topic {
  chapter_name?: string;
  chapter_title?: string;
  subject_name?: string;
  subject_title?: string;
  course_name?: string;
  program_name?: string;
}

export interface TopicsApiResponse {
  topics: TopicWithHierarchy[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
