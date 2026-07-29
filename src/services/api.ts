import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL   ;

const api = axios.create({
  baseURL: API_BASE_URL,
});


export interface Post {
  _id?: string;
  id?: string;
  title: string;
  category: "Community" | "Safety" | "Alerts" | "Emergency";
  neighborhood?: string;
  author?: string;
  excerpt: string;
  content: string;
  imageUrl?: string | null;
  imageAlt?: string;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export const getPosts = async (): Promise<Post[]> => {
  const response = await api.get("/news");
  return response.data.data || response.data;
};

export const createPost = async (postData: Post): Promise<Post> => {
  const response = await api.post("/news", postData);
  return response.data.data || response.data;
};

export const updatePost = async (id: string, postData: Partial<Post>): Promise<Post> => {
  const response = await api.patch(`/news/${id}`, postData);
  return response.data.data || response.data;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/news/${id}`);
};

export default api;