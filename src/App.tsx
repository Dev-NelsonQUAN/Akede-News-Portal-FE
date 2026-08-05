import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Send,
  Trash2,
  Edit3,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from "./services/api";

import type { Post } from "./services/api";

const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "";

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchPostsList();
  }, []);

  const fetchPostsList = async () => {
    setLoadingPosts(true);
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err: any) {
      console.error("Failed to load posts", err);
      Swal.fire({
        icon: "error",
        title: "Error Loading Posts",
        text: err.response?.data?.message || "Failed to fetch posts feed.",
        confirmButtonColor: "#10b981",
      });
    } finally {
      setLoadingPosts(false);
    }
  };

  const processSelectedFile = (file?: File) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    processSelectedFile(file);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to upload image. Please check network connection.");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleEditClick = (post: Post) => {
    const targetId = post._id || post.id || "";
    setEditingId(targetId);
    setTitle(post.title);
    setCategory(post.category);
    setNeighbourhood(post.neighbourhood || "");
    setAuthor(post.author || "Akede Team");
    setExcerpt(post.excerpt);
    setContent(post.content);
    setImageUrl(post.imageUrl || "");
    setImagePreview(post.imageUrl || "");
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Neighbourhood");
    setNeighbourhood("");
    setAuthor("");
    setExcerpt("");
    setContent("");
    setImageUrl("");
    setImagePreview("");
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Delete this story from feed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      await deletePost(id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Post deleted successfully.",
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
        title: "Missing Information",
        text: "Please fill in the title, excerpt summary, and story content.",
      });
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setUploadingImage(false);
      }

      const payload: Post = {
        title,
        category,
        neighbourhood: neighbourhood || "General",
        author: author || "Akede Team",
        excerpt,
        content,
        imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
        imageAlt: title,
        isPublished: true,
      };

      if (editingId) {
        await updatePost(editingId, payload);
        Swal.fire({
          icon: "success",
          title: "Post Updated!",
          text: "Story updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createPost(payload);
        Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Story published to the local feed!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      resetForm();
      fetchPostsList();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Publish Failed",
        text:
          err.response?.data?.message ||
          err.message ||
          "Could not save post. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-akede-bg flex flex-col font-sans">
      <header className="bg-akede-green text-white py-3 px-4 sm:px-8 shadow-md border-b-4 border-akede-orange sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="flex items-center space-x-3">
            <div className="w-30 h-10 flex items-center justify-center">
              <img src="/LogoMarkWhite.png" alt="Akede Logo" className="w-full h-8 object-fill" />
            </div>
            <span className="bg-akede-lightGreen text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
              News Portal
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-akede-accentGreen p-4 sm:p-6 border-b border-green-100 flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-akede-green">
                  {editingId ? "Edit Story" : "Publish Story"}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Post updates directly to the neighbourhood app
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border active:scale-95 cursor-pointer ${
                        category === cat
                          ? "bg-akede-green text-white border-akede-green shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                    Story Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Security Gate Installed"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                    Neighbourhood
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ikeja, Lekki Phase 1"
                    value={neighbourhood}
                    onChange={(e) => setNeighbourhood(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green">
                    Cover Photo
                  </label>
                  {imagePreview && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Photo Attached
                    </span>
                  )}
                </div>

                {imagePreview ? (
                  <div className="relative w-full h-52 bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
                    <img
                      src={imagePreview}
                      alt="Story cover"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 bg-white/90 hover:bg-white text-gray-900 px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-lg backdrop-blur-sm transition active:scale-95">
                          <RefreshCw className="w-3.5 h-3.5 text-akede-green" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                          setImageUrl("");
                        }}
                        className="flex items-center space-x-1.5 bg-rose-600/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg backdrop-blur-sm transition active:scale-95 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setImageUrl("");
                      }}
                      className="sm:hidden absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-md cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center w-full py-7 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 group ${
                      isDragging
                        ? "border-akede-green bg-emerald-50/60 scale-[1.01]"
                        : "border-gray-300 hover:border-akede-green bg-gray-50/50 hover:bg-emerald-50/30"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-akede-green flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-akede-green group-hover:text-white transition-all duration-300 shadow-sm">
                      <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-sm font-extrabold text-gray-800 group-hover:text-akede-green transition-colors">
                        Click to upload <span className="font-normal text-gray-500">or drag & drop</span>
                      </p>
                      <p className="text-[11px] font-medium text-gray-400">
                        PNG, JPG, WEBP or GIF (Recommended: 1200x630px)
                      </p>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                  Author
                </label>
                <input
                  type="text"
                  placeholder="e.g. Akede Team"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                  Card Preview Text *
                </label>
                <input
                  type="text"
                  placeholder="Short 1-sentence summary..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                  Full Story *
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the full update here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer "
              >
                {submitting || uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {uploadingImage ? "Uploading Photo..." : "Saving Story..."}
                    </span>
                  </>
                ) : editingId ? (
                  <>
                    <Edit3 className="w-4 h-4 text-akede-orange" />
                    <span>Update Story</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-akede-orange" />
                    <span>Publish Story</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-akede-green">
                  Live Card Preview
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">
                  Updates in real-time
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 space-y-1">
                    <ImageIcon className="w-7 h-7 stroke-1" />
                    <span className="text-[11px] font-medium">No cover image added</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium truncate">
                      {neighbourhood || "General"}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                    {title || "Story Title Preview..."}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {excerpt || "Your card summary snippet will appear right here as you type into the form."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-akede-orange" />
                <span>Published Stories ({posts.length})</span>
              </h2>

              {loadingPosts ? (
                <div className="py-8 flex justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500 text-center py-6">
                  No stories published yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-112.5 overflow-y-auto pr-1">
                  {posts.map((post) => {
                    const postId = post._id || post.id || "";
                    return (
                      <div
                        key={postId}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 hover:border-gray-200 transition"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {post.imageUrl && (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="bg-akede-accentGreen text-akede-green text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mb-1">
                              {post.category}
                            </span>
                            <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                              {post.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleEditClick(post)}
                            className="p-1.5 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(postId)}
                            className="p-1.5 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}


// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import {
//   Send,
//   Trash2,
//   Edit3,
//   Loader2,
//   X,
//   FileText,
//   Image as ImageIcon,
//   Plus,
//   UploadCloud,
// } from "lucide-react";
// import {
//   getPosts,
//   createPost,
//   updatePost,
//   deletePost,
// } from "./services/api";

// import type { Post } from "./services/api";

// const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// // Vite Environment Variables
// const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
// const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "akede_preset";

// export default function App() {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [loadingPosts, setLoadingPosts] = useState(true);

//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [title, setTitle] = useState("");
//   const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
//   const [neighbourhood, setNeighbourhood] = useState("");
//   const [author, setAuthor] = useState("");
//   const [excerpt, setExcerpt] = useState("");
//   const [content, setContent] = useState("");
//   const [imageUrl, setImageUrl] = useState("");

//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string>("");
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     fetchPostsList();
//   }, []);

//   const fetchPostsList = async () => {
//     setLoadingPosts(true);
//     try {
//       const data = await getPosts();
//       setPosts(data);
//     } catch (err: any) {
//       console.error("Failed to load posts", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error Loading Posts",
//         text: err.response?.data?.message || "Failed to fetch posts feed.",
//         confirmButtonColor: "#10b981",
//       });
//     } finally {
//       setLoadingPosts(false);
//     }
//   };

//   const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   const uploadToCloudinary = async (file: File): Promise<string> => {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

//     const res = await fetch(
//       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     if (!res.ok) {
//       throw new Error("Failed to upload image. Please check network connection.");
//     }

//     const data = await res.json();
//     return data.secure_url;
//   };

//   const handleEditClick = (post: Post) => {
//     const targetId = post._id || post.id || "";
//     setEditingId(targetId);
//     setTitle(post.title);
//     setCategory(post.category);
//     setNeighbourhood(post.neighbourhood || "");
//     setAuthor(post.author || "Akede Team");
//     setExcerpt(post.excerpt);
//     setContent(post.content);
//     setImageUrl(post.imageUrl || "");
//     setImagePreview(post.imageUrl || "");
//     setImageFile(null);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setTitle("");
//     setCategory("Neighbourhood");
//     setNeighbourhood("");
//     setAuthor("");
//     setExcerpt("");
//     setContent("");
//     setImageUrl("");
//     setImagePreview("");
//     setImageFile(null);
//   };

//   const handleDelete = async (id: string) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "Delete this story from feed?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#ef4444",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, delete",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       await deletePost(id);
//       Swal.fire({
//         icon: "success",
//         title: "Deleted!",
//         text: "Post deleted successfully.",
//         timer: 2000,
//         showConfirmButton: false,
//       });
//       fetchPostsList();
//     } catch (err: any) {
//       Swal.fire({
//         icon: "error",
//         title: "Delete Failed",
//         text: err.response?.data?.message || "Failed to delete post.",
//       });
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title || !excerpt || !content) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: "Please fill in the title, excerpt summary, and story content.",
//       });
//       return;
//     }

//     setSubmitting(true);

//     try {
//       let finalImageUrl = imageUrl;

//       if (imageFile) {
//         setUploadingImage(true);
//         finalImageUrl = await uploadToCloudinary(imageFile);
//         setUploadingImage(false);
//       }

//       const payload: Post = {
//         title,
//         category,
//         neighbourhood: neighbourhood || "General",
//         author: author || "Akede Team",
//         excerpt,
//         content,
//         imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
//         imageAlt: title,
//         isPublished: true,
//       };

//       if (editingId) {
//         await updatePost(editingId, payload);
//         Swal.fire({
//           icon: "success",
//           title: "Post Updated!",
//           text: "Story updated successfully.",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       } else {
//         await createPost(payload);
//         Swal.fire({
//           icon: "success",
//           title: "Published!",
//           text: "Story published to the local feed!",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }
//       resetForm();
//       fetchPostsList();
//     } catch (err: any) {
//       Swal.fire({
//         icon: "error",
//         title: "Publish Failed",
//         text:
//           err.response?.data?.message ||
//           err.message ||
//           "Could not save post. Please check your connection.",
//       });
//     } finally {
//       setSubmitting(false);
//       setUploadingImage(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-akede-bg flex flex-col font-sans">
//       <header className="bg-akede-green text-white py-3 px-4 sm:px-8 shadow-md border-b-4 border-akede-orange sticky top-0 z-30">
//         <div className="max-w-7xl mx-auto flex justify-center items-center">
//           <div className="flex items-center space-x-3">
//             <div className="w-30 h-10 flex items-center justify-center">
//               <img src="/LogoMarkWhite.png" alt="Akede Logo" className="w-full h-8 object-fill" />
//             </div>
//             <span className="bg-akede-lightGreen text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
//               News Portal
//             </span>
//           </div>
//         </div>
//       </header>

//       <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

//           <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//             <div className="bg-akede-accentGreen p-4 sm:p-6 border-b border-green-100 flex justify-between items-center">
//               <div className="flex flex-col">
//                 <h1 className="text-xl sm:text-2xl font-black text-akede-green">
//                   {editingId ? "Edit Story" : "Publish Story"}
//                 </h1>
//                 <p className="text-xs text-gray-600 mt-0.5">
//                   Post updates directly to the neighbourhood app
//                 </p>
//               </div>
//               {editingId && (
//                 <button
//                   type="button"
//                   onClick={resetForm}
//                   className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200"
//                 >
//                   <X className="w-4 h-4" />
//                   <span>Cancel</span>
//                 </button>
//               )}
//             </div>

//             <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
//                   Category *
//                 </label>
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
//                   {CATEGORIES.map((cat) => (
//                     <button
//                       key={cat}
//                       type="button"
//                       onClick={() => setCategory(cat)}
//                       className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border active:scale-95 ${
//                         category === cat
//                           ? "bg-akede-green text-white border-akede-green shadow-sm"
//                           : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
//                       }`}
//                     >
//                       {cat}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                     Story Title *
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g. New Security Gate Installed"
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                     Neighbourhood
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g. Ikeja, Lekki Phase 1"
//                     value={neighbourhood}
//                     onChange={(e) => setNeighbourhood(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                   />
//                 </div>
//               </div>

//               {/* Cover Photo Upload & Change Section */}
//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Cover Photo
//                 </label>

//                 {imagePreview ? (
//                   <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
//                     <img
//                       src={imagePreview}
//                       alt="Story cover"
//                       className="w-full h-full object-cover"
//                     />
                    
//                     {/* Overlay Action Buttons */}
//                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
//                       <label className="flex items-center space-x-1.5 bg-white text-gray-800 hover:text-akede-green px-3 py-2 rounded-lg font-bold text-xs cursor-pointer shadow-md transition active:scale-95">
//                         <UploadCloud className="w-4 h-4 text-akede-orange" />
//                         <span>Change Photo</span>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleImageFileChange}
//                           className="hidden"
//                         />
//                       </label>

//                       <button
//                         type="button"
//                         onClick={() => {
//                           setImageFile(null);
//                           setImagePreview("");
//                           setImageUrl("");
//                         }}
//                         className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg font-bold text-xs shadow-md transition active:scale-95"
//                       >
//                         <X className="w-4 h-4" />
//                         <span>Remove</span>
//                       </button>
//                     </div>

//                     {/* Simple Quick Remove Badge */}
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setImageFile(null);
//                         setImagePreview("");
//                         setImageUrl("");
//                       }}
//                       className="sm:hidden absolute top-3 right-3 bg-black/70 text-white p-1.5 rounded-full"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 ) : (
//                   <label className="flex items-center justify-center space-x-2 w-full py-4 px-4 border-2 border-dashed border-gray-300 hover:border-akede-green bg-gray-50 rounded-xl cursor-pointer transition active:bg-gray-100">
//                     <Plus className="w-5 h-5 text-akede-green" />
//                     <span className="text-sm font-bold text-gray-700">Add Image</span>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageFileChange}
//                       className="hidden"
//                     />
//                   </label>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Author
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Akede Team"
//                   value={author}
//                   onChange={(e) => setAuthor(e.target.value)}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Card Preview Text *
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Short 1-sentence summary..."
//                   value={excerpt}
//                   onChange={(e) => setExcerpt(e.target.value)}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Full Story *
//                 </label>
//                 <textarea
//                   rows={4}
//                   placeholder="Write the full update here..."
//                   value={content}
//                   onChange={(e) => setContent(e.target.value)}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm resize-none"
//                   required
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={submitting || uploadingImage}
//                 className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50"
//               >
//                 {submitting || uploadingImage ? (
//                   <>
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                     <span>
//                       {uploadingImage ? "Uploading Photo..." : "Saving Story..."}
//                     </span>
//                   </>
//                 ) : editingId ? (
//                   <>
//                     <Edit3 className="w-4 h-4 text-akede-orange" />
//                     <span>Update Story</span>
//                   </>
//                 ) : (
//                   <>
//                     <Send className="w-4 h-4 text-akede-orange" />
//                     <span>Publish Story</span>
//                   </>
//                 )}
//               </button>
//             </form>
//           </div>

//           <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">

//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-xs font-bold uppercase tracking-wider text-akede-green">
//                   Live Card Preview
//                 </span>
//                 <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">
//                   Updates in real-time
//                 </span>
//               </div>

//               <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
//                 {imagePreview ? (
//                   <img
//                     src={imagePreview}
//                     alt="Preview"
//                     className="w-full h-44 object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 space-y-1">
//                     <ImageIcon className="w-7 h-7 stroke-1" />
//                     <span className="text-[11px] font-medium">No cover image added</span>
//                   </div>
//                 )}
//                 <div className="p-4 space-y-2">
//                   <div className="flex items-center space-x-2">
//                     <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
//                       {category}
//                     </span>
//                     <span className="text-xs text-gray-400 font-medium truncate">
//                       {neighbourhood || "General"}
//                     </span>
//                   </div>
//                   <h3 className="font-extrabold text-gray-900 text-base leading-snug">
//                     {title || "Story Title Preview..."}
//                   </h3>
//                   <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
//                     {excerpt || "Your card summary snippet will appear right here as you type into the form."}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
//               <h2 className="text-base sm:text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
//                 <FileText className="w-5 h-5 text-akede-orange" />
//                 <span>Published Stories ({posts.length})</span>
//               </h2>

//               {loadingPosts ? (
//                 <div className="py-8 flex justify-center text-gray-400">
//                   <Loader2 className="w-6 h-6 animate-spin" />
//                 </div>
//               ) : posts.length === 0 ? (
//                 <p className="text-xs sm:text-sm text-gray-500 text-center py-6">
//                   No stories published yet.
//                 </p>
//               ) : (
//                 <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
//                   {posts.map((post) => {
//                     const postId = post._id || post.id || "";
//                     return (
//                       <div
//                         key={postId}
//                         className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 hover:border-gray-200 transition"
//                       >
//                         <div className="flex items-center space-x-3 min-w-0">
//                           {post.imageUrl && (
//                             <img
//                               src={post.imageUrl}
//                               alt={post.title}
//                               className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
//                             />
//                           )}
//                           <div className="min-w-0">
//                             <span className="bg-akede-accentGreen text-akede-green text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mb-1">
//                               {post.category}
//                             </span>
//                             <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
//                               {post.title}
//                             </h3>
//                           </div>
//                         </div>

//                         <div className="flex items-center space-x-1 shrink-0">
//                           <button
//                             onClick={() => handleEditClick(post)}
//                             className="p-1.5 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition"
//                             title="Edit"
//                           >
//                             <Edit3 className="w-3.5 h-3.5" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(postId)}
//                             className="p-1.5 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition"
//                             title="Delete"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" />
//                           </button>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//           </div>

//         </div>
//       </main>
//     </div>
//   );
// }


// // import React, { useState, useRef, useEffect } from "react";
// // import {
// //   UploadCloud,
// //   X,
// //   Loader2,
// //   Image as ImageIcon,
// //   CheckCircle2,
// //   Trash2,
// //   Edit2,
// //   PlusCircle,
// //   Newspaper,
// //   Calendar,
// //   User,
// //   MapPin,
// // } from "lucide-react";

// // export interface NewsPost {
// //   _id?: string;
// //   category: string;
// //   date?: string;
// //   publishedAt?: string;
// //   readTime?: string;
// //   title: string;
// //   author?: string;
// //   neighbourhood?: string;
// //   excerpt: string;
// //   content: string;
// //   slug: string;
// //   imageUrl?: string | null;
// //   imageAlt?: string;
// // }

// // const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"];

// // export default function App() {
// //   const [posts, setPosts] = useState<NewsPost[]>([]);
// //   const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
// //   const [editingId, setEditingId] = useState<string | null>(null);

// //   // Form State
// //   const [formData, setFormData] = useState({
// //     title: "",
// //     neighbourhood: "",
// //     category: "Neighbourhood",
// //     author: "Akede Team",
// //     excerpt: "",
// //     content: "",
// //     imageUrl: "",
// //     imageAlt: "",
// //   });

// //   const [uploading, setUploading] = useState<boolean>(false);
// //   const [uploadError, setUploadError] = useState<string | null>(null);
// //   const [submitting, setSubmitting] = useState<boolean>(false);
// //   const fileInputRef = useRef<HTMLInputElement>(null);

// //   const rawApiUrl =
// //     import.meta.env.VITE_API_URL || "https://waitlistapi.akede.com.ng";
// //   const baseUrl = rawApiUrl
// //     .trim()
// //     .replace(/\/+$/, "")
// //     .replace(/\/api$/, "");

// //   // Fetch Existing Posts
// //   const fetchPosts = async () => {
// //     setLoadingPosts(true);
// //     try {
// //       const res = await fetch(`${baseUrl}/api/news`);
// //       const json = await res.json();
// //       if (res.ok) {
// //         setPosts(json.data || []);
// //       }
// //     } catch (err) {
// //       console.error("Failed to fetch posts:", err);
// //     } finally {
// //       setLoadingPosts(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchPosts();
// //   }, []);

// //   // Handle Cloudinary Upload
// //   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;

// //     setUploadError(null);
// //     setUploading(true);

// //     const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
// //     const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

// //     if (!cloudName || !uploadPreset) {
// //       setUploadError("Cloudinary environment variables missing in .env.");
// //       setUploading(false);
// //       return;
// //     }

// //     const data = new FormData();
// //     data.append("file", file);
// //     data.append("upload_preset", uploadPreset);

// //     try {
// //       const res = await fetch(
// //         `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
// //         { method: "POST", body: data },
// //       );
// //       const json = await res.json();

// //       if (res.ok && json.secure_url) {
// //         setFormData((prev) => ({
// //           ...prev,
// //           imageUrl: json.secure_url,
// //           imageAlt: prev.imageAlt || prev.title || file.name,
// //         }));
// //       } else {
// //         throw new Error(json.error?.message || "Upload failed");
// //       }
// //     } catch (err: any) {
// //       setUploadError(err.message || "Error uploading image to Cloudinary");
// //     } finally {
// //       setUploading(false);
// //     }
// //   };

// //   const handleRemoveImage = () => {
// //     setFormData((prev) => ({ ...prev, imageUrl: "" }));
// //     if (fileInputRef.current) fileInputRef.current.value = "";
// //   };

// //   // Populate form for Editing
// //   const handleStartEdit = (post: NewsPost) => {
// //     setEditingId(post._id || null);
// //     setFormData({
// //       title: post.title || "",
// //       neighbourhood: post.neighbourhood || "",
// //       category: post.category || "Neighbourhood",
// //       author: post.author || "Akede Team",
// //       excerpt: post.excerpt || "",
// //       content: post.content || "",
// //       imageUrl: post.imageUrl || "",
// //       imageAlt: post.imageAlt || "",
// //     });
// //     window.scrollTo({ top: 0, behavior: "smooth" });
// //   };

// //   const handleResetForm = () => {
// //     setEditingId(null);
// //     setFormData({
// //       title: "",
// //       neighbourhood: "",
// //       category: "Neighbourhood",
// //       author: "Akede Team",
// //       excerpt: "",
// //       content: "",
// //       imageUrl: "",
// //       imageAlt: "",
// //     });
// //     if (fileInputRef.current) fileInputRef.current.value = "";
// //   };

// //   // Submit Post (Create / Update)
// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setSubmitting(true);

// //     const endpoint = editingId
// //       ? `${baseUrl}/api/news/${editingId}`
// //       : `${baseUrl}/api/news`;
// //     const method = editingId ? "PUT" : "POST";

// //     try {
// //       const res = await fetch(endpoint, {
// //         method,
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(formData),
// //       });

// //       if (res.ok) {
// //         handleResetForm();
// //         fetchPosts();
// //       } else {
// //         const json = await res.json();
// //         alert(json.message || "Failed to save post");
// //       }
// //     } catch (err) {
// //       alert("Error submitting post");
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   // Delete Post
// //   const handleDelete = async (id?: string) => {
// //     if (!id || !confirm("Are you sure you want to delete this story?")) return;

// //     try {
// //       const res = await fetch(`${baseUrl}/api/news/${id}`, {
// //         method: "DELETE",
// //       });
// //       if (res.ok) {
// //         fetchPosts();
// //       }
// //     } catch (err) {
// //       alert("Error deleting story");
// //     }
// //   };

// //   return (
// //     <div className="bg-[#FAFDFB] min-h-screen w-full text-left pb-24 font-sans text-gray-800">
// //       <div className="max-w-7xl mx-auto">
// //         <header className="bg-akede-green text-white py-3 px-4 sm:px-8 shadow-md border-b-4 border-akede-orange sticky top-0 z-30">
// //           <div className="max-w-7xl mx-auto flex justify-center items-center">
// //             <div className="flex items-center space-x-3">
// //               <div className="w-30 h-10 flex items-center justify-center">
// //                 <img
// //                   src="/LogoMarkWhite.png"
// //                   alt="Akede Logo"
// //                   className="w-full h-8 object-fill"
// //                 />
// //               </div>
// //               <span className="bg-akede-lightGreen text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
// //                 News Portal
// //               </span>
// //             </div>
// //           </div>
// //         </header>

// //         {/* HEADER SECTION */}
// //         {/* <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-gray-200/80">
// //           <div>
// //             <div className="flex items-center gap-2 mb-1">
// //               <span className="w-2.5 h-2.5 rounded-full bg-[#D76328]"></span>
// //               <p className="text-[#D76328] text-xs font-black uppercase tracking-widest">
// //                 Akede Editorial
// //               </p>
// //             </div>
// //             <h1 className="text-2xl md:text-4xl font-black text-[#1F4D3A] tracking-tight">
// //               Local News Dashboard
// //             </h1>
// //           </div>

// //           {editingId && (
// //             <button
// //               type="button"
// //               onClick={handleResetForm}
// //               className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
// //             >
// //               <PlusCircle className="w-4 h-4" />
// //               Create New Post Instead
// //             </button>
// //           )}
// //         </header> */}

// //         {/* MAIN GRID */}
// //         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
// //           {/* FORM SIDE */}
// //           <form
// //             onSubmit={handleSubmit}
// //             className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6"
// //           >
// //             <div className="flex items-center justify-between border-b border-gray-100 pb-4">
// //               <h2 className="text-lg font-black text-[#1F4D3A]">
// //                 {editingId ? "Edit News Story" : "Create News Story"}
// //               </h2>
// //               <span className="text-xs font-bold text-gray-400">
// //                 * Required fields
// //               </span>
// //             </div>

// //             {/* CATEGORY SELECTOR */}
// //             <div>
// //               <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                 Category *
// //               </label>
// //               <div className="flex flex-wrap gap-2">
// //                 {CATEGORIES.map((cat) => (
// //                   <button
// //                     key={cat}
// //                     type="button"
// //                     onClick={() =>
// //                       setFormData((prev) => ({ ...prev, category: cat }))
// //                     }
// //                     className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
// //                       formData.category === cat
// //                         ? "bg-[#1F4D3A] text-white shadow-md shadow-[#1F4D3A]/20"
// //                         : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#1F4D3A]"
// //                     }`}
// //                   >
// //                     {cat}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* TITLE & NEIGHBOURHOOD */}
// //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //               <div>
// //                 <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                   Story Title *
// //                 </label>
// //                 <input
// //                   required
// //                   type="text"
// //                   placeholder="e.g. New Security Gate Installed"
// //                   value={formData.title}
// //                   onChange={(e) =>
// //                     setFormData((prev) => ({ ...prev, title: e.target.value }))
// //                   }
// //                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/10 text-sm font-medium transition-all"
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                   Neighbourhood
// //                 </label>
// //                 <input
// //                   type="text"
// //                   placeholder="e.g. Ikeja, Lekki Phase 1"
// //                   value={formData.neighbourhood}
// //                   onChange={(e) =>
// //                     setFormData((prev) => ({
// //                       ...prev,
// //                       neighbourhood: e.target.value,
// //                     }))
// //                   }
// //                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/10 text-sm font-medium transition-all"
// //                 />
// //               </div>
// //             </div>

// //             {/* COVER PHOTO UPLOAD */}
// //             <div>
// //               <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                 Cover Photo
// //               </label>

// //               <input
// //                 ref={fileInputRef}
// //                 type="file"
// //                 accept="image/*"
// //                 onChange={handleImageUpload}
// //                 className="hidden"
// //               />

// //               {!formData.imageUrl ? (
// //                 <div
// //                   onClick={() => fileInputRef.current?.click()}
// //                   className={`w-full border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
// //                     uploading
// //                       ? "border-[#1F4D3A]/40 bg-[#F0FAF4]/50 pointer-events-none"
// //                       : "border-gray-200 bg-gray-50/50 hover:bg-[#F0FAF4]/40 hover:border-[#6EC4A1]"
// //                   }`}
// //                 >
// //                   {uploading ? (
// //                     <div className="flex flex-col items-center gap-2 py-2">
// //                       <Loader2 className="w-8 h-8 text-[#1F4D3A] animate-spin" />
// //                       <span className="text-xs font-bold text-[#1F4D3A]">
// //                         Uploading photo to Cloudinary...
// //                       </span>
// //                     </div>
// //                   ) : (
// //                     <>
// //                       <div className="w-12 h-12 rounded-2xl bg-[#F0FAF4] flex items-center justify-center text-[#1F4D3A]">
// //                         <UploadCloud className="w-6 h-6" />
// //                       </div>
// //                       <div className="text-center">
// //                         <p className="text-sm font-bold text-[#1F4D3A]">
// //                           Click to upload cover image
// //                         </p>
// //                         <p className="text-[11px] text-gray-400 font-medium mt-0.5">
// //                           PNG, JPG, or WEBP (Recommended 1200x630)
// //                         </p>
// //                       </div>
// //                     </>
// //                   )}
// //                 </div>
// //               ) : (
// //                 <div className="relative w-full rounded-3xl overflow-hidden border border-gray-200 group bg-gray-100 max-h-64 flex items-center justify-center">
// //                   <img
// //                     src={formData.imageUrl}
// //                     alt={formData.imageAlt || "Cover Preview"}
// //                     className="w-full h-56 object-cover"
// //                   />

// //                   <div className="absolute top-3 left-3 bg-[#0F241B]/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1.5">
// //                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
// //                     Image Uploaded
// //                   </div>

// //                   <button
// //                     type="button"
// //                     onClick={handleRemoveImage}
// //                     className="absolute top-3 right-3 p-2 bg-[#0F241B]/70 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer shadow-lg"
// //                     title="Remove image"
// //                   >
// //                     <X className="w-4 h-4" />
// //                   </button>
// //                 </div>
// //               )}

// //               {uploadError && (
// //                 <p className="text-xs font-semibold text-red-500 mt-2">
// //                   {uploadError}
// //                 </p>
// //               )}
// //             </div>

// //             {/* AUTHOR */}
// //             <div>
// //               <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                 Author
// //               </label>
// //               <input
// //                 type="text"
// //                 placeholder="e.g. Akede Team"
// //                 value={formData.author}
// //                 onChange={(e) =>
// //                   setFormData((prev) => ({ ...prev, author: e.target.value }))
// //                 }
// //                 className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/10 text-sm font-medium transition-all"
// //               />
// //             </div>

// //             {/* EXCERPT */}
// //             <div>
// //               <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                 Card Excerpt / Short Summary *
// //               </label>
// //               <textarea
// //                 required
// //                 rows={2}
// //                 placeholder="Brief summary displayed on the card grid..."
// //                 value={formData.excerpt}
// //                 onChange={(e) =>
// //                   setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
// //                 }
// //                 className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/10 text-sm font-medium transition-all"
// //               />
// //             </div>

// //             {/* FULL STORY CONTENT */}
// //             <div>
// //               <label className="block text-xs font-black uppercase tracking-wider text-[#1F4D3A] mb-2">
// //                 Full Story Content *
// //               </label>
// //               <textarea
// //                 required
// //                 rows={8}
// //                 placeholder="Write the complete article content here..."
// //                 value={formData.content}
// //                 onChange={(e) =>
// //                   setFormData((prev) => ({ ...prev, content: e.target.value }))
// //                 }
// //                 className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-[#1F4D3A] focus:ring-2 focus:ring-[#1F4D3A]/10 text-sm font-medium transition-all leading-relaxed"
// //               />
// //             </div>

// //             {/* ACTION BUTTONS */}
// //             <div className="flex items-center gap-3 pt-2">
// //               <button
// //                 type="submit"
// //                 disabled={submitting}
// //                 className="flex-1 py-4 bg-[#1F4D3A] hover:bg-[#16382a] text-white rounded-3xl font-black text-sm tracking-wide shadow-xl shadow-[#1F4D3A]/20 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
// //               >
// //                 {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
// //                 {editingId ? "Update Story" : "Publish Story"}
// //               </button>

// //               {editingId && (
// //                 <button
// //                   type="button"
// //                   onClick={handleResetForm}
// //                   className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-3xl font-bold text-sm transition-all cursor-pointer"
// //                 >
// //                   Cancel
// //                 </button>
// //               )}
// //             </div>
// //           </form>

// //           {/* RIGHT SIDE: LIVE PREVIEW & PUBLISHED STORIES LIST */}
// //           <div className="lg:col-span-5 space-y-8">
// //             {/* LIVE CARD PREVIEW */}
// //             <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
// //               <div className="flex items-center justify-between mb-4">
// //                 <span className="text-xs font-black uppercase tracking-wider text-gray-400">
// //                   Live Card Preview
// //                 </span>
// //                 <span className="text-[10px] font-bold bg-[#F0FAF4] text-[#1F4D3A] px-2.5 py-0.5 rounded-full">
// //                   Updates in real-time
// //                 </span>
// //               </div>

// //               {/* CARD PREVIEW */}
// //               <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
// //                 <div className="relative w-full h-44 bg-[#F0FAF4] flex items-center justify-center overflow-hidden">
// //                   {formData.imageUrl ? (
// //                     <img
// //                       src={formData.imageUrl}
// //                       alt="Preview"
// //                       className="w-full h-full object-cover"
// //                     />
// //                   ) : (
// //                     <div className="flex flex-col items-center gap-2 text-[#1F4D3A]/30">
// //                       <ImageIcon className="w-8 h-8 stroke-[1.5]" />
// //                       <span className="text-[10px] font-bold uppercase tracking-widest">
// //                         Cover Image Preview
// //                       </span>
// //                     </div>
// //                   )}
// //                 </div>

// //                 <div className="p-5">
// //                   <div className="flex items-center gap-2 mb-2">
// //                     <span className="px-3 py-1 bg-[#F0FAF4] text-[#1F4D3A] rounded-full text-[9px] font-bold uppercase tracking-wider">
// //                       {formData.category}
// //                     </span>
// //                     <span className="text-[11px] text-gray-400 font-medium">
// //                       {formData.neighbourhood || "General"}
// //                     </span>
// //                   </div>
// //                   <h3 className="text-lg font-black text-[#1F4D3A] leading-snug mb-1">
// //                     {formData.title || "Story Title Preview..."}
// //                   </h3>
// //                   <p className="text-xs text-gray-400 font-medium line-clamp-2">
// //                     {formData.excerpt ||
// //                       "Your card summary snippet will appear right here as you type into the form."}
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* PREVIOUS / PUBLISHED STORIES LIST */}
// //             <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm">
// //               <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
// //                 <div className="flex items-center gap-2">
// //                   <Newspaper className="w-5 h-5 text-[#D76328]" />
// //                   <h3 className="text-md font-black text-[#1F4D3A]">
// //                     Published Stories ({posts.length})
// //                   </h3>
// //                 </div>
// //                 <button
// //                   type="button"
// //                   onClick={fetchPosts}
// //                   className="text-xs font-bold text-[#1F4D3A] hover:underline cursor-pointer"
// //                 >
// //                   Refresh
// //                 </button>
// //               </div>

// //               {loadingPosts ? (
// //                 <div className="flex justify-center py-8">
// //                   <Loader2 className="w-6 h-6 text-[#1F4D3A] animate-spin" />
// //                 </div>
// //               ) : posts.length === 0 ? (
// //                 <p className="text-xs text-gray-400 font-medium text-center py-6">
// //                   No published stories found yet.
// //                 </p>
// //               ) : (
// //                 <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
// //                   {posts.map((post) => (
// //                     <div
// //                       key={post._id || post.slug}
// //                       className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
// //                     >
// //                       <div className="flex items-center gap-3 overflow-hidden">
// //                         <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0 overflow-hidden relative flex items-center justify-center">
// //                           {post.imageUrl ? (
// //                             <img
// //                               src={post.imageUrl}
// //                               alt={post.title}
// //                               className="w-full h-full object-cover"
// //                             />
// //                           ) : (
// //                             <ImageIcon className="w-5 h-5 text-gray-400" />
// //                           )}
// //                         </div>

// //                         <div className="overflow-hidden">
// //                           <h4 className="text-xs font-bold text-[#1F4D3A] truncate">
// //                             {post.title}
// //                           </h4>
// //                           <p className="text-[10px] text-gray-400 font-medium mt-0.5">
// //                             {post.category} • {post.author || "Akede Team"}
// //                           </p>
// //                         </div>
// //                       </div>

// //                       {/* EDIT & DELETE ACTION BUTTONS */}
// //                       <div className="flex items-center gap-1 shrink-0">
// //                         <button
// //                           type="button"
// //                           onClick={() => handleStartEdit(post)}
// //                           className="p-2 text-gray-400 hover:text-[#1F4D3A] hover:bg-white rounded-xl transition-all cursor-pointer"
// //                           title="Edit Post"
// //                         >
// //                           <Edit2 className="w-4 h-4" />
// //                         </button>
// //                         <button
// //                           type="button"
// //                           onClick={() => handleDelete(post._id)}
// //                           className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all cursor-pointer"
// //                           title="Delete Post"
// //                         >
// //                           <Trash2 className="w-4 h-4" />
// //                         </button>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // import React, { useState, useEffect } from "react";
// // // import Swal from "sweetalert2";
// // // import {
// // //   Send,
// // //   Trash2,
// // //   Edit3,
// // //   Loader2,
// // //   X,
// // //   FileText,
// // //   Image as ImageIcon,
// // //   Plus,
// // //   Radio, // Used for the Akede logo icon accent
// // // } from "lucide-react";
// // // import {
// // //   getPosts,
// // //   createPost,
// // //   updatePost,
// // //   deletePost,
// // // } from "./services/api";

// // // import type { Post } from "./services/api";

// // // const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// // // // Vite Environment Variables
// // // const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
// // // const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "akede_preset";

// // // export default function App() {
// // //   const [posts, setPosts] = useState<Post[]>([]);
// // //   const [loadingPosts, setLoadingPosts] = useState(true);

// // //   const [editingId, setEditingId] = useState<string | null>(null);
// // //   const [title, setTitle] = useState("");
// // //   const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
// // //   const [neighbourhood, setNeighbourhood] = useState("");
// // //   const [author, setAuthor] = useState("");
// // //   const [excerpt, setExcerpt] = useState("");
// // //   const [content, setContent] = useState("");
// // //   const [imageUrl, setImageUrl] = useState("");

// // //   const [imageFile, setImageFile] = useState<File | null>(null);
// // //   const [imagePreview, setImagePreview] = useState<string>("");
// // //   const [uploadingImage, setUploadingImage] = useState(false);
// // //   const [submitting, setSubmitting] = useState(false);

// // //   useEffect(() => {
// // //     fetchPostsList();
// // //   }, []);

// // //   const fetchPostsList = async () => {
// // //     setLoadingPosts(true);
// // //     try {
// // //       const data = await getPosts();
// // //       setPosts(data);
// // //     } catch (err: any) {
// // //       console.error("Failed to load posts", err);
// // //       Swal.fire({
// // //         icon: "error",
// // //         title: "Error Loading Posts",
// // //         text: err.response?.data?.message || "Failed to fetch posts feed.",
// // //         confirmButtonColor: "#10b981",
// // //       });
// // //     } finally {
// // //       setLoadingPosts(false);
// // //     }
// // //   };

// // //   const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const file = e.target.files?.[0];
// // //     if (file) {
// // //       setImageFile(file);
// // //       setImagePreview(URL.createObjectURL(file));
// // //     }
// // //   };

// // //   const uploadToCloudinary = async (file: File): Promise<string> => {
// // //     const formData = new FormData();
// // //     formData.append("file", file);
// // //     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

// // //     const res = await fetch(
// // //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
// // //       {
// // //         method: "POST",
// // //         body: formData,
// // //       }
// // //     );

// // //     if (!res.ok) {
// // //       throw new Error("Failed to upload image. Please check network connection.");
// // //     }

// // //     const data = await res.json();
// // //     return data.secure_url;
// // //   };

// // //   const handleEditClick = (post: Post) => {
// // //     const targetId = post._id || post.id || "";
// // //     setEditingId(targetId);
// // //     setTitle(post.title);
// // //     setCategory(post.category);
// // //     setNeighbourhood(post.neighbourhood || "");
// // //     setAuthor(post.author || "Akede Team");
// // //     setExcerpt(post.excerpt);
// // //     setContent(post.content);
// // //     setImageUrl(post.imageUrl || "");
// // //     setImagePreview(post.imageUrl || "");
// // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // //   };

// // //   const resetForm = () => {
// // //     setEditingId(null);
// // //     setTitle("");
// // //     setCategory("Neighbourhood");
// // //     setNeighbourhood("");
// // //     setAuthor("");
// // //     setExcerpt("");
// // //     setContent("");
// // //     setImageUrl("");
// // //     setImagePreview("");
// // //     setImageFile(null);
// // //   };

// // //   const handleDelete = async (id: string) => {
// // //     const result = await Swal.fire({
// // //       title: "Are you sure?",
// // //       text: "Delete this story from feed?",
// // //       icon: "warning",
// // //       showCancelButton: true,
// // //       confirmButtonColor: "#ef4444",
// // //       cancelButtonColor: "#6b7280",
// // //       confirmButtonText: "Yes, delete",
// // //     });

// // //     if (!result.isConfirmed) return;

// // //     try {
// // //       await deletePost(id);
// // //       Swal.fire({
// // //         icon: "success",
// // //         title: "Deleted!",
// // //         text: "Post deleted successfully.",
// // //         timer: 2000,
// // //         showConfirmButton: false,
// // //       });
// // //       fetchPostsList();
// // //     } catch (err: any) {
// // //       Swal.fire({
// // //         icon: "error",
// // //         title: "Delete Failed",
// // //         text: err.response?.data?.message || "Failed to delete post.",
// // //       });
// // //     }
// // //   };

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     if (!title || !excerpt || !content) {
// // //       Swal.fire({
// // //         icon: "warning",
// // //         title: "Missing Information",
// // //         text: "Please fill in the title, excerpt summary, and story content.",
// // //       });
// // //       return;
// // //     }

// // //     setSubmitting(true);

// // //     try {
// // //       let finalImageUrl = imageUrl;

// // //       if (imageFile) {
// // //         setUploadingImage(true);
// // //         finalImageUrl = await uploadToCloudinary(imageFile);
// // //         setUploadingImage(false);
// // //       }

// // //       const payload: Post = {
// // //         title,
// // //         category,
// // //         neighbourhood: neighbourhood || "General",
// // //         author: author || "Akede Team",
// // //         excerpt,
// // //         content,
// // //         imageUrl: finalImageUrl.trim() || null,
// // //         imageAlt: title,
// // //         isPublished: true,
// // //       };

// // //       if (editingId) {
// // //         await updatePost(editingId, payload);
// // //         Swal.fire({
// // //           icon: "success",
// // //           title: "Post Updated!",
// // //           text: "Story updated successfully.",
// // //           timer: 2000,
// // //           showConfirmButton: false,
// // //         });
// // //       } else {
// // //         await createPost(payload);
// // //         Swal.fire({
// // //           icon: "success",
// // //           title: "Published!",
// // //           text: "Story published to the local feed!",
// // //           timer: 2000,
// // //           showConfirmButton: false,
// // //         });
// // //       }
// // //       resetForm();
// // //       fetchPostsList();
// // //     } catch (err: any) {
// // //       Swal.fire({
// // //         icon: "error",
// // //         title: "Publish Failed",
// // //         text:
// // //           err.response?.data?.message ||
// // //           err.message ||
// // //           "Could not save post. Please check your connection.",
// // //       });
// // //     } finally {
// // //       setSubmitting(false);
// // //       setUploadingImage(false);
// // //     }
// // //   };

// // //   return (
// // //     <div className="min-h-screen bg-akede-bg flex flex-col font-sans">
// // //       <header className="bg-akede-green text-white py-3 px-4 sm:px-8 shadow-md border-b-4 border-akede-orange sticky top-0 z-30">
// // //         <div className="max-w-7xl mx-auto flex justify-center items-center">
// // //           <div className="flex items-center space-x-3">
// // //             <div className="w-30 h-10 flex items-center justify-center">
// // //               <img src="/LogoMarkWhite.png" alt="Akede Logo" className="w-full h-8 object-fill" />
// // //             </div>
// // //             <span className="bg-akede-lightGreen text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
// // //               News Portal
// // //             </span>
// // //           </div>
// // //         </div>
// // //       </header>

// // //       <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
// // //         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

// // //           <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
// // //             <div className="bg-akede-accentGreen p-4 sm:p-6 border-b border-green-100 flex justify-between items-center">
// // //               <div className="flex flex-col">
// // //                 <h1 className="text-xl sm:text-2xl font-black text-akede-green">
// // //                   {editingId ? "Edit Story" : "Publish Story"}
// // //                 </h1>
// // //                 <p className="text-xs text-gray-600 mt-0.5">
// // //                   Post updates directly to the neighbourhood app
// // //                 </p>
// // //               </div>
// // //               {editingId && (
// // //                 <button
// // //                   type="button"
// // //                   onClick={resetForm}
// // //                   className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200"
// // //                 >
// // //                   <X className="w-4 h-4" />
// // //                   <span>Cancel</span>
// // //                 </button>
// // //               )}
// // //             </div>

// // //             <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
// // //               <div>
// // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // //                   Category *
// // //                 </label>
// // //                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
// // //                   {CATEGORIES.map((cat) => (
// // //                     <button
// // //                       key={cat}
// // //                       type="button"
// // //                       onClick={() => setCategory(cat)}
// // //                       className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border active:scale-95 ${
// // //                         category === cat
// // //                           ? "bg-akede-green text-white border-akede-green shadow-sm"
// // //                           : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
// // //                       }`}
// // //                     >
// // //                       {cat}
// // //                     </button>
// // //                   ))}
// // //                 </div>
// // //               </div>

// // //               <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
// // //                 <div>
// // //                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                     Story Title *
// // //                   </label>
// // //                   <input
// // //                     type="text"
// // //                     placeholder="e.g. New Security Gate Installed"
// // //                     value={title}
// // //                     onChange={(e) => setTitle(e.target.value)}
// // //                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // //                     required
// // //                   />
// // //                 </div>

// // //                 <div>
// // //                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                     Neighbourhood
// // //                   </label>
// // //                   <input
// // //                     type="text"
// // //                     placeholder="e.g. Ikeja, Lekki Phase 1"
// // //                     value={neighbourhood}
// // //                     onChange={(e) => setNeighbourhood(e.target.value)}
// // //                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // //                   />
// // //                 </div>
// // //               </div>

// // //               <div>
// // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                   Cover Photo
// // //                 </label>

// // //                 {imagePreview ? (
// // //                   <div className="relative w-full h-44 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
// // //                     <img
// // //                       src={imagePreview}
// // //                       alt="Story cover"
// // //                       className="w-full h-full object-cover"
// // //                     />
// // //                     <button
// // //                       type="button"
// // //                       onClick={() => {
// // //                         setImageFile(null);
// // //                         setImagePreview("");
// // //                         setImageUrl("");
// // //                       }}
// // //                       className="absolute top-3 right-3 bg-black/70 hover:bg-rose-600 text-white p-2 rounded-full transition shadow-md"
// // //                       title="Remove Image"
// // //                     >
// // //                       <X className="w-5 h-5" />
// // //                     </button>
// // //                   </div>
// // //                 ) : (
// // //                   <label className="flex items-center justify-center space-x-2 w-full py-4 px-4 border-2 border-dashed border-gray-300 hover:border-akede-green bg-gray-50 rounded-xl cursor-pointer transition active:bg-gray-100">
// // //                     <Plus className="w-5 h-5 text-akede-green" />
// // //                     <span className="text-sm font-bold text-gray-700">Add Image</span>
// // //                     <input
// // //                       type="file"
// // //                       accept="image/*"
// // //                       onChange={handleImageFileChange}
// // //                       className="hidden"
// // //                     />
// // //                   </label>
// // //                 )}
// // //               </div>

// // //               {/* Author */}
// // //               <div>
// // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                   Author
// // //                 </label>
// // //                 <input
// // //                   type="text"
// // //                   placeholder="e.g. Akede Team"
// // //                   value={author}
// // //                   onChange={(e) => setAuthor(e.target.value)}
// // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // //                 />
// // //               </div>

// // //               {/* Excerpt */}
// // //               <div>
// // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                   Card Preview Text *
// // //                 </label>
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Short 1-sentence summary..."
// // //                   value={excerpt}
// // //                   onChange={(e) => setExcerpt(e.target.value)}
// // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // //                   required
// // //                 />
// // //               </div>

// // //               {/* Content */}
// // //               <div>
// // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // //                   Full Story *
// // //                 </label>
// // //                 <textarea
// // //                   rows={4}
// // //                   placeholder="Write the full update here..."
// // //                   value={content}
// // //                   onChange={(e) => setContent(e.target.value)}
// // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm resize-none"
// // //                   required
// // //                 />
// // //               </div>

// // //               {/* Submit Button */}
// // //               <button
// // //                 type="submit"
// // //                 disabled={submitting || uploadingImage}
// // //                 className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50"
// // //               >
// // //                 {submitting || uploadingImage ? (
// // //                   <>
// // //                     <Loader2 className="w-5 h-5 animate-spin" />
// // //                     <span>
// // //                       {uploadingImage ? "Uploading Photo..." : "Saving Story..."}
// // //                     </span>
// // //                   </>
// // //                 ) : editingId ? (
// // //                   <>
// // //                     <Edit3 className="w-4 h-4 text-akede-orange" />
// // //                     <span>Update Story</span>
// // //                   </>
// // //                 ) : (
// // //                   <>
// // //                     <Send className="w-4 h-4 text-akede-orange" />
// // //                     <span>Publish Story</span>
// // //                   </>
// // //                 )}
// // //               </button>
// // //             </form>
// // //           </div>

// // //           {/* RIGHT COLUMN: Live Card Preview & Feed (Takes 5 Cols on Desktop) */}
// // //           <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">

// // //             {/* Live Feed Card Preview */}
// // //             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
// // //               <div className="flex items-center justify-between mb-3">
// // //                 <span className="text-xs font-bold uppercase tracking-wider text-akede-green">
// // //                   Live Card Preview
// // //                 </span>
// // //                 <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded">
// // //                   Updates in real-time
// // //                 </span>
// // //               </div>

// // //               <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
// // //                 {imagePreview ? (
// // //                   <img
// // //                     src={imagePreview}
// // //                     alt="Preview"
// // //                     className="w-full h-44 object-cover"
// // //                   />
// // //                 ) : (
// // //                   <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 space-y-1">
// // //                     <ImageIcon className="w-7 h-7 stroke-1" />
// // //                     <span className="text-[11px] font-medium">No cover image added</span>
// // //                   </div>
// // //                 )}
// // //                 <div className="p-4 space-y-2">
// // //                   <div className="flex items-center space-x-2">
// // //                     <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
// // //                       {category}
// // //                     </span>
// // //                     <span className="text-xs text-gray-400 font-medium truncate">
// // //                       {neighbourhood || "General"}
// // //                     </span>
// // //                   </div>
// // //                   <h3 className="font-extrabold text-gray-900 text-base leading-snug">
// // //                     {title || "Story Title Preview..."}
// // //                   </h3>
// // //                   <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
// // //                     {excerpt || "Your card summary snippet will appear right here as you type into the form."}
// // //                   </p>
// // //                 </div>
// // //               </div>
// // //             </div>

// // //             {/* Published Stories List */}
// // //             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
// // //               <h2 className="text-base sm:text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
// // //                 <FileText className="w-5 h-5 text-akede-orange" />
// // //                 <span>Published Stories ({posts.length})</span>
// // //               </h2>

// // //               {loadingPosts ? (
// // //                 <div className="py-8 flex justify-center text-gray-400">
// // //                   <Loader2 className="w-6 h-6 animate-spin" />
// // //                 </div>
// // //               ) : posts.length === 0 ? (
// // //                 <p className="text-xs sm:text-sm text-gray-500 text-center py-6">
// // //                   No stories published yet.
// // //                 </p>
// // //               ) : (
// // //                 <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
// // //                   {posts.map((post) => {
// // //                     const postId = post._id || post.id || "";
// // //                     return (
// // //                       <div
// // //                         key={postId}
// // //                         className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 hover:border-gray-200 transition"
// // //                       >
// // //                         <div className="flex items-center space-x-3 min-w-0">
// // //                           {post.imageUrl && (
// // //                             <img
// // //                               src={post.imageUrl}
// // //                               alt={post.title}
// // //                               className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
// // //                             />
// // //                           )}
// // //                           <div className="min-w-0">
// // //                             <span className="bg-akede-accentGreen text-akede-green text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mb-1">
// // //                               {post.category}
// // //                             </span>
// // //                             <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
// // //                               {post.title}
// // //                             </h3>
// // //                           </div>
// // //                         </div>

// // //                         <div className="flex items-center space-x-1 shrink-0">
// // //                           <button
// // //                             onClick={() => handleEditClick(post)}
// // //                             className="p-1.5 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition"
// // //                             title="Edit"
// // //                           >
// // //                             <Edit3 className="w-3.5 h-3.5" />
// // //                           </button>
// // //                           <button
// // //                             onClick={() => handleDelete(postId)}
// // //                             className="p-1.5 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition"
// // //                             title="Delete"
// // //                           >
// // //                             <Trash2 className="w-3.5 h-3.5" />
// // //                           </button>
// // //                         </div>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               )}
// // //             </div>

// // //           </div>

// // //         </div>
// // //       </main>
// // //     </div>
// // //   );
// // // }

// // // // import React, { useState, useEffect } from "react";
// // // // import Swal from "sweetalert2";
// // // // import {
// // // //   Send,
// // // //   Trash2,
// // // //   Edit3,
// // // //   Loader2,
// // // //   X,
// // // //   FileText,
// // // //   Image as ImageIcon,
// // // //   Eye,
// // // //   Plus,
// // // // } from "lucide-react";
// // // // import {
// // // //   getPosts,
// // // //   createPost,
// // // //   updatePost,
// // // //   deletePost,
// // // // } from "./services/api";

// // // // import type { Post } from "./services/api";

// // // // const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// // // // // Vite Environment Variables
// // // // const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
// // // // const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "akede_preset";

// // // // export default function App() {
// // // //   const [posts, setPosts] = useState<Post[]>([]);
// // // //   const [loadingPosts, setLoadingPosts] = useState(true);

// // // //   const [editingId, setEditingId] = useState<string | null>(null);
// // // //   const [title, setTitle] = useState("");
// // // //   const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
// // // //   const [neighbourhood, setNeighbourhood] = useState("");
// // // //   const [author, setAuthor] = useState("");
// // // //   const [excerpt, setExcerpt] = useState("");
// // // //   const [content, setContent] = useState("");
// // // //   const [imageUrl, setImageUrl] = useState("");
// // // //   // const [isPublished, setIsPublish ed] = useState(true);

// // // //   // Simple Image Upload State
// // // //   const [imageFile, setImageFile] = useState<File | null>(null);
// // // //   const [imagePreview, setImagePreview] = useState<string>("");
// // // //   const [uploadingImage, setUploadingImage] = useState(false);

// // // //   // Mobile/Live Preview Modal Toggle
// // // //   const [showCardPreview, setShowCardPreview] = useState(false);
// // // //   const [submitting, setSubmitting] = useState(false);

// // // //   useEffect(() => {
// // // //     fetchPostsList();
// // // //   }, []);

// // // //   const fetchPostsList = async () => {
// // // //     setLoadingPosts(true);
// // // //     try {
// // // //       const data = await getPosts();
// // // //       setPosts(data);
// // // //     } catch (err: any) {
// // // //       console.error("Failed to load posts", err);
// // // //       Swal.fire({
// // // //         icon: "error",
// // // //         title: "Error Loading Posts",
// // // //         text: err.response?.data?.message || "Failed to fetch posts feed.",
// // // //         confirmButtonColor: "#10b981",
// // // //       });
// // // //     } finally {
// // // //       setLoadingPosts(false);
// // // //     }
// // // //   };

// // // //   const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // // //     const file = e.target.files?.[0];
// // // //     if (file) {
// // // //       setImageFile(file);
// // // //       setImagePreview(URL.createObjectURL(file));
// // // //     }
// // // //   };

// // // //   const uploadToCloudinary = async (file: File): Promise<string> => {
// // // //     const formData = new FormData();
// // // //     formData.append("file", file);
// // // //     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

// // // //     const res = await fetch(
// // // //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
// // // //       {
// // // //         method: "POST",
// // // //         body: formData,
// // // //       }
// // // //     );

// // // //     if (!res.ok) {
// // // //       throw new Error("Failed to upload image. Please check network connection.");
// // // //     }

// // // //     const data = await res.json();
// // // //     return data.secure_url;
// // // //   };

// // // //   const handleEditClick = (post: Post) => {
// // // //     const targetId = post._id || post.id || "";
// // // //     setEditingId(targetId);
// // // //     setTitle(post.title);
// // // //     setCategory(post.category);
// // // //     setNeighbourhood(post.neighbourhood || "");
// // // //     setAuthor(post.author || "Akede Product");
// // // //     setExcerpt(post.excerpt);
// // // //     setContent(post.content);
// // // //     setImageUrl(post.imageUrl || "");
// // // //     setImagePreview(post.imageUrl || "");
// // // //     // setIsPublished(post.isPublished ?? true);
// // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // //   };

// // // //   const resetForm = () => {
// // // //     setEditingId(null);
// // // //     setTitle("");
// // // //     setCategory("Neighbourhood");
// // // //     setNeighbourhood("");
// // // //     setAuthor("");
// // // //     setExcerpt("");
// // // //     setContent("");
// // // //     setImageUrl("");
// // // //     setImagePreview("");
// // // //     setImageFile(null);
// // // //     // setIsPublished(true);
// // // //   };

// // // //   const handleDelete = async (id: string) => {
// // // //     const result = await Swal.fire({
// // // //       title: "Are you sure?",
// // // //       text: "Delete this story from feed?",
// // // //       icon: "warning",
// // // //       showCancelButton: true,
// // // //       confirmButtonColor: "#ef4444",
// // // //       cancelButtonColor: "#6b7280",
// // // //       confirmButtonText: "Yes, delete",
// // // //     });

// // // //     if (!result.isConfirmed) return;

// // // //     try {
// // // //       await deletePost(id);
// // // //       Swal.fire({
// // // //         icon: "success",
// // // //         title: "Deleted!",
// // // //         text: "Post deleted successfully.",
// // // //         timer: 2000,
// // // //         showConfirmButton: false,
// // // //       });
// // // //       fetchPostsList();
// // // //     } catch (err: any) {
// // // //       Swal.fire({
// // // //         icon: "error",
// // // //         title: "Delete Failed",
// // // //         text: err.response?.data?.message || "Failed to delete post.",
// // // //       });
// // // //     }
// // // //   };

// // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // //     e.preventDefault();
// // // //     if (!title || !excerpt || !content) {
// // // //       Swal.fire({
// // // //         icon: "warning",
// // // //         title: "Missing Information",
// // // //         text: "Please fill in the title, excerpt summary, and story content.",
// // // //       });
// // // //       return;
// // // //     }

// // // //     setSubmitting(true);

// // // //     try {
// // // //       let finalImageUrl = imageUrl;

// // // //       if (imageFile) {
// // // //         setUploadingImage(true);
// // // //         finalImageUrl = await uploadToCloudinary(imageFile);
// // // //         setUploadingImage(false);
// // // //       }

// // // //       const payload: Post = {
// // // //         title,
// // // //         category,
// // // //         neighbourhood: neighbourhood || "General",
// // // //         author: author || "Akede Product",
// // // //         excerpt,
// // // //         content,
// // // //         imageUrl: finalImageUrl.trim() || null,
// // // //         imageAlt: title,
// // // //         isPublished: true
// // // //       };

// // // //       if (editingId) {
// // // //         await updatePost(editingId, payload);
// // // //         Swal.fire({
// // // //           icon: "success",
// // // //           title: "Post Updated!",
// // // //           text: "Story updated successfully.",
// // // //           timer: 2000,
// // // //           showConfirmButton: false,
// // // //         });
// // // //       } else {
// // // //         await createPost(payload);
// // // //         Swal.fire({
// // // //           icon: "success",
// // // //           title: "Published!",
// // // //           text: "Story published to the local feed!",
// // // //           timer: 2000,
// // // //           showConfirmButton: false,
// // // //         });
// // // //       }
// // // //       resetForm();
// // // //       fetchPostsList();
// // // //     } catch (err: any) {
// // // //       Swal.fire({
// // // //         icon: "error",
// // // //         title: "Publish Failed",
// // // //         text:
// // // //           err.response?.data?.message ||
// // // //           err.message ||
// // // //           "Could not save post. Please check your connection.",
// // // //       });
// // // //     } finally {
// // // //       setSubmitting(false);
// // // //       setUploadingImage(false);
// // // //     }
// // // //   };

// // // //   return (
// // // //     <div className="min-h-screen bg-akede-bg flex flex-col font-sans">
// // // //       {/* Header */}
// // // //       <header className="bg-akede-green text-white py-4 px-4 sm:px-8 shadow-md flex justify-between items-center border-b-4 border-akede-orange sticky top-0 z-30">
// // // //         <div className="flex items-center space-x-2">
// // // //           <span className="text-2xl sm:text-3xl font-black tracking-wider">AKEDE</span>
// // // //           <span className="bg-akede-lightGreen text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
// // // //             Admin
// // // //           </span>
// // // //         </div>
// // // //       </header>

// // // //       <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
// // // //         {/* Form Card */}
// // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
// // // //           <div className="bg-akede-accentGreen p-4 sm:p-6 border-b border-green-100 flex justify-between items-center">
// // // //             <div className="flex flex-col">
// // // //               <h1 className="text-xl sm:text-2xl font-black text-akede-green">
// // // //                 {editingId ? "Edit Story" : "Publish Story"}
// // // //               </h1>
// // // //               <p className="text-xs text-gray-600 mt-0.5">
// // // //                 Post updates to the neighbourhood app
// // // //               </p>
// // // //             </div>
// // // //             {editingId && (
// // // //               <button
// // // //                 type="button"
// // // //                 onClick={resetForm}
// // // //                 className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200"
// // // //               >
// // // //                 <X className="w-4 h-4" />
// // // //                 <span>Cancel</span>
// // // //               </button>
// // // //             )}
// // // //           </div>

// // // //           <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
// // // //             {/* Category Selector */}
// // // //             <div>
// // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // //                 Category *
// // // //               </label>
// // // //               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
// // // //                 {CATEGORIES.map((cat) => (
// // // //                   <button
// // // //                     key={cat}
// // // //                     type="button"
// // // //                     onClick={() => setCategory(cat)}
// // // //                     className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border active:scale-95 ${
// // // //                       category === cat
// // // //                         ? "bg-akede-green text-white border-akede-green shadow-sm"
// // // //                         : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
// // // //                     }`}
// // // //                   >
// // // //                     {cat}
// // // //                   </button>
// // // //                 ))}
// // // //               </div>
// // // //             </div>

// // // //             {/* Title & Neighbourhood */}
// // // //             <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
// // // //               <div>
// // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                   Story Title *
// // // //                 </label>
// // // //                 <input
// // // //                   type="text"
// // // //                   placeholder="e.g. New Security Gate Installed"
// // // //                   value={title}
// // // //                   onChange={(e) => setTitle(e.target.value)}
// // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // // //                   required
// // // //                 />
// // // //               </div>

// // // //               <div>
// // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                   Neighbourhood
// // // //                 </label>
// // // //                 <input
// // // //                   type="text"
// // // //                   placeholder="e.g. Ikeja, Lekki Phase 1"
// // // //                   value={neighbourhood}
// // // //                   onChange={(e) => setNeighbourhood(e.target.value)}
// // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // // //                 />
// // // //               </div>
// // // //             </div>

// // // //             {/* Simple Mobile-Friendly Image Upload */}
// // // //             <div>
// // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                 Cover Photo
// // // //               </label>

// // // //               {imagePreview ? (
// // // //                 /* Selected Image Preview State */
// // // //                 <div className="relative w-full h-44 sm:h-52 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
// // // //                   <img
// // // //                     src={imagePreview}
// // // //                     alt="Story cover"
// // // //                     className="w-full h-full object-cover"
// // // //                   />
// // // //                   <button
// // // //                     type="button"
// // // //                     onClick={() => {
// // // //                       setImageFile(null);
// // // //                       setImagePreview("");
// // // //                       setImageUrl("");
// // // //                     }}
// // // //                     className="absolute top-3 right-3 bg-black/70 hover:bg-rose-600 text-white p-2 rounded-full transition shadow-md"
// // // //                     title="Remove Image"
// // // //                   >
// // // //                     <X className="w-5 h-5" />
// // // //                   </button>
// // // //                 </div>
// // // //               ) : (
// // // //                 /* Simple Add Image Button */
// // // //                 <label className="flex items-center justify-center space-x-2 w-full py-4 px-4 border-2 border-dashed border-gray-300 hover:border-akede-green bg-gray-50 rounded-xl cursor-pointer transition active:bg-gray-100">
// // // //                   <Plus className="w-5 h-5 text-akede-green" />
// // // //                   <span className="text-sm font-bold text-gray-700">Add Image</span>
// // // //                   <input
// // // //                     type="file"
// // // //                     accept="image/*"
// // // //                     onChange={handleImageFileChange}
// // // //                     className="hidden"
// // // //                   />
// // // //                 </label>
// // // //               )}
// // // //             </div>

// // // //             {/* Author */}
// // // //             <div>
// // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                 Author
// // // //               </label>
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="e.g. Akede Team"
// // // //                 value={author}
// // // //                 onChange={(e) => setAuthor(e.target.value)}
// // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // // //               />
// // // //             </div>

// // // //             {/* Excerpt */}
// // // //             <div>
// // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                 Card Preview Text *
// // // //               </label>
// // // //               <input
// // // //                 type="text"
// // // //                 placeholder="Short 1-sentence summary..."
// // // //                 value={excerpt}
// // // //                 onChange={(e) => setExcerpt(e.target.value)}
// // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
// // // //                 required
// // // //               />
// // // //             </div>

// // // //             {/* Content */}
// // // //             <div>
// // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
// // // //                 Full Story *
// // // //               </label>
// // // //               <textarea
// // // //                 rows={4}
// // // //                 placeholder="Write the full update here..."
// // // //                 value={content}
// // // //                 onChange={(e) => setContent(e.target.value)}
// // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm resize-none"
// // // //                 required
// // // //               />
// // // //             </div>

// // // //             {/* Options & Preview Toggle */}
// // // //             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
// // // //               {/* <label className="flex items-center space-x-2.5 cursor-pointer">
// // // //                 <input
// // // //                   type="checkbox"
// // // //                   checked={isPublished}
// // // //                   onChange={(e) => setIsPublished(e.target.checked)}
// // // //                   className="w-4 h-4 rounded text-akede-green focus:ring-akede-green"
// // // //                 />
// // // //                 <span className="text-xs font-bold uppercase text-gray-700">
// // // //                   Publish immediately
// // // //                 </span>
// // // //               </label> */}

// // // //               <button
// // // //                 type="button"
// // // //                 onClick={() => setShowCardPreview(!showCardPreview)}
// // // //                 className="flex items-center space-x-1 text-xs font-bold text-akede-green hover:underline self-start sm:self-auto"
// // // //               >
// // // //                 <Eye className="w-4 h-4" />
// // // //                 <span>{showCardPreview ? "Hide Card Preview" : "Preview How It Looks"}</span>
// // // //               </button>
// // // //             </div>

// // // //             {/* Feed Card Live Preview */}
// // // //             {showCardPreview && (
// // // //               <div className="p-4 bg-gray-100 rounded-xl border border-gray-200 space-y-2">
// // // //                 <p className="text-[10px] font-bold uppercase text-gray-400">
// // // //                   Card Preview
// // // //                 </p>
// // // //                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-w-sm mx-auto">
// // // //                   {imagePreview ? (
// // // //                     <img
// // // //                       src={imagePreview}
// // // //                       alt="Preview"
// // // //                       className="w-full h-40 object-cover"
// // // //                     />
// // // //                   ) : (
// // // //                     <div className="w-full h-28 bg-gray-50 flex items-center justify-center text-gray-400">
// // // //                       <ImageIcon className="w-6 h-6 stroke-1" />
// // // //                     </div>
// // // //                   )}
// // // //                   <div className="p-3.5 space-y-1.5">
// // // //                     <div className="flex items-center space-x-2">
// // // //                       <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
// // // //                         {category}
// // // //                       </span>
// // // //                       <span className="text-[11px] text-gray-400">
// // // //                         {neighbourhood || "General"}
// // // //                       </span>
// // // //                     </div>
// // // //                     <h3 className="font-bold text-gray-900 text-sm leading-tight">
// // // //                       {title || "Story Title Preview"}
// // // //                     </h3>
// // // //                     <p className="text-xs text-gray-500 line-clamp-2">
// // // //                       {excerpt || "Your summary preview will show here..."}
// // // //                     </p>
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             )}

// // // //             {/* Submit Button */}
// // // //             <button
// // // //               type="submit"
// // // //               disabled={submitting || uploadingImage}
// // // //               className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50"
// // // //             >
// // // //               {submitting || uploadingImage ? (
// // // //                 <>
// // // //                   <Loader2 className="w-5 h-5 animate-spin" />
// // // //                   <span>
// // // //                     {uploadingImage ? "Uploading Photo..." : "Saving Story..."}
// // // //                   </span>
// // // //                 </>
// // // //               ) : editingId ? (
// // // //                 <>
// // // //                   <Edit3 className="w-4 h-4 text-akede-orange" />
// // // //                   <span>Update Story</span>
// // // //                 </>
// // // //               ) : (
// // // //                 <>
// // // //                   <Send className="w-4 h-4 text-akede-orange" />
// // // //                   <span>Publish Story</span>
// // // //                 </>
// // // //               )}
// // // //             </button>
// // // //           </form>
// // // //         </div>

// // // //         {/* Stories List Section */}
// // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
// // // //           <h2 className="text-base sm:text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
// // // //             <FileText className="w-5 h-5 text-akede-orange" />
// // // //             <span>Published Stories ({posts.length})</span>
// // // //           </h2>

// // // //           {loadingPosts ? (
// // // //             <div className="py-8 flex justify-center text-gray-400">
// // // //               <Loader2 className="w-6 h-6 animate-spin" />
// // // //             </div>
// // // //           ) : posts.length === 0 ? (
// // // //             <p className="text-xs sm:text-sm text-gray-500 text-center py-6">
// // // //               No stories published yet.
// // // //             </p>
// // // //           ) : (
// // // //             <div className="space-y-3">
// // // //               {posts.map((post) => {
// // // //                 const postId = post._id || post.id || "";
// // // //                 return (
// // // //                   <div
// // // //                     key={postId}
// // // //                     className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 hover:border-gray-200 transition"
// // // //                   >
// // // //                     <div className="flex items-center space-x-3 min-w-0">
// // // //                       {post.imageUrl && (
// // // //                         <img
// // // //                           src={post.imageUrl}
// // // //                           alt={post.title}
// // // //                           className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
// // // //                         />
// // // //                       )}
// // // //                       <div className="min-w-0">
// // // //                         <div className="flex items-center space-x-1.5 mb-0.5">
// // // //                           <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
// // // //                             {post.category}
// // // //                           </span>
// // // //                           {!post.isPublished && (
// // // //                             <span className="bg-amber-100 text-amber-700 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
// // // //                               Draft
// // // //                             </span>
// // // //                           )}
// // // //                         </div>
// // // //                         <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">
// // // //                           {post.title}
// // // //                         </h3>
// // // //                       </div>
// // // //                     </div>

// // // //                     <div className="flex items-center space-x-1 shrink-0">
// // // //                       <button
// // // //                         onClick={() => handleEditClick(post)}
// // // //                         className="p-2 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition"
// // // //                         title="Edit"
// // // //                       >
// // // //                         <Edit3 className="w-4 h-4" />
// // // //                       </button>
// // // //                       <button
// // // //                         onClick={() => handleDelete(postId)}
// // // //                         className="p-2 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition"
// // // //                         title="Delete"
// // // //                       >
// // // //                         <Trash2 className="w-4 h-4" />
// // // //                       </button>
// // // //                     </div>
// // // //                   </div>
// // // //                 );
// // // //               })}
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </main>
// // // //     </div>
// // // //   );
// // // // }

// // // // // import React, { useState, useEffect } from "react";
// // // // // import Swal from "sweetalert2";
// // // // // import {
// // // // //   Send,
// // // // //   Trash2,
// // // // //   Edit3,
// // // // //   Loader2,
// // // // //   X,
// // // // //   FileText,
// // // // //   Image as ImageIcon,
// // // // //   Upload,
// // // // //   Eye,
// // // // // } from "lucide-react";
// // // // // import {
// // // // //   getPosts,
// // // // //   createPost,
// // // // //   updatePost,
// // // // //   deletePost,
// // // // // } from "./services/api";

// // // // // import type { Post } from "./services/api";

// // // // // const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// // // // // // Replace these lines:
// // // // // const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
// // // // // const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "akede_preset";

// // // // // export default function App() {
// // // // //   const [posts, setPosts] = useState<Post[]>([]);
// // // // //   const [loadingPosts, setLoadingPosts] = useState(true);

// // // // //   const [editingId, setEditingId] = useState<string | null>(null);
// // // // //   const [title, setTitle] = useState("");
// // // // //   const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
// // // // //   const [neighbourhood, setNeighbourhood] = useState("");
// // // // //   const [author, setAuthor] = useState("");
// // // // //   const [excerpt, setExcerpt] = useState("");
// // // // //   const [content, setContent] = useState("");
// // // // //   const [imageUrl, setImageUrl] = useState("");
// // // // //   const [isPublished, setIsPublished] = useState(true);

// // // // //   // File Upload State
// // // // //   const [imageFile, setImageFile] = useState<File | null>(null);
// // // // //   const [imagePreview, setImagePreview] = useState<string>("");
// // // // //   const [uploadingImage, setUploadingImage] = useState(false);

// // // // //   // Live Card Preview Toggle
// // // // //   const [showCardPreview, setShowCardPreview] = useState(false);

// // // // //   const [submitting, setSubmitting] = useState(false);

// // // // //   useEffect(() => {
// // // // //     fetchPostsList();
// // // // //   }, []);

// // // // //   const fetchPostsList = async () => {
// // // // //     setLoadingPosts(true);
// // // // //     try {
// // // // //       const data = await getPosts();
// // // // //       setPosts(data);
// // // // //     } catch (err: any) {
// // // // //       console.error("Failed to load posts", err);
// // // // //       Swal.fire({
// // // // //         icon: "error",
// // // // //         title: "Error Loading Posts",
// // // // //         text: err.response?.data?.message || "Failed to fetch posts feed.",
// // // // //         confirmButtonColor: "#10b981",
// // // // //       });
// // // // //     } finally {
// // // // //       setLoadingPosts(false);
// // // // //     }
// // // // //   };

// // // // //   const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // // // //     const file = e.target.files?.[0];
// // // // //     if (file) {
// // // // //       setImageFile(file);
// // // // //       setImagePreview(URL.createObjectURL(file));
// // // // //     }
// // // // //   };

// // // // //   const uploadToCloudinary = async (file: File): Promise<string> => {
// // // // //     const formData = new FormData();
// // // // //     formData.append("file", file);
// // // // //     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

// // // // //     const res = await fetch(
// // // // //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
// // // // //       {
// // // // //         method: "POST",
// // // // //         body: formData,
// // // // //       }
// // // // //     );

// // // // //     if (!res.ok) {
// // // // //       throw new Error("Failed to upload image to Cloudinary");
// // // // //     }

// // // // //     const data = await res.json();
// // // // //     return data.secure_url;
// // // // //   };

// // // // //   const handleEditClick = (post: Post) => {
// // // // //     const targetId = post._id || post.id || "";
// // // // //     setEditingId(targetId);
// // // // //     setTitle(post.title);
// // // // //     setCategory(post.category);
// // // // //     setNeighbourhood(post.neighbourhood || "");
// // // // //     setAuthor(post.author || "Akede Product");
// // // // //     setExcerpt(post.excerpt);
// // // // //     setContent(post.content);
// // // // //     setImageUrl(post.imageUrl || "");
// // // // //     setImagePreview(post.imageUrl || "");
// // // // //     setIsPublished(post.isPublished ?? true);
// // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // //   };

// // // // //   const resetForm = () => {
// // // // //     setEditingId(null);
// // // // //     setTitle("");
// // // // //     setCategory("Neighbourhood");
// // // // //     setNeighbourhood("");
// // // // //     setAuthor("");
// // // // //     setExcerpt("");
// // // // //     setContent("");
// // // // //     setImageUrl("");
// // // // //     setImagePreview("");
// // // // //     setImageFile(null);
// // // // //     setIsPublished(true);
// // // // //   };

// // // // //   const handleDelete = async (id: string) => {
// // // // //     const result = await Swal.fire({
// // // // //       title: "Are you sure?",
// // // // //       text: "You won't be able to revert this deletion!",
// // // // //       icon: "warning",
// // // // //       showCancelButton: true,
// // // // //       confirmButtonColor: "#ef4444",
// // // // //       cancelButtonColor: "#6b7280",
// // // // //       confirmButtonText: "Yes, delete it!",
// // // // //     });

// // // // //     if (!result.isConfirmed) return;

// // // // //     try {
// // // // //       await deletePost(id);
// // // // //       Swal.fire({
// // // // //         icon: "success",
// // // // //         title: "Deleted!",
// // // // //         text: "Post has been deleted successfully.",
// // // // //         timer: 2000,
// // // // //         showConfirmButton: false,
// // // // //       });
// // // // //       fetchPostsList();
// // // // //     } catch (err: any) {
// // // // //       Swal.fire({
// // // // //         icon: "error",
// // // // //         title: "Delete Failed",
// // // // //         text: err.response?.data?.message || "Failed to delete post.",
// // // // //       });
// // // // //     }
// // // // //   };

// // // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // // //     e.preventDefault();
// // // // //     if (!title || !excerpt || !content) {
// // // // //       Swal.fire({
// // // // //         icon: "warning",
// // // // //         title: "Missing Fields",
// // // // //         text: "Title, Excerpt, and Content are required.",
// // // // //       });
// // // // //       return;
// // // // //     }

// // // // //     setSubmitting(true);

// // // // //     try {
// // // // //       let finalImageUrl = imageUrl;

// // // // //       // Upload local image file to Cloudinary if selected
// // // // //       if (imageFile) {
// // // // //         setUploadingImage(true);
// // // // //         finalImageUrl = await uploadToCloudinary(imageFile);
// // // // //         setUploadingImage(false);
// // // // //       }

// // // // //       const payload: Post = {
// // // // //         title,
// // // // //         category,
// // // // //         neighbourhood: neighbourhood || "General",
// // // // //         author: author || "Akede Product",
// // // // //         excerpt,
// // // // //         content,
// // // // //         imageUrl: finalImageUrl.trim() || null,
// // // // //         imageAlt: title,
// // // // //         isPublished,
// // // // //       };

// // // // //       if (editingId) {
// // // // //         await updatePost(editingId, payload);
// // // // //         Swal.fire({
// // // // //           icon: "success",
// // // // //           title: "Post Updated!",
// // // // //           text: "Your neighbourhood post was updated successfully.",
// // // // //           timer: 2500,
// // // // //           showConfirmButton: false,
// // // // //         });
// // // // //       } else {
// // // // //         await createPost(payload);
// // // // //         Swal.fire({
// // // // //           icon: "success",
// // // // //           title: "Published!",
// // // // //           text: "Post successfully published to the neighbourhood feed!",
// // // // //           timer: 2500,
// // // // //           showConfirmButton: false,
// // // // //         });
// // // // //       }
// // // // //       resetForm();
// // // // //       fetchPostsList();
// // // // //     } catch (err: any) {
// // // // //       Swal.fire({
// // // // //         icon: "error",
// // // // //         title: "Action Failed",
// // // // //         text:
// // // // //           err.response?.data?.message ||
// // // // //           err.message ||
// // // // //           "Action failed. Please check your API endpoint or Cloudinary setup.",
// // // // //       });
// // // // //     } finally {
// // // // //       setSubmitting(false);
// // // // //       setUploadingImage(false);
// // // // //     }
// // // // //   };

// // // // //   return (
// // // // //     <div className="min-h-screen bg-akede-bg flex flex-col">
// // // // //       {/* Header */}
// // // // //       <header className="bg-akede-green text-white py-4 px-8 shadow-md flex justify-center items-center border-b-4 border-akede-orange">
// // // // //         <div className="flex items-center space-x-3">
// // // // //           <span className="text-3xl font-black tracking-wider">AKEDE</span>
// // // // //           <span className="bg-akede-lightGreen text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
// // // // //             News Portal
// // // // //           </span>
// // // // //         </div>
// // // // //       </header>

// // // // //       <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
// // // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
// // // // //           <div className="bg-akede-accentGreen p-6 border-b border-green-100 flex justify-between items-center">
// // // // //             <div className="flex items-center flex-col w-full">
// // // // //               <h1 className="text-[45px] font-extrabold text-green-600 text-center">
// // // // //                 {editingId ? "Edit Neighbourhood Post" : "Publish Neighbourhood Story"}
// // // // //               </h1>
// // // // //               <p className="text-sm text-gray-600 mt-1 text-center">
// // // // //                 Create announcements, safety tips, and neighbourhood updates.
// // // // //               </p>
// // // // //             </div>
// // // // //             {editingId && (
// // // // //               <button
// // // // //                 onClick={resetForm}
// // // // //                 className="shrink-0 flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
// // // // //               >
// // // // //                 <X className="w-3.5 h-3.5" />
// // // // //                 <span>Cancel Edit</span>
// // // // //               </button>
// // // // //             )}
// // // // //           </div>

// // // // //           <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
// // // // //             <div className="flex flex-col items-center">
// // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-3">
// // // // //                 Post Category <span className="text-red-600"> * </span>
// // // // //               </label>
// // // // //               <div className="flex flex-wrap gap-2 justify-center">
// // // // //                 {CATEGORIES.map((cat) => (
// // // // //                   <button
// // // // //                     key={cat}
// // // // //                     type="button"
// // // // //                     onClick={() => setCategory(cat)}
// // // // //                     className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
// // // // //                       category === cat
// // // // //                         ? "bg-akede-green text-white border-akede-green"
// // // // //                         : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
// // // // //                     }`}
// // // // //                   >
// // // // //                     {cat}
// // // // //                   </button>
// // // // //                 ))}
// // // // //               </div>
// // // // //             </div>

// // // // //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// // // // //               <div>
// // // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // //                   Title *
// // // // //                 </label>
// // // // //                 <input
// // // // //                   type="text"
// // // // //                   placeholder="e.g. How Magodo Phase 2 cut response time"
// // // // //                   value={title}
// // // // //                   onChange={(e) => setTitle(e.target.value)}
// // // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // //                   required
// // // // //                 />
// // // // //               </div>

// // // // //               <div>
// // // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // //                   Target Neighbourhood
// // // // //                 </label>
// // // // //                 <input
// // // // //                   type="text"
// // // // //                   placeholder="e.g. Lekki Phase 1"
// // // // //                   value={neighbourhood}
// // // // //                   onChange={(e) => setNeighbourhood(e.target.value)}
// // // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // //                 />
// // // // //               </div>
// // // // //             </div>

// // // // //             {/* Featured Image & Cloudinary Section */}
// // // // //             <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
// // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green">
// // // // //                 Featured Cover Image
// // // // //               </label>

// // // // //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
// // // // //                 <div>
// // // // //                   <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-akede-green bg-white cursor-pointer transition">
// // // // //                     <Upload className="w-6 h-6 text-gray-400 mb-1" />
// // // // //                     <span className="text-xs text-gray-600 font-medium">
// // // // //                       Upload from computer
// // // // //                     </span>
// // // // //                     <span className="text-[10px] text-gray-400">PNG, JPG, WEBP</span>
// // // // //                     <input
// // // // //                       type="file"
// // // // //                       accept="image/*"
// // // // //                       onChange={handleImageFileChange}
// // // // //                       className="hidden"
// // // // //                     />
// // // // //                   </label>

// // // // //                   <p className="text-[11px] text-gray-400 text-center my-2 font-bold">— OR —</p>

// // // // //                   <input
// // // // //                     type="text"
// // // // //                     placeholder="Paste direct Cloudinary/Image URL..."
// // // // //                     value={imageUrl}
// // // // //                     onChange={(e) => {
// // // // //                       setImageUrl(e.target.value);
// // // // //                       setImagePreview(e.target.value);
// // // // //                     }}
// // // // //                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none"
// // // // //                   />
// // // // //                 </div>

// // // // //                 {/* Preview Box */}
// // // // //                 <div className="relative w-full h-36 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
// // // // //                   {imagePreview ? (
// // // // //                     <>
// // // // //                       <img
// // // // //                         src={imagePreview}
// // // // //                         alt="Cover Preview"
// // // // //                         className="w-full h-full object-cover"
// // // // //                       />
// // // // //                       <button
// // // // //                         type="button"
// // // // //                         onClick={() => {
// // // // //                           setImageFile(null);
// // // // //                           setImagePreview("");
// // // // //                           setImageUrl("");
// // // // //                         }}
// // // // //                         className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-rose-600 transition"
// // // // //                       >
// // // // //                         <X className="w-4 h-4" />
// // // // //                       </button>
// // // // //                     </>
// // // // //                   ) : (
// // // // //                     <div className="text-center text-gray-400 space-y-1">
// // // // //                       <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
// // // // //                       <p className="text-xs">No image selected</p>
// // // // //                     </div>
// // // // //                   )}
// // // // //                 </div>
// // // // //               </div>
// // // // //             </div>

// // // // //             <div>
// // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // //                 Author
// // // // //               </label>
// // // // //               <input
// // // // //                 type="text"
// // // // //                 placeholder="e.g. Akede Product"
// // // // //                 value={author}
// // // // //                 onChange={(e) => setAuthor(e.target.value)}
// // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // //               />
// // // // //             </div>

// // // // //             <div>
// // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // //                 Excerpt (Card Summary) *
// // // // //               </label>
// // // // //               <input
// // // // //                 type="text"
// // // // //                 placeholder="Brief 1-2 sentence preview for the card layout..."
// // // // //                 value={excerpt}
// // // // //                 onChange={(e) => setExcerpt(e.target.value)}
// // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // //                 required
// // // // //               />
// // // // //             </div>

// // // // //             <div>
// // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // //                 Full Content *
// // // // //               </label>
// // // // //               <textarea
// // // // //                 rows={5}
// // // // //                 placeholder="Detailed story content..."
// // // // //                 value={content}
// // // // //                 onChange={(e) => setContent(e.target.value)}
// // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm resize-none"
// // // // //                 required
// // // // //               />
// // // // //             </div>

// // // // //             <div className="flex items-center justify-between py-1">
// // // // //               <div className="flex items-center space-x-3">
// // // // //                 <input
// // // // //                   type="checkbox"
// // // // //                   id="isPublished"
// // // // //                   checked={isPublished}
// // // // //                   onChange={(e) => setIsPublished(e.target.checked)}
// // // // //                   className="w-4 h-4 rounded border-gray-300 text-akede-green focus:ring-akede-green cursor-pointer"
// // // // //                 />
// // // // //                 <label
// // // // //                   htmlFor="isPublished"
// // // // //                   className="text-xs font-bold uppercase tracking-wider text-gray-700 cursor-pointer"
// // // // //                 >
// // // // //                   Publish immediately to neighbourhood feed
// // // // //                 </label>
// // // // //               </div>

// // // // //               {/* Toggle Live Preview Modal Button */}
// // // // //               <button
// // // // //                 type="button"
// // // // //                 onClick={() => setShowCardPreview(!showCardPreview)}
// // // // //                 className="flex items-center space-x-1 text-xs font-bold text-akede-green hover:underline cursor-pointer"
// // // // //               >
// // // // //                 <Eye className="w-4 h-4" />
// // // // //                 <span>{showCardPreview ? "Hide Preview" : "Preview Feed Card"}</span>
// // // // //               </button>
// // // // //             </div>

// // // // //             {/* Live Feed Card Preview Box */}
// // // // //             {showCardPreview && (
// // // // //               <div className="p-4 bg-gray-100 rounded-2xl border border-gray-200 space-y-2">
// // // // //                 <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
// // // // //                   Live Feed Card Preview
// // // // //                 </p>
// // // // //                 <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-w-sm mx-auto">
// // // // //                   {imagePreview && (
// // // // //                     <img
// // // // //                       src={imagePreview}
// // // // //                       alt="Card preview"
// // // // //                       className="w-full h-44 object-cover"
// // // // //                     />
// // // // //                   )}
// // // // //                   <div className="p-4 space-y-2">
// // // // //                     <div className="flex items-center space-x-2">
// // // // //                       <span className="bg-akede-accentGreen text-akede-green text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
// // // // //                         {category}
// // // // //                       </span>
// // // // //                       <span className="text-xs text-gray-400">
// // // // //                         {neighbourhood || "General"}
// // // // //                       </span>
// // // // //                     </div>
// // // // //                     <h3 className="font-bold text-gray-900 text-base leading-snug">
// // // // //                       {title || "Post Title Preview"}
// // // // //                     </h3>
// // // // //                     <p className="text-xs text-gray-600 line-clamp-2">
// // // // //                       {excerpt || "Your card summary excerpt will appear here..."}
// // // // //                     </p>
// // // // //                     <div className="pt-2 text-[10px] text-gray-400 font-medium">
// // // // //                       By {author || "Akede Product"}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>
// // // // //             )}

// // // // //             <button
// // // // //               type="submit"
// // // // //               disabled={submitting || uploadingImage}
// // // // //               className="w-full bg-akede-green hover:bg-akede-lightGreen text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
// // // // //             >
// // // // //               {submitting || uploadingImage ? (
// // // // //                 <>
// // // // //                   <Loader2 className="w-5 h-5 animate-spin" />
// // // // //                   <span>
// // // // //                     {uploadingImage ? "Uploading Image to Cloudinary..." : "Saving Post..."}
// // // // //                   </span>
// // // // //                 </>
// // // // //               ) : editingId ? (
// // // // //                 <>
// // // // //                   <Edit3 className="w-4 h-4 text-akede-orange" />
// // // // //                   <span>Update Post</span>
// // // // //                 </>
// // // // //               ) : (
// // // // //                 <>
// // // // //                   <Send className="w-4 h-4 text-akede-orange" />
// // // // //                   <span>Publish to Neighbourhood</span>
// // // // //                 </>
// // // // //               )}
// // // // //             </button>
// // // // //           </form>
// // // // //         </div>

// // // // //         {/* List Section */}
// // // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
// // // // //           <h2 className="text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
// // // // //             <FileText className="w-5 h-5 text-akede-orange" />
// // // // //             <span>Published Posts ({posts.length})</span>
// // // // //           </h2>

// // // // //           {loadingPosts ? (
// // // // //             <div className="py-12 flex justify-center text-gray-400">
// // // // //               <Loader2 className="w-6 h-6 animate-spin" />
// // // // //             </div>
// // // // //           ) : posts.length === 0 ? (
// // // // //             <p className="text-sm text-gray-500 text-center py-8">
// // // // //               No posts found. Publish your first update above!
// // // // //             </p>
// // // // //           ) : (
// // // // //             <div className="space-y-4">
// // // // //               {posts.map((post) => {
// // // // //                 const postId = post._id || post.id || "";
// // // // //                 return (
// // // // //                   <div
// // // // //                     key={postId}
// // // // //                     className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 transition"
// // // // //                   >
// // // // //                     <div className="flex items-start space-x-4">
// // // // //                       {post.imageUrl && (
// // // // //                         <img
// // // // //                           src={post.imageUrl}
// // // // //                           alt={post.title}
// // // // //                           className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0 hidden sm:block"
// // // // //                         />
// // // // //                       )}
// // // // //                       <div className="space-y-1">
// // // // //                         <div className="flex items-center space-x-2">
// // // // //                           <span className="bg-akede-accentGreen text-akede-green text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
// // // // //                             {post.category}
// // // // //                           </span>
// // // // //                           <span className="text-xs text-gray-400">
// // // // //                             {post.neighbourhood}
// // // // //                           </span>
// // // // //                           {!post.isPublished && (
// // // // //                             <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
// // // // //                               Draft
// // // // //                             </span>
// // // // //                           )}
// // // // //                         </div>
// // // // //                         <h3 className="font-bold text-gray-800 text-sm">{post.title}</h3>
// // // // //                         <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt}</p>
// // // // //                       </div>
// // // // //                     </div>

// // // // //                     <div className="flex items-center space-x-2 shrink-0">
// // // // //                       <button
// // // // //                         onClick={() => handleEditClick(post)}
// // // // //                         className="p-2 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition cursor-pointer"
// // // // //                         title="Edit Post"
// // // // //                       >
// // // // //                         <Edit3 className="w-4 h-4" />
// // // // //                       </button>
// // // // //                       <button
// // // // //                         onClick={() => handleDelete(postId)}
// // // // //                         className="p-2 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition cursor-pointer"
// // // // //                         title="Delete Post"
// // // // //                       >
// // // // //                         <Trash2 className="w-4 h-4" />
// // // // //                       </button>
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 );
// // // // //               })}
// // // // //             </div>
// // // // //           )}
// // // // //         </div>
// // // // //       </main>
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // // import React, { useState, useEffect } from "react";
// // // // // // import Swal from "sweetalert2";
// // // // // // import {
// // // // // //   Send,
// // // // // //   Trash2,
// // // // // //   Edit3,
// // // // // //   Loader2,
// // // // // //   X,
// // // // // //   FileText,
// // // // // //   // Image as ImageIcon,
// // // // // // } from "lucide-react";
// // // // // // import {
// // // // // //   getPosts,
// // // // // //   createPost,
// // // // // //   updatePost,
// // // // // //   deletePost,
// // // // // // } from "./services/api";

// // // // // // import type { Post } from "./services/api";

// // // // // // const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// // // // // // export default function App() {
// // // // // //   const [posts, setPosts] = useState<Post[]>([]);
// // // // // //   const [loadingPosts, setLoadingPosts] = useState(true);

// // // // // //   const [editingId, setEditingId] = useState<string | null>(null);
// // // // // //   const [title, setTitle] = useState("");
// // // // // //   const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
// // // // // //   const [neighbourhood, setNeighbourhood] = useState("");
// // // // // //   const [author, setAuthor] = useState("");
// // // // // //   const [excerpt, setExcerpt] = useState("");
// // // // // //   const [content, setContent] = useState("");
// // // // // //   // const [imageUrl, setImageUrl] = useState("");
// // // // // //   const [isPublished, setIsPublished] = useState(true);

// // // // // //   const [submitting, setSubmitting] = useState(false);

// // // // // //   useEffect(() => {
// // // // // //     fetchPostsList();
// // // // // //   }, []);

// // // // // //   const fetchPostsList = async () => {
// // // // // //     setLoadingPosts(true);
// // // // // //     try {
// // // // // //       const data = await getPosts();
// // // // // //       setPosts(data);
// // // // // //     } catch (err: any) {
// // // // // //       console.error("Failed to load posts", err);
// // // // // //       Swal.fire({
// // // // // //         icon: "error",
// // // // // //         title: "Error Loading Posts",
// // // // // //         text: err.response?.data?.message || "Failed to fetch posts feed.",
// // // // // //         confirmButtonColor: "#10b981",
// // // // // //       });
// // // // // //     } finally {
// // // // // //       setLoadingPosts(false);
// // // // // //     }
// // // // // //   };

// // // // // //   const handleEditClick = (post: Post) => {
// // // // // //     const targetId = post._id || post.id || "";
// // // // // //     setEditingId(targetId);
// // // // // //     setTitle(post.title);
// // // // // //     setCategory(post.category);
// // // // // //     setNeighbourhood(post.neighbourhood || "");
// // // // // //     setAuthor(post.author || "Akede Product");
// // // // // //     setExcerpt(post.excerpt);
// // // // // //     setContent(post.content);
// // // // // //     // setImageUrl(post.imageUrl || "");
// // // // // //     setIsPublished(post.isPublished ?? true);
// // // // // //     window.scrollTo({ top: 0, behavior: "smooth" });
// // // // // //   };

// // // // // //   const resetForm = () => {
// // // // // //     setEditingId(null);
// // // // // //     setTitle("");
// // // // // //     setCategory("Neighbourhood");
// // // // // //     setNeighbourhood("");
// // // // // //     setAuthor("");
// // // // // //     setExcerpt("");
// // // // // //     setContent("");
// // // // // //     // setImageUrl("");
// // // // // //     setIsPublished(true);
// // // // // //   };

// // // // // //   const handleDelete = async (id: string) => {
// // // // // //     const result = await Swal.fire({
// // // // // //       title: "Are you sure?",
// // // // // //       text: "You won't be able to revert this deletion!",
// // // // // //       icon: "warning",
// // // // // //       showCancelButton: true,
// // // // // //       confirmButtonColor: "#ef4444",
// // // // // //       cancelButtonColor: "#6b7280",
// // // // // //       confirmButtonText: "Yes, delete it!",
// // // // // //     });

// // // // // //     if (!result.isConfirmed) return;

// // // // // //     try {
// // // // // //       await deletePost(id);
// // // // // //       Swal.fire({
// // // // // //         icon: "success",
// // // // // //         title: "Deleted!",
// // // // // //         text: "Post has been deleted successfully.",
// // // // // //         timer: 2000,
// // // // // //         showConfirmButton: false,
// // // // // //       });
// // // // // //       fetchPostsList();
// // // // // //     } catch (err: any) {
// // // // // //       Swal.fire({
// // // // // //         icon: "error",
// // // // // //         title: "Delete Failed",
// // // // // //         text: err.response?.data?.message || "Failed to delete post.",
// // // // // //       });
// // // // // //     }
// // // // // //   };

// // // // // //   const handleSubmit = async (e: React.FormEvent) => {
// // // // // //     e.preventDefault();
// // // // // //     if (!title || !excerpt || !content) {
// // // // // //       Swal.fire({
// // // // // //         icon: "warning",
// // // // // //         title: "Missing Fields",
// // // // // //         text: "Title, Excerpt, and Content are required.",
// // // // // //       });
// // // // // //       return;
// // // // // //     }

// // // // // //     setSubmitting(true);

// // // // // //     const payload: Post = {
// // // // // //       title,
// // // // // //       category,
// // // // // //       neighbourhood: neighbourhood || "General",
// // // // // //       author: author || "Akede Product",
// // // // // //       excerpt,
// // // // // //       content,
// // // // // //       // imageUrl: imageUrl.trim() || null,
// // // // // //       imageAlt: title,
// // // // // //       isPublished,
// // // // // //     };

// // // // // //     try {
// // // // // //       if (editingId) {
// // // // // //         await updatePost(editingId, payload);
// // // // // //         Swal.fire({
// // // // // //           icon: "success",
// // // // // //           title: "Post Updated!",
// // // // // //           text: "Your neighbourhood post was updated successfully.",
// // // // // //           timer: 2500,
// // // // // //           showConfirmButton: false,
// // // // // //         });
// // // // // //       } else {
// // // // // //         await createPost(payload);
// // // // // //         Swal.fire({
// // // // // //           icon: "success",
// // // // // //           title: "Published!",
// // // // // //           text: "Post successfully published to the neighbourhood feed!",
// // // // // //           timer: 2500,
// // // // // //           showConfirmButton: false,
// // // // // //         });
// // // // // //       }
// // // // // //       resetForm();
// // // // // //       fetchPostsList();
// // // // // //     } catch (err: any) {
// // // // // //       Swal.fire({
// // // // // //         icon: "error",
// // // // // //         title: "Action Failed",
// // // // // //         text:
// // // // // //           err.response?.data?.message ||
// // // // // //           "Action failed. Please check your API endpoint or backend status.",
// // // // // //       });
// // // // // //     } finally {
// // // // // //       setSubmitting(false);
// // // // // //     }
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="min-h-screen bg-akede-bg flex flex-col">
// // // // // //       {/* Header */}
// // // // // //       <header className="bg-akede-green text-white py-4 px-8 shadow-md flex justify-center items-center border-b-4 border-akede-orange">
// // // // // //         <div className="flex items-center space-x-3">
// // // // // //           <span className="text-3xl font-black tracking-wider">AKEDE</span>
// // // // // //           <span className="bg-akede-lightGreen text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-akede-accentGreen">
// // // // // //             News Portal
// // // // // //           </span>
// // // // // //         </div>
// // // // // //       </header>

// // // // // //       <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
// // // // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
// // // // // //           <div className="bg-akede-accentGreen p-6 border-b border-green-100 flex justify-between items-center">
// // // // // //             <div className="flex items-center flex-col w-full">
// // // // // //               <h1 className="text-[45px] font-extrabold text-green-600 text-center">
// // // // // //                 {editingId ? "Edit Neighbourhood Post" : "Publish Neighbourhood Story"}
// // // // // //               </h1>
// // // // // //               <p className="text-sm text-gray-600 mt-1 text-center">
// // // // // //                 Create announcements, safety tips, and neighbourhood updates.
// // // // // //               </p>
// // // // // //             </div>
// // // // // //             {editingId && (
// // // // // //               <button
// // // // // //                 onClick={resetForm}
// // // // // //                 className="shrink-0 flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
// // // // // //               >
// // // // // //                 <X className="w-3.5 h-3.5" />
// // // // // //                 <span>Cancel Edit</span>
// // // // // //               </button>
// // // // // //             )}
// // // // // //           </div>

// // // // // //           <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
// // // // // //             <div className="flex flex-col items-center">
// // // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-3">
// // // // // //                 Post Category <span className="text-red-600"> * </span>
// // // // // //               </label>
// // // // // //               <div className="flex flex-wrap gap-2 justify-center">
// // // // // //                 {CATEGORIES.map((cat) => (
// // // // // //                   <button
// // // // // //                     key={cat}
// // // // // //                     type="button"
// // // // // //                     onClick={() => setCategory(cat)}
// // // // // //                     className={`px-4 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
// // // // // //                       category === cat
// // // // // //                         ? "bg-akede-green text-white border-akede-green"
// // // // // //                         : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
// // // // // //                     }`}
// // // // // //                   >
// // // // // //                     {cat}
// // // // // //                   </button>
// // // // // //                 ))}
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// // // // // //               <div>
// // // // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // // //                   Title *
// // // // // //                 </label>
// // // // // //                 <input
// // // // // //                   type="text"
// // // // // //                   placeholder="e.g. How Magodo Phase 2 cut response time"
// // // // // //                   value={title}
// // // // // //                   onChange={(e) => setTitle(e.target.value)}
// // // // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // // //                   required
// // // // // //                 />
// // // // // //               </div>

// // // // // //               <div>
// // // // // //                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // // //                   Target Neighbourhood
// // // // // //                 </label>
// // // // // //                 <input
// // // // // //                   type="text"
// // // // // //                   placeholder="e.g. Lekki Phase 1"
// // // // // //                   value={neighbourhood}
// // // // // //                   onChange={(e) => setNeighbourhood(e.target.value)}
// // // // // //                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // // //                 />
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             <div>
// // // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // // //                 Author
// // // // // //               </label>
// // // // // //               <input
// // // // // //                 type="text"
// // // // // //                 placeholder="e.g. Akede Product"
// // // // // //                 value={author}
// // // // // //                 onChange={(e) => setAuthor(e.target.value)}
// // // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // // //               />
// // // // // //             </div>

// // // // // //             <div>
// // // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // // //                 Excerpt (Card Summary) *
// // // // // //               </label>
// // // // // //               <input
// // // // // //                 type="text"
// // // // // //                 placeholder="Brief 1-2 sentence preview for the card layout..."
// // // // // //                 value={excerpt}
// // // // // //                 onChange={(e) => setExcerpt(e.target.value)}
// // // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm"
// // // // // //                 required
// // // // // //               />
// // // // // //             </div>

// // // // // //             <div>
// // // // // //               <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-2">
// // // // // //                 Full Content *
// // // // // //               </label>
// // // // // //               <textarea
// // // // // //                 rows={5}
// // // // // //                 placeholder="Detailed story content..."
// // // // // //                 value={content}
// // // // // //                 onChange={(e) => setContent(e.target.value)}
// // // // // //                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-akede-green text-sm resize-none"
// // // // // //                 required
// // // // // //               />
// // // // // //             </div>

// // // // // //             <div className="flex items-center space-x-3 py-1">
// // // // // //               <input
// // // // // //                 type="checkbox"
// // // // // //                 id="isPublished"
// // // // // //                 checked={isPublished}
// // // // // //                 onChange={(e) => setIsPublished(e.target.checked)}
// // // // // //                 className="w-4 h-4 rounded border-gray-300 text-akede-green focus:ring-akede-green cursor-pointer"
// // // // // //               />
// // // // // //               <label htmlFor="isPublished" className="text-xs font-bold uppercase tracking-wider text-gray-700 cursor-pointer">
// // // // // //                 Publish immediately to neighbourhood feed
// // // // // //               </label>
// // // // // //             </div>

// // // // // //             <button
// // // // // //               type="submit"
// // // // // //               disabled={submitting}
// // // // // //               className="w-full bg-akede-green hover:bg-akede-lightGreen text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
// // // // // //             >
// // // // // //               {submitting ? (
// // // // // //                 <Loader2 className="w-5 h-5 animate-spin" />
// // // // // //               ) : editingId ? (
// // // // // //                 <>
// // // // // //                   <Edit3 className="w-4 h-4 text-akede-orange" />
// // // // // //                   <span>Update Post</span>
// // // // // //                 </>
// // // // // //               ) : (
// // // // // //                 <>
// // // // // //                   <Send className="w-4 h-4 text-akede-orange" />
// // // // // //                   <span>Publish to Neighbourhood</span>
// // // // // //                 </>
// // // // // //               )}
// // // // // //             </button>
// // // // // //           </form>
// // // // // //         </div>

// // // // // //         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
// // // // // //           <h2 className="text-lg font-extrabold text-akede-green mb-4 flex items-center space-x-2">
// // // // // //             <FileText className="w-5 h-5 text-akede-orange" />
// // // // // //             <span>Published Posts ({posts.length})</span>
// // // // // //           </h2>

// // // // // //           {loadingPosts ? (
// // // // // //             <div className="py-12 flex justify-center text-gray-400">
// // // // // //               <Loader2 className="w-6 h-6 animate-spin" />
// // // // // //             </div>
// // // // // //           ) : posts.length === 0 ? (
// // // // // //             <p className="text-sm text-gray-500 text-center py-8">
// // // // // //               No posts found. Publish your first update above!
// // // // // //             </p>
// // // // // //           ) : (
// // // // // //             <div className="space-y-4">
// // // // // //               {posts.map((post) => {
// // // // // //                 const postId = post._id || post.id || "";
// // // // // //                 return (
// // // // // //                   <div
// // // // // //                     key={postId}
// // // // // //                     className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 transition"
// // // // // //                   >
// // // // // //                     <div className="flex items-start space-x-4">
// // // // // //                       {post.imageUrl && (
// // // // // //                         <img
// // // // // //                           src={post.imageUrl}
// // // // // //                           alt={post.title}
// // // // // //                           className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0 hidden sm:block"
// // // // // //                         />
// // // // // //                       )}
// // // // // //                       <div className="space-y-1">
// // // // // //                         <div className="flex items-center space-x-2">
// // // // // //                           <span className="bg-akede-accentGreen text-akede-green text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
// // // // // //                             {post.category}
// // // // // //                           </span>
// // // // // //                           <span className="text-xs text-gray-400">
// // // // // //                             {post.neighbourhood}
// // // // // //                           </span>
// // // // // //                           {!post.isPublished && (
// // // // // //                             <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
// // // // // //                               Draft
// // // // // //                             </span>
// // // // // //                           )}
// // // // // //                         </div>
// // // // // //                         <h3 className="font-bold text-gray-800 text-sm">{post.title}</h3>
// // // // // //                         <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt}</p>
// // // // // //                       </div>
// // // // // //                     </div>

// // // // // //                     <div className="flex items-center space-x-2 shrink-0">
// // // // // //                       <button
// // // // // //                         onClick={() => handleEditClick(post)}
// // // // // //                         className="p-2 bg-white text-gray-600 hover:text-akede-green rounded-lg border border-gray-200 transition cursor-pointer"
// // // // // //                         title="Edit Post"
// // // // // //                       >
// // // // // //                         <Edit3 className="w-4 h-4" />
// // // // // //                       </button>
// // // // // //                       <button
// // // // // //                         onClick={() => handleDelete(postId)}
// // // // // //                         className="p-2 bg-white text-gray-600 hover:text-rose-600 rounded-lg border border-gray-200 transition cursor-pointer"
// // // // // //                         title="Delete Post"
// // // // // //                       >
// // // // // //                         <Trash2 className="w-4 h-4" />
// // // // // //                       </button>
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 );
// // // // // //               })}
// // // // // //             </div>
// // // // // //           )}
// // // // // //         </div>
// // // // // //       </main>
// // // // // //     </div>
// // // // // //   );
// // // // // // }
