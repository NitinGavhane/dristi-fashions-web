import React from 'react';
import { ArrowLeft, Award, Sparkles, HeartHandshake } from 'lucide-react';
import { DristiLogo } from '../components/common/DristiLogo';
import { catalogApi } from '../lib/api';
import { useAsync } from '../lib/useAsync';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const home = useAsync(() => catalogApi.home(), []);
  const heroImage = home.data?.banners?.[0]?.imageUrl ?? null;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-10">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-2">
          <DristiLogo size="lg" variant="stacked" />
        </div>
        <p className="text-xs text-[#767680] font-sans max-w-2xl mx-auto leading-relaxed">
          Fashion That Reflects Your Personality — Combining traditional heritage craftsmanship with contemporary silhouettes.
        </p>
      </div>

      {/* Hero — the seller's own banner artwork, falling back to the brand
          gradient rather than a stock photograph of somebody else's clothes. */}
      <div className="relative rounded-2xl overflow-hidden h-80 shadow-2xl navy-gradient">
        {heroImage && (
          <img src={heroImage} alt="" className="w-full h-full object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1648]/90 via-[#0d1648]/30 to-transparent flex items-end p-8 text-white">
          <div>
            <p className="text-xs font-bold text-[#fed255] uppercase tracking-widest">HANDCRAFTED HERITAGE</p>
            <h3 className="font-serif text-2xl font-bold">Exquisite Detailing & Modern Silhouettes</h3>
          </div>
        </div>
      </div>

      {/* Brand Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-[#c6c5d0]/30 space-y-2">
          <Award className="w-8 h-8 text-[#755b00]" />
          <h4 className="font-serif text-lg font-bold text-[#0d1648]">Uncompromising Quality</h4>
          <p className="text-xs text-[#767680] font-sans leading-relaxed">
            Every thread, embroidery detail, and fabric weave undergoes strict quality assurance before reach your wardrobe.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-[#c6c5d0]/30 space-y-2">
          <Sparkles className="w-8 h-8 text-[#755b00]" />
          <h4 className="font-serif text-lg font-bold text-[#0d1648]">Bespoke Tailoring</h4>
          <p className="text-xs text-[#767680] font-sans leading-relaxed">
            Custom size fittings and personal styling consultations tailored to bring out your distinct personality.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-[#c6c5d0]/30 space-y-2">
          <HeartHandshake className="w-8 h-8 text-[#755b00]" />
          <h4 className="font-serif text-lg font-bold text-[#0d1648]">Authentic Craftsmanship</h4>
          <p className="text-xs text-[#767680] font-sans leading-relaxed">
            Collaborating with master artisans to preserve traditional weaving and embroidery art forms.
          </p>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#c6c5d0]/30 space-y-4 text-xs font-sans leading-relaxed text-[#46464f]">
        <h3 className="font-serif text-2xl font-bold text-[#0d1648]">Our Story</h3>
        <p>
          Dristi Fashions was founded on the philosophy that fashion should empower and reflect the true essence of your individual personality. From rich handwoven textiles to contemporary fusion cuts, our collections are created to make every moment memorable.
        </p>
        <p>
          Whether you are celebrating grand festivities, weddings, or everyday elegance, Dristi Fashions offers curations designed with passion, precision, and flair.
        </p>
      </div>

    </div>
  );
};
