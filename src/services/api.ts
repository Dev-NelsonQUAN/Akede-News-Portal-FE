import axios from "axios";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://waitlistapi.akede.com.ng";

const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");

const api = axios.create({
  baseURL: `${cleanBaseUrl}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Post {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: "Neighbourhood" | "Safety" | "Alerts" | "Emergency";
  neighbourhood?: string;
  author?: string;
  excerpt: string;
  content: string;
  imageUrl?: string | null;
  imageAlt?: string;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getPosts = async (): Promise<Post[]> => {
  const response = await api.get("/news");
  
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  return Array.isArray(response.data) ? response.data : [];
};

export const createPost = async (postData: Post): Promise<Post> => {
  const response = await api.post("/news", postData);
  return response.data.data || response.data;
};

export const updatePost = async (
  id: string,
  postData: Partial<Post>
): Promise<Post> => {
  const response = await api.patch(`/news/${id}`, postData);
  return response.data.data || response.data;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/news/${id}`);
};

export default api;



// import axios from "axios";

// const rawBaseUrl =
//   import.meta.env.VITE_API_BASE_URL || "https://waitlistapi.akede.com.ng";

// const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");

// const api = axios.create({
//   baseURL: `${cleanBaseUrl}/api`,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export interface Post {
//   _id?: string;
//   id?: string;
//   title: string;
//   category: "Neighbourhood" | "Safety" | "Alerts" | "Emergency";
//   neighbourhood?: string;
//   author?: string;
//   excerpt: string;
//   content: string;
//   imageUrl?: string | null;
//   imageAlt?: string;
//   isPublished?: boolean;
//   publishedAt?: string;
//   createdAt?: string;
// }

// export const getPosts = async (): Promise<Post[]> => {
//   const response = await api.get("/news");
//   return response.data.data || response.data;
// };

// export const createPost = async (postData: Post): Promise<Post> => {
//   const response = await api.post("/news", postData);
//   return response.data.data || response.data;
// };

// export const updatePost = async (
//   id: string,
//   postData: Partial<Post>
// ): Promise<Post> => {
//   const response = await api.patch(`/news/${id}`, postData);
//   return response.data.data || response.data;
// };

// export const deletePost = async (id: string): Promise<void> => {
//   await api.delete(`/news/${id}`);
// };

// export default api;