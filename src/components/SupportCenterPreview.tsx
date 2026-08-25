import React from 'react';
import { ExternalLink, Sparkles, CheckCircle2, Ticket, ShieldCheck, HelpCircle } from 'lucide-react';
import { SUPPORT_CENTER_CONFIG, SupportCenterConfig } from '../constants/support';

interface SupportCenterPreviewProps {
  config?: SupportCenterConfig;
  className?: string;
}

export const SupportCenterPreview: React.FC<SupportCenterPreviewProps> = ({
  config = SUPPORT_CENTER_CONFIG,
  className = '',
}) => {
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Ticket':
        return <Ticket size={22} className="text-gold" />;
      case 'Sparkles':
        return <Sparkles size={22} className="text-gold" />;
      case 'ShieldCheck':
        return <ShieldCheck size={22} className="text-gold" />;
      default:
        return <HelpCircle size={22} className="text-gold" />;
    }
  };

  return (
    <section 
      aria-label="KP Member Support Center Preview"
      className={`relative w-full bg-ivy rounded-2xl md:rounded-3xl border border-gold/30 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background Ambient Glows */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-2xl -ml-28 -mb-28 pointer-events-none" 
      />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gold/20 pb-6">
          <div className="space-y-3 max-w-3xl text-left">
            {/* Status Badge */}
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gold/20 text-cream font-extrabold text-xs uppercase tracking-[0.2em] rounded-full border border-gold/40 shadow-xs">
                <Sparkles size={14} className="text-gold animate-pulse" />
                <span>{config.statusLabel}</span>
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase tracking-tight text-cream leading-tight">
              {config.heading}
            </h2>

            {/* Description */}
            <p className="text-cream/80 text-sm sm:text-base font-body font-light leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Primary CTA Button */}
          <div className="shrink-0 pt-2 lg:pt-0">
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

        {/* Informative Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {config.features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-stone-900/40 border border-gold/20 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-3 hover:border-gold/40 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gold/10 border border-gold/20 rounded-xl shrink-0">
                  {getFeatureIcon(feature.iconName)}
                </div>
                <h3 className="text-cream font-display font-bold text-sm uppercase tracking-wide">
                  {feature.title}
                </h3>
              </div>
              <p className="text-cream/70 text-xs sm:text-sm font-body leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Supporting Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-cream/70 border-t border-gold/15">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold shrink-0" />
            <span className="font-semibold text-gold tracking-wide">
              {config.supportingLine}
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-cream/50">
            support.orderofkpi.com
          </span>
        </div>

      </div>
    </section>
  );
};

export default SupportCenterPreview;
