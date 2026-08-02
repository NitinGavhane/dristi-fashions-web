import React from 'react';
import logoUrl from '@/assets/logo.png';

/**
 * The brand artwork is a stacked lockup — emblem on top, wordmark beneath —
 * centred in a square canvas with transparent padding around it.
 *
 * Both crops below were measured from the PNG's alpha channel. They matter
 * because dropping the whole square into a 48px header bar would shrink the
 * wordmark to an illegible smudge and surround it with dead space; cropping to
 * the emblem lets it sit beside live text instead.
 */
const EMBLEM_CROP = { x: 0.1659, y: 0.0598, w: 0.7113, h: 0.5343 };

/** The complete lockup with its transparent margin trimmed off. */
const LOCKUP_CROP = { x: 0.138, y: 0.059, w: 0.7392, h: 0.7552 };

/** Spelling follows the artwork itself (and the backend's seller name). */
const BRAND_NAME = 'DRISTI FASHIONS';
const BRAND_TAGLINE = 'Fashion That Reflects Your Personality';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'full' | 'horizontal' | 'emblem-only' | 'text-only' | 'stacked';

interface DristiLogoProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoVariant;
  /** Switches the wordmark to navy for placement on a light background. */
  lightMode?: boolean;
  /**
   * Drops the tagline below `sm`. The horizontal lockup is the widest thing in
   * the header bar, and the tagline is its widest line — hiding it is what lets
   * the wordmark stay on one line beside the menu and basket buttons on a
   * 320px screen instead of wrapping into them.
   */
  compactOnMobile?: boolean;
}

/**
 * Every step scales down one notch below `sm`. The artwork is fixed-height by
 * nature, so without this the header lockup keeps its desktop size on a phone
 * and squeezes the controls either side of it.
 */
const EMBLEM_HEIGHT: Record<LogoSize, string> = {
  sm: 'h-7 sm:h-8',
  md: 'h-8 sm:h-11',
  lg: 'h-11 sm:h-14',
  xl: 'h-14 sm:h-20',
};

const LOCKUP_HEIGHT: Record<LogoSize, string> = {
  sm: 'h-12 sm:h-16',
  md: 'h-16 sm:h-24',
  lg: 'h-24 sm:h-32',
  xl: 'h-32 sm:h-44',
};

const TEXT_SIZE: Record<LogoSize, string> = {
  sm: 'text-[11px] sm:text-sm',
  md: 'text-sm sm:text-lg',
  lg: 'text-lg sm:text-2xl',
  xl: 'text-2xl sm:text-3xl',
};

const TAGLINE_SIZE: Record<LogoSize, string> = {
  sm: 'text-[7px] sm:text-[8px]',
  md: 'text-[8px] sm:text-[9px]',
  lg: 'text-[9px] sm:text-[11px]',
  xl: 'text-[11px] sm:text-[13px]',
};

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Shows one region of the logo file.
 *
 * The box is sized by its height class and the crop's aspect ratio; the image
 * is then blown up to `1 / crop.w` of that width and pulled back by the crop
 * origin, so the chosen region exactly fills the box at any size.
 */
const CroppedLogo: React.FC<{ crop: CropBox; heightClass: string; alt: string }> = ({
  crop,
  heightClass,
  alt,
}) => (
  <div
    className={`relative overflow-hidden shrink-0 ${heightClass}`}
    style={{ aspectRatio: `${crop.w} / ${crop.h}` }}
  >
    <img
      src={logoUrl}
      alt={alt}
      className="absolute max-w-none select-none"
      style={{
        width: `${100 / crop.w}%`,
        left: `${-(crop.x / crop.w) * 100}%`,
        top: `${-(crop.y / crop.h) * 100}%`,
      }}
      draggable={false}
    />
  </div>
);

export const DristiLogo: React.FC<DristiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  lightMode = false,
  compactOnMobile = false,
}) => {
  // The lockup already contains the wordmark, so rendering text alongside it
  // would print the brand name twice.
  if (variant === 'full' || variant === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <CroppedLogo crop={LOCKUP_CROP} heightClass={LOCKUP_HEIGHT[size]} alt="Dristi Fashions" />
        {variant === 'full' && (
          <p
            className={`font-serif italic tracking-wider opacity-95 mt-2 ${TAGLINE_SIZE[size]}`}
            style={{ color: lightMode ? '#755b00' : '#fed255' }}
          >
            {BRAND_TAGLINE}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'emblem-only') {
    return (
      <div className={`inline-flex ${className}`}>
        <CroppedLogo crop={EMBLEM_CROP} heightClass={EMBLEM_HEIGHT[size]} alt="Dristi Fashions" />
      </div>
    );
  }

  const wordmark = (
    <div className="flex min-w-0 flex-col items-start text-left">
      <span
        className={`font-serif font-extrabold tracking-[0.12em] sm:tracking-[0.18em] uppercase leading-tight whitespace-nowrap ${TEXT_SIZE[size]}`}
        style={{
          color: lightMode ? '#0d1648' : '#ffe08e',
          textShadow: lightMode ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {BRAND_NAME}
      </span>
      <span
        className={`font-serif italic tracking-wider opacity-95 whitespace-nowrap ${
          compactOnMobile ? 'hidden sm:inline' : ''
        } ${TAGLINE_SIZE[size]}`}
        style={{ color: lightMode ? '#755b00' : '#fed255' }}
      >
        {BRAND_TAGLINE}
      </span>
    </div>
  );

  if (variant === 'text-only') {
    return <div className={`inline-flex min-w-0 ${className}`}>{wordmark}</div>;
  }

  // horizontal — emblem beside the wordmark, for headers and navigation bars.
  return (
    <div className={`inline-flex min-w-0 flex-row items-center gap-2 sm:gap-2.5 text-left ${className}`}>
      <CroppedLogo crop={EMBLEM_CROP} heightClass={EMBLEM_HEIGHT[size]} alt="Dristi Fashions" />
      {wordmark}
    </div>
  );
};
