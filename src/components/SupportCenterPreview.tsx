import React from 'react';
import { ExternalLink, Sparkles, CheckCircle2, Lock, Globe } from 'lucide-react';
import { SUPPORT_CENTER_CONFIG, SupportCenterConfig } from '../constants/support';

interface SupportCenterPreviewProps {
  config?: SupportCenterConfig;
  className?: string;
}

export const SupportCenterPreview: React.FC<SupportCenterPreviewProps> = ({
  config = SUPPORT_CENTER_CONFIG,
  className = '',
}) => {
  return (
    <section 
      aria-label="KP Member Support Center Preview"
      className={`relative w-full bg-ivy rounded-2xl md:rounded-3xl border border-gold/30 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Subtle Background Glows */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-2xl -ml-28 -mb-28 pointer-events-none" 
      />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Messaging & Action */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-4 sm:space-y-5 text-left">
            
            {/* Glowing Status Label */}
            <div>
              <div className="relative inline-block">
                {/* Radiant Glow Behind Badge */}
                <div className="absolute -inset-1 bg-gradient-to-r from-gold via-amber-300 to-gold rounded-full blur-md opacity-80 animate-pulse" />
                <span className="relative inline-flex items-center gap-2 px-4 py-1.5 bg-gold text-ivy font-black text-xs uppercase tracking-[0.25em] rounded-full shadow-[0_0_20px_rgba(212,175,55,0.9)] border border-amber-200">
                  <Sparkles size={14} className="text-ivy animate-bounce" />
                  <span className="font-extrabold">{config.statusLabel}</span>
                </span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase tracking-tight text-white leading-tight">
              {config.heading}
            </h2>

            {/* Description */}
            <p className="text-cream/90 text-sm sm:text-base font-body font-light leading-relaxed max-w-2xl">
              {config.description}
            </p>

            {/* Supporting Line */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <p className="text-xs sm:text-sm font-semibold text-gold tracking-wide">
                {config.supportingLine}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <a
                href={config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 bg-gold hover:bg-gold-light text-ivy font-display font-bold text-xs sm:text-sm uppercase tracking-widest rounded-xl transition-all duration-200 shadow-lg hover:shadow-gold/20 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivy min-h-[44px] cursor-pointer"
                aria-label={`Open ${config.heading} in new tab`}
              >
                <span>{config.buttonLabel}</span>
                <ExternalLink size={16} className="shrink-0 stroke-[2.5]" />
              </a>
            </div>
          </div>

          {/* Right Column: Compact Web Preview Window (Reduced size by 50%) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center w-full">
            <a
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full max-w-[240px] sm:max-w-[270px] md:max-w-[280px] focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivy rounded-xl transition-transform duration-300 min-h-[44px]"
              aria-label={`Open preview of ${config.heading} website in new tab`}
            >
              {/* Compact Browser Frame */}
              <div className="w-full bg-stone-900 rounded-xl overflow-hidden border border-gold/30 shadow-xl group-hover:border-gold/60 group-hover:shadow-2xl transition-all duration-300">
                
                {/* Browser Header Bar */}
                <div className="bg-stone-950 px-2.5 py-1.5 flex items-center justify-between border-b border-white/10 select-none">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
                  </div>

                  {/* URL Pill */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[9px] text-cream/70 font-mono max-w-[150px] truncate">
                    <Lock size={8} className="text-gold shrink-0" />
                    <span className="truncate">support.orderofkpi.com</span>
                  </div>

                  <div className="w-6 flex justify-end">
                    <Globe size={10} className="text-cream/40" />
                  </div>
                </div>

                {/* Screenshot Image Frame */}
                <div className="relative aspect-[16/10] bg-stone-900 overflow-hidden">
                  <img
                    src={config.previewImagePath}
                    alt={config.previewImageAlt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle Hover Overlay */}
                  <div className="absolute inset-0 bg-ivy/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivy/90 text-gold border border-gold/40 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      <span>Visit Site</span>
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </a>

            {/* Caption */}
            <p className="text-[10px] sm:text-[11px] text-cream/70 font-body italic text-center mt-2">
              {config.previewCaption}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SupportCenterPreview;
