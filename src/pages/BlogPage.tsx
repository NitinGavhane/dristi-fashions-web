import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Newspaper, User } from 'lucide-react';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import { blogApi } from '../lib/api';
import { formatDate } from '../lib/format';
import { PLACEHOLDER_IMAGE, mapBlogPost } from '../lib/mappers';
import { useAsync } from '../lib/useAsync';
import type { BlogPost } from '../types';

interface BlogPageProps {
  onNavigate: (path: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate }) => {
  const state = useAsync(() => blogApi.list(), []);
  const posts = useMemo(() => (state.data ?? []).map(mapBlogPost), [state.data]);

  // Reading happens in place — the backend serves posts by slug, but a single
  // list response already carries the full content.
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  if (state.loading) return <Spinner label="Loading the journal…" className="min-h-[50vh]" />;

  if (state.error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState message={state.error} onRetry={state.reload} />
      </div>
    );
  }

  if (openPost) {
    return (
      <article className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <button
          onClick={() => setOpenPost(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to the Journal
        </button>

        {openPost.image && (
          <img
            src={openPost.image}
            alt={openPost.title}
            className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-lg"
          />
        )}

        <header className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#0d1648] leading-tight">{openPost.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#767680] font-sans">
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {openPost.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(openPost.createdAt)}
            </span>
          </div>
        </header>

        <div className="text-sm text-[#46464f] font-sans leading-relaxed whitespace-pre-line">
          {openPost.content || openPost.excerpt}
        </div>
      </article>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Newspaper className="w-12 h-12" />}
          title="No stories yet"
          message="Our journal is being written. Check back soon."
          actionLabel="Browse the Catalogue"
          onAction={() => onNavigate('/search')}
        />
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#755b00] uppercase">
          THE DRISTHI JOURNAL
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#0d1648]">Stories from the Atelier</h1>
        <p className="text-xs text-[#767680] font-sans leading-relaxed">
          Styling notes, collection stories and news from Dristi Fashions.
        </p>
      </div>

      {/* Featured */}
      <button
        onClick={() => setOpenPost(featured)}
        className="w-full text-left bg-[#0d1648] text-white rounded-2xl overflow-hidden shadow-2xl border border-[#fed255]/30 grid grid-cols-1 lg:grid-cols-12 group"
      >
        <div className="lg:col-span-7 h-64 sm:h-96">
          <img
            src={featured.image || PLACEHOLDER_IMAGE}
            alt={featured.title}
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="lg:col-span-5 min-w-0 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <span className="badge-new bg-[#fed255] text-[#0d1648] font-bold text-[9px]">LATEST STORY</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">{featured.title}</h2>
            {featured.excerpt && (
              <p className="text-xs text-[#e0e0fb] font-sans leading-relaxed line-clamp-4">{featured.excerpt}</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#ffe08e]/20 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-[#ffe08e]">
            <span className="inline-flex min-w-0 items-center gap-2">
              <User className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{featured.author}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 font-bold group-hover:underline">
              Read Story <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </button>

      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rest.map(post => (
            <button
              key={post.id}
              onClick={() => setOpenPost(post)}
              className="card card-hover bg-white rounded-xl overflow-hidden flex flex-col justify-between text-left"
            >
              <div>
                <div className="h-48 overflow-hidden bg-[#f4f2ff]">
                  <img
                    src={post.image || PLACEHOLDER_IMAGE}
                    alt={post.title}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#0d1648] leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-[#767680] font-sans line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0 mt-4 flex items-center justify-between text-[10px] text-[#767680] border-t border-[#c6c5d0]/20 font-sans">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(post.createdAt)}
                </span>
                <span className="font-bold text-[#0d1648] inline-flex items-center gap-1">
                  Read Story <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
