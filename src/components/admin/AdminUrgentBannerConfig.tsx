import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Megaphone, 
  Info, 
  Link as LinkIcon, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  ExternalLink,
  Eye,
  Type,
  Gauge
} from 'lucide-react';
import { useSystemFeatures, updateUrgentBannerConfig, UrgentBannerConfig, DEFAULT_URGENT_BANNER } from '../../lib/settings';
import UrgentBannerTicker from '../UrgentBannerTicker';

interface AdminUrgentBannerConfigProps {
  onShowToast?: (type: 'success' | 'error', text: string) => void;
}

export const AdminUrgentBannerConfig: React.FC<AdminUrgentBannerConfigProps> = ({ onShowToast }) => {
  const { features, loading } = useSystemFeatures();
  const currentBanner: UrgentBannerConfig = features?.urgent_banner || DEFAULT_URGENT_BANNER;

  const [enabled, setEnabled] = useState<boolean>(currentBanner.enabled);
  const [message, setMessage] = useState<string>(currentBanner.message || '');
  const [linkUrl, setLinkUrl] = useState<string>(currentBanner.linkUrl || '');
  const [linkText, setLinkText] = useState<string>(currentBanner.linkText || '');
  const [severity, setSeverity] = useState<'urgent' | 'important' | 'info'>(currentBanner.severity || 'urgent');
  const [speed, setSpeed] = useState<'normal' | 'slow' | 'fast'>(currentBanner.speed || 'normal');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when features change externally
  useEffect(() => {
    if (features?.urgent_banner) {
      setEnabled(features.urgent_banner.enabled);
      setMessage(features.urgent_banner.message || '');
      setLinkUrl(features.urgent_banner.linkUrl || '');
      setLinkText(features.urgent_banner.linkText || '');
      setSeverity(features.urgent_banner.severity || 'urgent');
      setSpeed(features.urgent_banner.speed || 'normal');
    }
  }, [features?.urgent_banner]);

  const handleSave = async (overrideEnabled?: boolean) => {
    setIsSaving(true);
    const targetEnabled = overrideEnabled !== undefined ? overrideEnabled : enabled;
    
    const nextConfig: Partial<UrgentBannerConfig> = {
      enabled: targetEnabled,
      message: message.trim(),
      linkUrl: linkUrl.trim(),
      linkText: linkText.trim(),
      severity,
      speed
    };

    const success = await updateUrgentBannerConfig(nextConfig);
    setIsSaving(false);

    if (success) {
      if (onShowToast) {
        onShowToast('success', targetEnabled 
          ? 'Urgent Portal Banner activated and live on Member Portal!' 
          : 'Urgent Portal Banner turned off.');
      }
    } else {
      if (onShowToast) {
        onShowToast('error', 'Failed to update banner configuration. Please try again.');
      }
    }
  };

  const applyPreset = (presetMsg: string, presetUrl: string, presetLinkText: string, presetSeverity: 'urgent' | 'important' | 'info') => {
    setMessage(presetMsg);
    setLinkUrl(presetUrl);
    setLinkText(presetLinkText);
    setSeverity(presetSeverity);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-4">
        <div>
          <h3 className="font-display font-bold text-ivy text-base uppercase flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gold animate-pulse" />
            Member Portal <span className="text-gold">Urgent Banner Announcement</span>
          </h3>
          <p className="text-ivy/60 text-xs mt-1">
            Display a high-visibility scrolling ticker banner across the top of the Member Portal homepage for urgent items and announcements.
          </p>
        </div>

        {/* Master Active Switch */}
        <div className="flex items-center gap-3 bg-cream/50 p-2 px-4 rounded-2xl border border-gold/20 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-ivy">
            Banner Status:
          </span>
          <button
            type="button"
            disabled={loading || isSaving}
            onClick={() => {
              const newEnabled = !enabled;
              setEnabled(newEnabled);
              handleSave(newEnabled);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              enabled 
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40' 
                : 'bg-stone-300 text-stone-700 hover:bg-stone-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-amber-300 animate-ping' : 'bg-stone-500'}`} />
            {enabled ? 'LIVE ON PORTAL' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Preset Quick Templates */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-ivy/70 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" /> Quick Presets & Templates
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset(
              "Intake Voting will begin on Wednesday for eligible members",
              "/candidate-voting",
              "Review & Cast Votes",
              "urgent"
            )}
            className="p-3 rounded-xl border border-gold/20 bg-amber-50/50 hover:bg-amber-100/70 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-red-900">
              <span>🚨 Intake Voting Notice</span>
              <span className="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-mono">Preset</span>
            </div>
            <p className="text-[11px] text-ivy/70 mt-1 line-clamp-1">Intake Voting will begin on Wednesday...</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(
              "KP Member Support Center is coming soon! Get help and track requests in one place.",
              "https://support.orderofkpi.com/",
              "Preview Support Center",
              "important"
            )}
            className="p-3 rounded-xl border border-gold/20 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>📢 Support Center Notice</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">Preset</span>
            </div>
            <p className="text-[11px] text-ivy/70 mt-1 line-clamp-1">KP Member Support Center is coming soon...</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(
              "Reminder: FY27 Membership Dues & Status standing updates are now open.",
              "/financial-roster",
              "Check Dues Standing",
              "info"
            )}
            className="p-3 rounded-xl border border-gold/20 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span>💳 Dues Standing Reminder</span>
              <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-mono">Preset</span>
            </div>
            <p className="text-[11px] text-ivy/70 mt-1 line-clamp-1">Reminder: FY27 Membership Dues...</p>
          </button>
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        
        {/* Message Text Area */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-gold" /> Banner Message Text
            </span>
            <span className="text-[10px] text-ivy/50 font-normal">Supports scrolling text</span>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Intake Voting will begin on Wednesday for eligible members"
            className="w-full px-4 py-2.5 rounded-xl border border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/20 text-sm text-ivy font-medium placeholder-ivy/40 bg-cream/20"
          />
        </div>

        {/* Hyperlink Destination URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-gold" /> Hyperlink URL / Route
          </label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="e.g. /candidate-voting or https://support.orderofkpi.com/"
            className="w-full px-4 py-2 rounded-xl border border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/20 text-xs text-ivy font-mono bg-cream/20"
          />
          <p className="text-[10px] text-ivy/60">Relative (e.g. <code className="bg-cream px-1 py-0.5 rounded font-bold">/candidate-voting</code>) or External URL (<code className="bg-cream px-1 py-0.5 rounded font-bold">https://...</code>)</p>
        </div>

        {/* Hyperlink Label / Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-gold" /> Hyperlink Button Label
          </label>
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="e.g. Click Here to Review & Vote"
            className="w-full px-4 py-2 rounded-xl border border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/20 text-xs text-ivy font-medium bg-cream/20"
          />
          <p className="text-[10px] text-ivy/60">Optional button text displayed alongside the scrolling message</p>
        </div>

        {/* Severity Style Choice */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-gold" /> Banner Priority / Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSeverity('urgent')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold uppercase ${
                severity === 'urgent'
                  ? 'bg-red-950 text-amber-300 border-red-500 ring-2 ring-red-400/50'
                  : 'bg-cream/40 text-ivy border-gold/20 hover:border-gold/50'
              }`}
            >
              🚨 Urgent (Red)
            </button>
            <button
              type="button"
              onClick={() => setSeverity('important')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold uppercase ${
                severity === 'important'
                  ? 'bg-amber-950 text-gold border-gold ring-2 ring-gold/50'
                  : 'bg-cream/40 text-ivy border-gold/20 hover:border-gold/50'
              }`}
            >
              ⚠️ Important
            </button>
            <button
              type="button"
              onClick={() => setSeverity('info')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold uppercase ${
                severity === 'info'
                  ? 'bg-ivy text-emerald-300 border-emerald-500 ring-2 ring-emerald-400/50'
                  : 'bg-cream/40 text-ivy border-gold/20 hover:border-gold/50'
              }`}
            >
              📢 Announcement
            </button>
          </div>
        </div>

        {/* Scroll Speed Choice */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-gold" /> Marquee Scroll Speed
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['slow', 'normal', 'fast'] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeed(spd)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold uppercase capitalize ${
                  speed === spd
                    ? 'bg-ivy text-gold border-gold ring-2 ring-gold/40'
                    : 'bg-cream/40 text-ivy border-gold/20 hover:border-gold/50'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Live Interactive Preview Box */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-ivy flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gold" /> Live Admin Preview (Interactive - Hover to pause)
          </label>
          <span className="text-[10px] text-ivy/50">Preview of what members will see on homepage</span>
        </div>
        
        <div className="rounded-2xl overflow-hidden border border-gold/30 shadow-md">
          <UrgentBannerTicker />
        </div>
      </div>

      {/* Save Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gold/10">
        <p className="text-[11px] text-ivy/60 italic">
          Changes dual-write immediately to local storage & Cloud Firestore.
        </p>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSave()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-ivy hover:bg-ivy/90 text-gold font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save & Publish Banner</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminUrgentBannerConfig;
