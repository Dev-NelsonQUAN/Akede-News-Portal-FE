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
  Tag,
  MapPin,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import { getPosts, createPost, updatePost, deletePost } from "./services/api";

import type { Post } from "./services/api";

const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

const LGA_OPTIONS = [
  "Ajeromi-Ifelodun",
  "Amuwo-Odofin",
  "Oshodi-Isolo",
] as const;

export type LGAType = (typeof LGA_OPTIONS)[number];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "";

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Post["category"]>("Neighbourhood");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [author, setAuthor] = useState("Akede News Desk");
  const [source, setSource] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [lgaTag, setLgaTag] = useState<LGAType | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/^#/, "");
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
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
      throw new Error("Failed to upload image.");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleEditClick = (post: any) => {
    const targetId = post._id || post.id || "";
    setEditingId(targetId);
    setTitle(post.title || "");
    setCategory(post.category || "Neighbourhood");
    setNeighbourhood(post.neighbourhood || "");
    setAuthor(post.author || "Akede News Desk");
    setSource(post.source || "");
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setImageUrl(post.imageUrl || "");
    setImagePreview(post.imageUrl || "");
    setLgaTag(post.lgaTag || "");
    setTags(post.tags || []);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Neighbourhood");
    setNeighbourhood("");
    setAuthor("Akede News Desk");
    setSource("");
    setExcerpt("");
    setContent("");
    setImageUrl("");
    setImagePreview("");
    setImageFile(null);
    setLgaTag("");
    setTags([]);
    setTagInput("");
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

    if (!lgaTag) {
      Swal.fire({
        icon: "warning",
        title: "Target LGA Required",
        text: "Please select a target LGA for this story.",
      });
      return;
    }

    if (wordCount > 200) {
      Swal.fire({
        icon: "warning",
        title: "Word Limit Exceeded",
        text: "Story content must be kept under 200 words.",
      });
      return;
    }

    if (!title || !excerpt || !content) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in the title, summary, and story content.",
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

      const payload: any = {
        title,
        category,
        neighbourhood: neighbourhood.trim() || null,
        author: author || "Akede News Desk",
        source: source.trim() || "Online Media",
        excerpt,
        content,
        imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
        imageAlt: title,
        isPublished: true,
        lgaTag,
        tags,
      };

      if (editingId) {
        await updatePost(editingId, payload);
        Swal.fire({
          icon: "success",
          title: "Post Updated!",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createPost(payload);
        Swal.fire({
          icon: "success",
          title: "Published!",
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
        text: err.response?.data?.message || err.message || "Could not save post.",
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
              <img
                src="/LogoMarkWhite.png"
                alt="Akede Logo"
                className="w-full h-8 object-fill"
              />
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
              {/* Category */}
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

              {/* Title & Specific Area */}
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
                    Specific Area / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Festac Phase 1, Apple Junction"
                    value={neighbourhood}
                    onChange={(e) => setNeighbourhood(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  />
                </div>
              </div>

              {/* Target LGA Selection */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Target LGA (Mandatory) *
                </label>
                <select
                  value={lgaTag}
                  onChange={(e) => setLgaTag(e.target.value as LGAType)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm bg-white"
                  required
                >
                  <option value="">-- Select Target LGA --</option>
                  {LGA_OPTIONS.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author & Source Details */}
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                    Author / Desk
                  </label>
                  <input
                    type="text"
                    placeholder="Akede News Desk"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                    Source Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Festac Online"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
                  Niche Tags (Press Enter or Comma)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Add tags (e.g. traffic, market, power)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-rose-600 ml-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Photo Upload */}
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

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
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
                        Click to upload{" "}
                        <span className="font-normal text-gray-500">
                          or drag & drop
                        </span>
                      </p>
                      <p className="text-[11px] font-medium text-gray-400">
                        PNG, JPG, WEBP or GIF
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

              {/* Excerpt */}
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

              {/* Content */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-akede-green">
                    Full Story *
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      wordCount > 200 ? "text-rose-600" : "text-gray-400"
                    }`}
                  >
                    {wordCount} / 200 words
                  </span>
                </div>
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
                className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {submitting || uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
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

          {/* Sidebar Area */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Live Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-akede-green">
                  Live Card Preview
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 space-y-1">
                    <ImageIcon className="w-7 h-7 stroke-1" />
                    <span className="text-[11px] font-medium">No image</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                    {lgaTag && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5" />
                        {lgaTag}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                    {title || "Story Title..."}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {excerpt || "Card summary snippet..."}
                  </p>

                  {/* Source & Location Meta */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                    <span>
                      {neighbourhood ? `${neighbourhood}, ${lgaTag || "LGA"}` : lgaTag || "General LGA News"}
                    </span>
                    {source && (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <LinkIcon className="w-2.5 h-2.5" />
                        {source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Published Feed List */}
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
                <p className="text-xs text-gray-500 text-center py-6">
                  No stories published yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-112.5 overflow-y-auto pr-1">
                  {posts.map((post: any) => {
                    const postId = post._id || post.id || "";
                    return (
                      <div
                        key={postId}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3"
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
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="bg-akede-accentGreen text-akede-green text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block">
                                {post.category}
                              </span>
                              {post.lgaTag && (
                                <span className="text-[9px] text-gray-500 font-bold truncate">
                                  • {post.lgaTag}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {post.title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditClick(post)}
                            className="p-1.5 text-gray-500 hover:text-akede-green hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(postId)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition cursor-pointer"
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
//   UploadCloud,
//   RefreshCw,
//   Tag,
//   MapPin,
//   Globe,
// } from "lucide-react";
// import { getPosts, createPost, updatePost, deletePost } from "./services/api";

// import type { Post } from "./services/api";

// const CATEGORIES = ["Neighbourhood", "Safety", "Alerts", "Emergency"] as const;

// const LGA_OPTIONS = [
//   "Ajeromi-Ifelodun",
//   "Amuwo-Odofin",
//   "Oshodi-Isolo",
// ] as const;

// export type LGAType = (typeof LGA_OPTIONS)[number];

// const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
// const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "";

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

//   const [lgaTag, setLgaTag] = useState<LGAType | "">("");
//   const [tags, setTags] = useState<string[]>([]);
//   const [tagInput, setTagInput] = useState("");

//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string>("");
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   const [isDragging, setIsDragging] = useState(false);

//   const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

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

//   const processSelectedFile = (file?: File) => {
//     if (file && file.type.startsWith("image/")) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     processSelectedFile(file);
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);

//     const file = e.dataTransfer.files?.[0];
//     processSelectedFile(file);
//   };

//   const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
//       e.preventDefault();
//       const cleaned = tagInput.trim().toLowerCase().replace(/^#/, "");
//       if (cleaned && !tags.includes(cleaned)) {
//         setTags([...tags, cleaned]);
//       }
//       setTagInput("");
//     }
//   };

//   const handleRemoveTag = (tagToRemove: string) => {
//     setTags(tags.filter((t) => t !== tagToRemove));
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
//       },
//     );

//     if (!res.ok) {
//       throw new Error("Failed to upload image.");
//     }

//     const data = await res.json();
//     return data.secure_url;
//   };

//   const handleEditClick = (post: any) => {
//     const targetId = post._id || post.id || "";
//     setEditingId(targetId);
//     setTitle(post.title || "");
//     setCategory(post.category || "Neighbourhood");
//     setNeighbourhood(post.neighbourhood || "");
//     setAuthor(post.author || "Akede Team");
//     setExcerpt(post.excerpt || "");
//     setContent(post.content || "");
//     setImageUrl(post.imageUrl || "");
//     setImagePreview(post.imageUrl || "");
//     setLgaTag(post.lgaTag || "");
//     setTags(post.tags || []);
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
//     setLgaTag("");
//     setTags([]);
//     setTagInput("");
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

//     if (!lgaTag) {
//       Swal.fire({
//         icon: "warning",
//         title: "Target LGA Required",
//         text: "Please select a target LGA for this story.",
//       });
//       return;
//     }

//     if (wordCount > 200) {
//       Swal.fire({
//         icon: "warning",
//         title: "Word Limit Exceeded",
//         text: "Story content must be kept under 200 words.",
//       });
//       return;
//     }

//     if (!title || !excerpt || !content) {
//       Swal.fire({
//         icon: "warning",
//         title: "Missing Information",
//         text: "Please fill in the title, summary, and story content.",
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

//       const payload: any = {
//         title,
//         category,
//         neighbourhood: neighbourhood.trim() || null,
//         author: author || "Akede Team",
//         excerpt,
//         content,
//         imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
//         imageAlt: title,
//         isPublished: true,
//         lgaTag,
//         tags,
//       };

//       if (editingId) {
//         await updatePost(editingId, payload);
//         Swal.fire({
//           icon: "success",
//           title: "Post Updated!",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       } else {
//         await createPost(payload);
//         Swal.fire({
//           icon: "success",
//           title: "Published!",
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
//         text: err.response?.data?.message || err.message || "Could not save post.",
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
//               <img
//                 src="/LogoMarkWhite.png"
//                 alt="Akede Logo"
//                 className="w-full h-8 object-fill"
//               />
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
//                   className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-rose-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition cursor-pointer"
//                 >
//                   <X className="w-4 h-4" />
//                   <span>Cancel</span>
//                 </button>
//               )}
//             </div>

//             <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
//               {/* Category */}
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
//                       className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border active:scale-95 cursor-pointer ${
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

//               {/* Title & Specific Area */}
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
//                     Specific Area / Landmark (Optional)
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g. Festac Phase 1, Apple Junction"
//                     value={neighbourhood}
//                     onChange={(e) => setNeighbourhood(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                   />
//                 </div>
//               </div>

//               {/* Target LGA Selection */}
//               <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
//                 <label className="block text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
//                   <MapPin className="w-4 h-4 text-emerald-600" />
//                   Target LGA (Mandatory) *
//                 </label>
//                 <select
//                   value={lgaTag}
//                   onChange={(e) => setLgaTag(e.target.value as LGAType)}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm bg-white"
//                   required
//                 >
//                   <option value="">-- Select Target LGA --</option>
//                   {LGA_OPTIONS.map((lga) => (
//                     <option key={lga} value={lga}>
//                       {lga}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Tags */}
//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Niche Tags (Press Enter or Comma)
//                 </label>
//                 <div className="relative">
//                   <Tag className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
//                   <input
//                     type="text"
//                     placeholder="Add tags (e.g. traffic, market, power)..."
//                     value={tagInput}
//                     onChange={(e) => setTagInput(e.target.value)}
//                     onKeyDown={handleAddTag}
//                     className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                   />
//                 </div>
//                 {tags.length > 0 && (
//                   <div className="flex flex-wrap gap-2 mt-2.5">
//                     {tags.map((t) => (
//                       <span
//                         key={t}
//                         className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full"
//                       >
//                         <span>#{t}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveTag(t)}
//                           className="hover:text-rose-600 ml-1 cursor-pointer"
//                         >
//                           <X className="w-3 h-3" />
//                         </button>
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Cover Photo Upload */}
//               <div>
//                 <div className="flex justify-between items-center mb-1.5">
//                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green">
//                     Cover Photo
//                   </label>
//                   {imagePreview && (
//                     <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
//                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
//                       Photo Attached
//                     </span>
//                   )}
//                 </div>

//                 {imagePreview ? (
//                   <div className="relative w-full h-52 bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
//                     <img
//                       src={imagePreview}
//                       alt="Story cover"
//                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//                     />

//                     <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
//                       <label className="flex items-center space-x-2 bg-white/90 hover:bg-white text-gray-900 px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-lg backdrop-blur-sm transition active:scale-95">
//                         <RefreshCw className="w-3.5 h-3.5 text-akede-green" />
//                         <span>Replace</span>
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
//                         className="flex items-center space-x-1.5 bg-rose-600/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg backdrop-blur-sm transition active:scale-95 cursor-pointer"
//                       >
//                         <X className="w-4 h-4" />
//                         <span>Remove</span>
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <label
//                     onDragOver={handleDragOver}
//                     onDragLeave={handleDragLeave}
//                     onDrop={handleDrop}
//                     className={`relative flex flex-col items-center justify-center w-full py-7 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 group ${
//                       isDragging
//                         ? "border-akede-green bg-emerald-50/60 scale-[1.01]"
//                         : "border-gray-300 hover:border-akede-green bg-gray-50/50 hover:bg-emerald-50/30"
//                     }`}
//                   >
//                     <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-akede-green flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-akede-green group-hover:text-white transition-all duration-300 shadow-sm">
//                       <UploadCloud className="w-6 h-6 stroke-[2.2]" />
//                     </div>

//                     <div className="text-center space-y-1">
//                       <p className="text-sm font-extrabold text-gray-800 group-hover:text-akede-green transition-colors">
//                         Click to upload{" "}
//                         <span className="font-normal text-gray-500">
//                           or drag & drop
//                         </span>
//                       </p>
//                       <p className="text-[11px] font-medium text-gray-400">
//                         PNG, JPG, WEBP or GIF
//                       </p>
//                     </div>

//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageFileChange}
//                       className="hidden"
//                     />
//                   </label>
//                 )}
//               </div>

//               {/* Author */}
//               <div>
//                 <label className="block text-xs font-bold uppercase tracking-wider text-akede-green mb-1.5">
//                   Author / Source Credit
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Source: Festac Online"
//                   value={author}
//                   onChange={(e) => setAuthor(e.target.value)}
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-akede-green text-sm"
//                 />
//               </div>

//               {/* Excerpt */}
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

//               {/* Content */}
//               <div>
//                 <div className="flex justify-between items-center mb-1.5">
//                   <label className="block text-xs font-bold uppercase tracking-wider text-akede-green">
//                     Full Story *
//                   </label>
//                   <span
//                     className={`text-[11px] font-bold ${
//                       wordCount > 200 ? "text-rose-600" : "text-gray-400"
//                     }`}
//                   >
//                     {wordCount} / 200 words
//                   </span>
//                 </div>
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
//                 className="w-full bg-akede-green hover:bg-akede-lightGreen active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
//               >
//                 {submitting || uploadingImage ? (
//                   <>
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                     <span>Saving...</span>
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

//           {/* Sidebar Area */}
//           <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
//             {/* Live Preview Card */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <span className="text-xs font-bold uppercase tracking-wider text-akede-green">
//                   Live Card Preview
//                 </span>
//               </div>

//               <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
//                 {imagePreview ? (
//                   <img
//                     src={imagePreview}
//                     alt="Preview"
//                     className="w-full h-44 object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-36 bg-gray-50 flex flex-col items-center justify-center text-gray-400 space-y-1">
//                     <ImageIcon className="w-7 h-7 stroke-1" />
//                     <span className="text-[11px] font-medium">No image</span>
//                   </div>
//                 )}
//                 <div className="p-4 space-y-2">
//                   <div className="flex flex-wrap items-center gap-1.5">
//                     <span className="bg-akede-accentGreen text-akede-green text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
//                       {category}
//                     </span>
//                     {lgaTag && (
//                       <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
//                         <Globe className="w-2.5 h-2.5" />
//                         {lgaTag}
//                       </span>
//                     )}
//                   </div>
//                   <h3 className="font-extrabold text-gray-900 text-base leading-snug">
//                     {title || "Story Title..."}
//                   </h3>
//                   <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
//                     {excerpt || "Card summary snippet..."}
//                   </p>
//                   <p className="text-[10px] text-gray-400 font-semibold pt-1">
//                     {neighbourhood ? `${neighbourhood}, ${lgaTag || "LGA"}` : lgaTag || "General LGA News"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Published Feed List */}
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
//                 <p className="text-xs text-gray-500 text-center py-6">
//                   No stories published yet.
//                 </p>
//               ) : (
//                 <div className="space-y-3 max-h-112.5 overflow-y-auto pr-1">
//                   {posts.map((post: any) => {
//                     const postId = post._id || post.id || "";
//                     return (
//                       <div
//                         key={postId}
//                         className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3"
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
//                             <div className="flex items-center gap-1.5 mb-1">
//                               <span className="bg-akede-accentGreen text-akede-green text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block">
//                                 {post.category}
//                               </span>
//                               {post.lgaTag && (
//                                 <span className="text-[9px] text-gray-500 font-bold truncate">
//                                   • {post.lgaTag}
//                                 </span>
//                               )}
//                             </div>
//                             <h4 className="text-xs font-bold text-gray-900 truncate">
//                               {post.title}
//                             </h4>
//                           </div>
//                         </div>

//                         <div className="flex items-center space-x-1 shrink-0">
//                           <button
//                             type="button"
//                             onClick={() => handleEditClick(post)}
//                             className="p-1.5 text-gray-500 hover:text-akede-green hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition cursor-pointer"
//                           >
//                             <Edit3 className="w-3.5 h-3.5" />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleDelete(postId)}
//                             className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition cursor-pointer"
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