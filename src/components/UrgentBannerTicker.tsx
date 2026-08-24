import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Megaphone, Info, ExternalLink, ArrowRight, X, Sparkles } from 'lucide-react';
import { useSystemFeatures, UrgentBannerConfig, DEFAULT_URGENT_BANNER } from '../lib/settings';

interface UrgentBannerTickerProps {
  className?: string;
}

export const UrgentBannerTicker: React.FC<UrgentBannerTickerProps> = ({ className = '' }) => {
  const { features } = useSystemFeatures();
  const banner: UrgentBannerConfig = features?.urgent_banner || DEFAULT_URGENT_BANNER;
  const [dismissed, setDismissed] = useState(false);

  // Check session dismissal state
  useEffect(() => {
    try {
      const dismissedMsg = sessionStorage.getItem('kpi_urgent_banner_dismissed_msg');
      if (dismissedMsg && dismissedMsg === banner.message) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch (e) {}
  }, [banner.message]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('kpi_urgent_banner_dismissed_msg', banner.message);
    } catch (e) {}
    setDismissed(true);
  };

  if (!banner.enabled || !banner.message || dismissed) {
    return null;
  }

  const severity = banner.severity || 'urgent';
  const speedClass = 
    banner.speed === 'fast' ? 'animate-kpi-marquee-fast' :
    banner.speed === 'slow' ? 'animate-kpi-marquee-slow' :
    'animate-kpi-marquee';

  // Severity styling configurations
  const stylesMap = {
    urgent: {
      container: 'bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-amber-400/40 text-amber-100 shadow-[0_4px_20px_rgba(180,30,30,0.35)]',
      badgeBg: 'bg-red-600/40 border-red-400/60 text-amber-200',
      badgeText: 'URGENT NOTICE',
      icon: AlertTriangle,
      iconColor: 'text-amber-300',
      linkBg: 'bg-amber-400 hover:bg-white text-red-950 shadow-md',
    },
    important: {
      container: 'bg-gradient-to-r from-amber-950 via-ivy to-amber-950 border-gold/40 text-cream shadow-[0_4px_20px_rgba(184,134,11,0.25)]',
      badgeBg: 'bg-amber-500/30 border-gold/60 text-gold',
      badgeText: 'IMPORTANT',
      icon: Megaphone,
      iconColor: 'text-gold',
      linkBg: 'bg-gold hover:bg-white text-ivy shadow-md',
    },
    info: {
      container: 'bg-gradient-to-r from-ivy via-emerald-950 to-ivy border-emerald-400/40 text-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.25)]',
      badgeBg: 'bg-emerald-600/30 border-emerald-400/60 text-emerald-200',
      badgeText: 'ANNOUNCEMENT',
      icon: Info,
      iconColor: 'text-emerald-300',
      linkBg: 'bg-emerald-400 hover:bg-white text-ivy shadow-md',
    }
  };

  const styleConfig = stylesMap[severity] || stylesMap.urgent;

  const IconComponent = styleConfig.icon;

  // Helper to render link appropriately (relative vs external)
  const renderLink = (linkUrl: string, linkText?: string) => {
    const label = linkText || 'Learn More & Respond';
    const isExternal = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');

    if (isExternal) {
      return (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${styleConfig.linkBg}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{label}</span>
          <ExternalLink size={12} className="shrink-0 stroke-[2.5]" />
        </a>
      );
    }

    return (
      <Link
        to={linkUrl}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${styleConfig.linkBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span>{label}</span>
        <ArrowRight size={12} className="shrink-0 stroke-[2.5]" />
      </Link>
    );
  };

  // Render content block (duplicated for marquee infinite loop)
  const renderContentItem = (keySuffix: number) => (
    <div key={keySuffix} className="inline-flex items-center gap-4 px-6 shrink-0">
      <span className="text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-3">
        <span>{banner.message}</span>
        {banner.linkUrl && renderLink(banner.linkUrl, banner.linkText)}
      </span>
      <span className="text-gold/40 text-xs font-serif select-none px-2">•</span>
    </div>
  );

  return (
    <div 
      role="region"
      aria-label="Urgent Announcement Ticker"
      className={`relative w-full border-y py-2.5 px-3 sm:px-4 z-40 overflow-hidden group ${styleConfig.container} ${className}`}
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        
        {/* Fixed Badge Label on Left */}
        <div className="shrink-0 flex items-center gap-2 z-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm ${styleConfig.badgeBg}`}>
            <IconComponent className={`w-3.5 h-3.5 ${styleConfig.iconColor} animate-pulse`} />
            <span className="whitespace-nowrap">{styleConfig.badgeText}</span>
          </div>
        </div>

        {/* Scrolling Ticker Track (Pauses on Hover) */}
        <div className="relative overflow-hidden flex-1 py-0.5">
          <div className={`${speedClass} flex items-center group-hover:[animation-play-state:paused]`}>
            {/* Duplicated items to guarantee seamless infinite scrolling loop */}
            {renderContentItem(1)}
            {renderContentItem(2)}
            {renderContentItem(3)}
            {renderContentItem(4)}
          </div>
        </div>

        {/* Pause Indicator / Dismiss Button */}
        <div className="shrink-0 flex items-center gap-2 z-10">
          <span className="hidden md:inline-block text-[10px] uppercase tracking-wider text-amber-200/60 font-mono italic opacity-0 group-hover:opacity-100 transition-opacity">
            Paused
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20 text-cream/70 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notice for this session"
            aria-label="Dismiss banner message"
          >
            <X size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default UrgentBannerTicker;
