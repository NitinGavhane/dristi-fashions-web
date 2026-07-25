import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { HeroSlide } from '../../types';

interface HeroCarouselProps {
  slides: HeroSlide[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

/**
 * Slides come from the `hero` banners the seller manages in the admin app. With
 * none configured the section is skipped entirely rather than showing filler.
 */
export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, loading, onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // A banner removed in the admin app can leave the index past the end.
  useEffect(() => {
    setCurrentSlide(prev => (prev < slides.length ? prev : 0));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // A phone in portrait cannot spare 480px of chrome-free height, and a laptop
  // in landscape looks empty at that size — so the frame tracks the viewport
  // with a floor and a ceiling instead of being pinned to one number.
  const FRAME = 'h-[min(70vh,26rem)] sm:h-[min(72vh,32rem)] lg:h-[35rem]';

  if (loading) {
    return <div className={`w-full ${FRAME} skeleton-shimmer rounded-xl my-4 max-w-7xl mx-auto`} />;
  }

  if (!slides.length) return null;

  const slide = slides[currentSlide] ?? slides[0];
  const nextSlide = () => setCurrentSlide((currentSlide + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);
  const hasControls = slides.length > 1;

  return (
    <div className={`relative w-full max-w-7xl mx-auto my-4 rounded-xl overflow-hidden shadow-2xl ${FRAME} group bg-[#0d1648]`}>
      <div className="absolute inset-0 transition-all duration-700 ease-out">
        <img
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1648]/95 via-[#0d1648]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1648]/80 via-transparent to-transparent" />
      </div>

      {/*
        The side padding clears the arrows rather than running under them, and
        the bottom padding clears the dot row — on a short screen the copy block
        is centred, which without this puts the call to action straight on top
        of both.
      */}
      <div
        className={`relative z-10 h-full max-w-2xl flex flex-col justify-center text-white pt-8 pr-4 sm:pr-12 ${
          hasControls ? 'pl-14 sm:pl-16 pb-16 sm:pb-20' : 'pl-4 sm:pl-12 pb-8'
        }`}
      >
        <p className="text-[10px] sm:text-xs font-sans font-bold tracking-[0.2em] sm:tracking-[0.3em] text-[#ffe08e] uppercase mb-2">
          {slide.subtitle}
        </p>

        <h1 className="font-serif text-2xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3 sm:mb-4 text-white drop-shadow-md">
          {slide.title}
        </h1>

        {slide.description && (
          <p className="text-xs sm:text-sm text-[#e0e0fb] mb-6 sm:mb-8 leading-relaxed font-sans max-w-lg line-clamp-3 sm:line-clamp-none">
            {slide.description}
          </p>
        )}

        <div>
          <button
            onClick={() => onNavigate(slide.ctaLink)}
            className="btn-primary inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 text-[11px] sm:text-xs tracking-widest shadow-xl group/btn"
          >
            <span>{slide.ctaText}</span>
            <ArrowRight className="w-4 h-4 shrink-0 text-[#0d1648] group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {hasControls && (
        <>
          {/* `hover-reveal` fades these in on hover but leaves them permanently
              visible on a touch screen, which has no hover state to give. */}
          <button
            onClick={prevSlide}
            className="hover-reveal absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/35 sm:bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-[#0d1648] flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="hover-reveal absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/35 sm:bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-[#0d1648] flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex max-w-[calc(100%-6rem)] flex-wrap items-center justify-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'w-8 bg-[#fed255]' : 'w-2 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
