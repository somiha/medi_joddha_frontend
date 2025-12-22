export interface BookReference {
  id: number;
  subject_id: number;
  name: string;
  image: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookReferenceFormData {
  subject_id: number;
  name: string;
  image?: File | null;
}

export interface BookReferenceWithHierarchy extends BookReference {
  subject_name?: string;
  subject_title?: string;
  course_name?: string;
  program_name?: string;
}

export interface BookReferencesApiResponse {
  book_refs: BookReferenceWithHierarchy[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
