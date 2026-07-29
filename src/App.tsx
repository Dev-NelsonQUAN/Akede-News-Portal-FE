import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Send,
  Trash2,
  Edit3,
  Loader2,
  X,
  FileText,
  // Image as ImageIcon,
} from "lucide-react";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from "./services/api";

import type { Post } from "./services/api";

const CATEGORIES = ["Community", "Safety", "Alerts", "Emergency"] as const;

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Post["category"]>("Community");
  const [neighborhood, setNeighborhood] = useState("");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  // const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPostsList();
  }, []);

const fetchPostsList = async () => {
  setLoadingPosts(true);
  try {
    const responseData: any = await getPosts();

    const postsArray = Array.isArray(responseData)
      ? responseData
      : responseData?.posts || responseData?.data || [];

    setPosts(postsArray);
  } catch (err: any) {
    console.error("Failed to load posts", err);
    Swal.fire({
      icon: "error",
      title: "Error Loading Posts",
      text: err.response?.data?.message || "Failed to fetch posts feed.",
      confirmButtonColor: "#10b981",
    });
    setPosts([]);
  } finally {
    setLoadingPosts(false);
  }
};

  const handleEditClick = (post: Post) => {
    const targetId = post._id || post.id || "";
    setEditingId(targetId);
    setTitle(post.title);
    setCategory(post.category);
    setNeighborhood(post.neighborhood || "");
    setAuthor(post.author || "Akede Product");
    setExcerpt(post.excerpt);
    setContent(post.content);
    // setImageUrl(post.imageUrl || "");
    setIsPublished(post.isPublished ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Community");
    setNeighborhood("");
    setAuthor("");
    setExcerpt("");
    setContent("");
    // setImageUrl("");
    setIsPublished(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await deletePost(id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Post has been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchPostsList();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err.response?.data?.message || "Failed to delete post.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !excerpt || !content) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Title, Excerpt, and Content are required.",
      });
      return;
    }

    setSubmitting(true);

    const payload: Post = {
      title,
      category,
      neighborhood: neighborhood || "General",
      author: author || "Akede Product",
      excerpt,
      content,
      // imageUrl: imageUrl.trim() || null,
      imageAlt: title,
      isPublished,
    };

    try {
      if (editingId) {
        await updatePost(editingId, payload);
        Swal.fire({
          icon: "success",
          title: "Post Updated!",
          text: "Your neighborhood post was updated successfully.",
          timer: 2500,
          showConfirmButton: false,
        });
      } else {
        await createPost(payload);
        Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Post successfully published to the neighborhood feed!",
          timer: 2500,
          showConfirmButton: false,
        });
      }
      resetForm();
      fetchPostsList();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text:
          err.response?.data?.message ||
          "Action failed. Please check your API endpoint or backend status.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-akede-bg flex flex-col">
      <header className="bg-akede-green text-white py-4 px-8 shadow-md flex justify-center items-center border-b-4 border-akede-orange">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-black tracking-wider">AKEDE</span>
          <span className="bg-akede-lightGreen text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
            News Portal
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-akede-accentGreen p-6 border-b border-green-100 flex justify-between items-center">
            <div className="flex items-center flex-col w-full">
              <h1 className="text-[45px] font-extrabold text-green-600 text-center">
                {editingId ? "Edit Neighborhood Post" : "Publish Neighborhood Story"}
              </h1>
              <p className="text-sm text-gray-600 mt-1 text-center">
                Create announcements, safety tips, and neighborhood updates.
              </p>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="shrink-0 flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-3">
                Post Category <span className="text-red-600"> * </span>
              </label>
              <div className="flex flex-wrap gap-2 justify-center">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
                      category === cat
                        ? "bg-akede-green text-white border-akede-green"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. How Magodo Phase 2 cut response time"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                  Target Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 1"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                Author
              </label>
              <input
                type="text"
                placeholder="e.g. Akede Product"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
              />
            </div>

            {/* <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
              />
            </div> */}

            {/* {imageUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )} */}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                Excerpt (Card Summary) *
              </label>
              <input
                type="text"
                placeholder="Brief 1-2 sentence preview for the card layout..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                Full Content *
              </label>
              <textarea
                rows={5}
                placeholder="Detailed story content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm resize-none"
                required
              />
            </div>

            <div className="flex items-center space-x-3 py-1">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-akede-green focus:ring-akede-green cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-xs font-bold uppercase tracking-wider text-gray-700 cursor-pointer">
                Publish immediately to neighborhood feed
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-akede-green hover:bg-akede-lightGreen text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-akede-orange" />
                  <span>Update Post</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-akede-orange" />
                  <span>Publish to Neighborhood</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-akede-orange" />
            <span>Published Posts ({posts.length})</span>
          </h2>

          {loadingPosts ? (
            <div className="py-12 flex justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No posts found. Publish your first update above!
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const postId = post._id || post.id || "";
                return (
                  <div
                    key={postId}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 transition"
                  >
                    <div className="flex items-start space-x-4">
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0 hidden sm:block"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-akede-accentGreen text-akede-green text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {post.neighborhood}
                          </span>
                          {!post.isPublished && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">{post.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(post)}
                        className="p-2 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition cursor-pointer"
                        title="Edit Post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(postId)}
                        className="p-2 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
