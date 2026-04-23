export interface BookResponseDto {
  id: number;
  title: string;
  numberOfPages: number;
  publishedDate: string;
  gender: string;
  authorId: number;
  authorName?: string | null;
  coverUrl?: string | null;
}

export interface BookListQuery {
  pageNumber: number;
  pageSize: number;
  authorId?: number | null;
  searchTerm?: string | null;
}

