export interface Post {
  id: string;
  title: string;
  date: string;
  tags: string[];
  layout: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
