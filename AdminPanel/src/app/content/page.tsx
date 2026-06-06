"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Plus,
  Layers,
  Search,
  Loader2,
  Trash2,
  Edit3,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye,
  X,
  Sparkles
} from "lucide-react";
import { useAdminPermissions } from "@/lib/use-admin-permissions";

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  image_alt: string | null;
  published: boolean;
  updated_at?: string;
};

export default function ContentPage() {
  const { can } = useAdminPermissions();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete post.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while deleting the post.");
    } finally {
      setDeletingId(null);
    }
  }

  function toSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.published).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by tab
    if (activeTab === "published") {
      result = result.filter((p) => p.published);
    } else if (activeTab === "draft") {
      result = result.filter((p) => !p.published);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.slug.toLowerCase().includes(q)
      );
    }

    return result;
  }, [posts, activeTab, searchQuery]);

  const getGradient = (id: number) => {
    const gradients = [
      "from-violet-500/20 to-fuchsia-500/10",
      "from-rose-500/20 to-orange-500/10",
      "from-cyan-500/20 to-blue-500/10",
      "from-emerald-500/20 to-teal-500/10",
      "from-amber-500/20 to-yellow-500/10",
      "from-indigo-500/20 to-purple-500/10",
    ];
    return gradients[id % gradients.length];
  };

  const storefrontBaseUrl = (process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3001").replace(/\/+$/, "");

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-2 py-4">
      {/* Page Header (Clean, Flat, Spacious) */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
              <Layers className="h-3.5 w-3.5" />
              Content Management
            </div>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-text-main font-display">Posts & Pages</h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">
            Manage your blog posts, articles, and dynamic pages using the Advanced Visual Builder.
          </p>
        </div>

        {can("content.edit") && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-primary text-text-inverse px-5 py-2.5 text-xs font-bold transition-all shadow-md hover:bg-brand-secondary active:scale-95 duration-200"
          >
            <Plus className="h-4 w-4" />
            New Post in Advanced Editor
          </button>
        )}
      </div>

      {/* Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 hover:shadow-soft transition-all duration-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <div className="text-2xl font-black text-text-main font-display">{stats.total}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Total Documents</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 hover:shadow-soft transition-all duration-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <div className="text-2xl font-black text-text-main font-display">{stats.published}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Published Articles</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background-elevated p-5 flex items-center gap-4 hover:shadow-soft transition-all duration-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </span>
          <div>
            <div className="text-2xl font-black text-text-main font-display">{stats.drafts}</div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-soft">Work in Progress</div>
          </div>
        </div>
      </div>

      {/* Filter and Tab Options Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
        {/* Search Input */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-background-elevated px-4 py-2 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all duration-200 max-w-sm w-full">
          <Search className="h-4 w-4 text-text-soft shrink-0" />
          <input
            type="text"
            placeholder="Search posts by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-0 p-0"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center rounded-full bg-background-elevated p-1 border border-border self-start md:self-auto shadow-sm">
          {(["all", "published", "draft"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive ? "bg-brand-primary text-text-inverse shadow-sm" : "text-text-soft hover:text-text-main"
                }`}
              >
                {tab === "all" ? "All Content" : tab === "published" ? "Published" : "Drafts"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Catalog Grid */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-elevated border border-border rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <span className="mt-3 text-xs font-bold text-text-soft uppercase tracking-wider">Loading posts catalog...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background-elevated border border-border rounded-3xl text-center p-6">
            <Layers className="h-12 w-12 text-text-soft mb-3" />
            <h4 className="text-sm font-bold text-text-main">No documents found</h4>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              {searchQuery
                ? `No posts matched your search filters for "${searchQuery}"`
                : "No document records are configured. Click 'New Post' above to create one."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => {
                const formattedDate = post.updated_at
                  ? new Date(post.updated_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                const isDeleting = deletingId === post.id;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="flex flex-col justify-between rounded-3xl border border-border bg-background-elevated overflow-hidden hover:shadow-md transition-all duration-200 group"
                  >
                    <div>
                      {/* Cover Image Placeholder */}
                      <div className="relative h-40 w-full overflow-hidden border-b border-border">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.image_alt || post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-tr ${getGradient(post.id)} flex items-center justify-center relative`}>
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                            <span className="text-4xl font-black text-brand-primary/20 select-none font-display">
                              {post.title.substring(0, 2).toUpperCase()}
                            </span>
                            <FileText className="absolute bottom-3 right-3 h-5 w-5 text-brand-primary/30" />
                          </div>
                        )}
                        
                        {/* Status tag inside cover */}
                        <div className="absolute left-3 top-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${
                            post.published
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}>
                            {post.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-5 space-y-2.5">
                        <div>
                          <h4 className="text-sm font-extrabold text-text-main group-hover:text-brand-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <span className="inline-flex mt-1 font-mono text-[9px] font-bold text-text-soft bg-background-soft border border-border px-1.5 py-0.5 rounded">
                            /{post.slug}
                          </span>
                        </div>

                        <p className="text-xs text-text-soft line-clamp-3 font-medium min-h-[48px]">
                          {post.excerpt || "No description excerpt. Open in visual page builder to define the layout components."}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 pb-5 pt-3 border-t border-border/40 flex items-center justify-between bg-background-soft/30 gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[10px] text-text-soft font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formattedDate || "Draft"}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`${storefrontBaseUrl}/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Live Storefront Post"
                          className="p-2 rounded-xl border border-border bg-background-elevated hover:bg-background-soft text-text-soft hover:text-text-main transition-all active:scale-95 duration-150 h-8 w-8 flex items-center justify-center shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        
                        <button
                          onClick={() => void handleDelete(post.id)}
                          disabled={isDeleting}
                          title="Delete Post"
                          className="p-2 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-600 disabled:opacity-40 transition-all active:scale-95 duration-150 h-8 w-8 flex items-center justify-center shrink-0"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>

                        <Link
                          href={`/builder?mode=puck&page=${encodeURIComponent(post.slug)}&create=post&title=${encodeURIComponent(post.title)}`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-brand-primary text-text-inverse px-4 text-xs font-bold hover:bg-brand-secondary transition-all active:scale-95 duration-150 shrink-0"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Post Dialog Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-background-elevated p-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute right-4 top-4 p-1 rounded-full text-text-soft hover:text-text-main hover:bg-background-soft transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              
              <h3 className="text-lg font-black text-text-main font-display flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-brand-primary" />
                New Document Title
              </h3>
              
              <p className="text-xs text-text-soft mb-4 font-semibold">
                Enter a name for your page or blog post. We will automatically generate its slug and initialize the Visual Editor.
              </p>
              
              <input
                type="text"
                placeholder="e.g. Summer Bedding Collection Guide"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background-soft px-3.5 py-2.5 text-xs font-bold text-text-main placeholder-text-soft focus:outline-none focus:ring-1 focus:ring-brand-primary mb-5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPostTitle.trim()) {
                    const slug = toSlug(newPostTitle);
                    window.location.href = `/builder?mode=puck&page=${slug}&create=post&title=${encodeURIComponent(newPostTitle)}`;
                  }
                }}
              />
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold text-text-main hover:bg-background-soft transition-all duration-150"
                >
                  Cancel
                </button>
                <a
                  href={newPostTitle.trim() ? `/builder?mode=puck&page=${toSlug(newPostTitle)}&create=post&title=${encodeURIComponent(newPostTitle)}` : "#"}
                  onClick={(e) => {
                    if (!newPostTitle.trim()) e.preventDefault();
                  }}
                  className={`px-5 py-2 rounded-full bg-brand-primary text-text-inverse text-xs font-bold hover:bg-brand-secondary transition-all flex items-center gap-1.5 ${
                    !newPostTitle.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span>Initialize Editor</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
