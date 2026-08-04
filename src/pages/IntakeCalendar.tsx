import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Coffee, Edit3, ClipboardCheck, Mail, Video, 
  ThumbsUp, Star, Hand, Wallet, Sparkles, Shield, UserCheck, 
  CalendarDays, Leaf, GraduationCap, Clock, LayoutList,
  Download, ZoomIn, Upload, X, Loader2, CheckCircle, Image
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

const events = [
  { step: 1, title: 'Inquire Within', date: 'Jul 8, 2026', icon: Heart },
  { step: 2, title: 'Interest Meeting', date: 'Jul 19, 2026', icon: Users },
  { step: 3, title: 'Application Due', date: 'Jul 21, 2026', icon: ClipboardCheck },
  { step: 4, title: 'Tea Time Invitations', date: 'Jul 23, 2026', icon: Mail },
  { step: 5, title: 'Tea Time', date: 'Jul 26–Aug 1, 2026', icon: Coffee },
  { step: 6, title: 'Interview Emails Sent', date: 'Aug 9, 2026', icon: Mail },
  { step: 7, title: 'Interviews', date: 'Aug 12, 14, 15, 2026', icon: Users },
  { step: 8, title: 'Video Reviews', date: 'Aug 16–20, 2026', icon: Video },
  { step: 9, title: 'Financial Chapter Members Voting', date: 'Aug 21, 2026', icon: UserCheck },
  { step: 10, title: 'Intake Notified of Selection', date: 'Aug 27, 2026', icon: Star },
  { step: 11, title: 'No Contact Period Starts', date: 'Aug 27, 2026', icon: Hand },
  { step: 12, title: '1st Payment', date: 'Sep 11, 2026', icon: Wallet },
  { step: 13, title: 'A Splendid Affair', date: 'Sep 16, 2026', icon: Sparkles },
  { step: 14, title: 'Start Intake', date: 'Sep 17, 2026', icon: Shield },
  { step: 15, title: '2nd Payment', date: 'Oct 11, 2026', icon: Wallet },
  { step: 16, title: 'Sisterhood Weekend', date: 'Oct 16–18, 2026', icon: Leaf },
  { step: 17, title: '3rd Payment', date: 'Nov 11, 2026', icon: Wallet },
  { step: 18, title: 'Ivy Weekend', date: 'Nov 13–15, 2026', icon: Leaf },
  { step: 19, title: '4th Payment (Final)', date: 'Dec 11, 2026', icon: Wallet },
  { step: 20, title: 'Sisterhood Weekend', date: 'Dec 11–13, 2026', icon: Leaf },
  { step: 21, title: 'Initiation Weekend', date: 'Jan 15–17, 2027', icon: GraduationCap },
];

export default function IntakeCalendar() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'interactive' | 'flyer'>('interactive');
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageSrc, setImageSrc] = useState('/membership_intake_calendar.jpg');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const email = sessionStorage.getItem('userEmail');
    if (!role) {
      navigate('/login');
    } else {
      setUserRole(role);
      setUserEmail(email);
    }
  }, [navigate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    
    // limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        await uploadImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (base64: string) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const response = await fetch('/api/calendar/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          email: userEmail || 'unknown'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUploadSuccess(true);
        // Bust image cache
        setImageSrc(`/membership_intake_calendar.jpg?t=${Date.now()}`);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(data.message || 'Unable to upload image flyer. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Network error while uploading flyer. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-20 relative overflow-hidden">
      {/* Draft Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
        <h1 className="text-[15rem] md:text-[25rem] font-black uppercase text-[#1E3F20] -rotate-45 select-none whitespace-nowrap">
          Draft
        </h1>
      </div>

      <div className="relative z-10">
        <div className="pt-24">
          <MemberHeader />
        </div>

        {/* Member Navigation Tabs */}
        <div className="pt-8 px-4 md:px-12 flex flex-wrap justify-center md:justify-start gap-3">
          <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
            <CalendarDays size={14} /> Intake Calendar
          </div>
          <Link to="/financial-roster" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Financial Roster
          </Link>
          <Link to="/gantt-chart" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <LayoutList size={14} /> Intake Plan
          </Link>
          <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Member Directory
          </Link>
        </div>

        {/* Header Section */}
        <div className="pt-8 pb-6 px-6 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
            }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-[#B8860B]" />
              <Leaf className="text-[#1E3F20]" size={24} />
              <div className="h-px w-16 bg-[#B8860B]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#1E3F20] tracking-wider mb-4 uppercase text-center max-w-4xl">
              Membership Intake Calendar
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <p className="text-lg md:text-2xl text-[#B8860B] font-medium tracking-[0.2em] uppercase">
                July 2026 – January 2027
              </p>
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            </div>
          </motion.div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex justify-center mb-10 px-4">
          <div className="bg-white border border-[#B8860B]/30 p-1.5 rounded-full flex shadow-[0_4px_12px_rgba(30,63,32,0.04)] z-20 relative">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                viewMode === 'interactive'
                  ? 'bg-[#1E3F20] text-white shadow-md'
                  : 'text-[#1E3F20] hover:bg-[#B8860B]/10'
              }`}
            >
              <LayoutList size={14} /> Interactive Grid
            </button>
            <button
              onClick={() => setViewMode('flyer')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                viewMode === 'flyer'
                  ? 'bg-[#1E3F20] text-white shadow-md'
                  : 'text-[#1E3F20] hover:bg-[#B8860B]/10'
              }`}
            >
              <CalendarDays size={14} /> Official Flyer
            </button>
          </div>
        </div>

        {viewMode === 'flyer' ? (
          <div className="max-w-[1300px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left side: The Flyer Image */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="bg-white border-2 border-[#B8860B] rounded-xl p-6 shadow-[0_12px_40px_rgba(30,63,32,0.12)] relative w-full overflow-hidden max-w-[800px]">
                  {/* Gold/Ivy Corner Ornaments */}
                  <div className="absolute top-2 left-2 text-[#1E3F20]/20 pointer-events-none">
                    <Leaf size={24} className="transform -rotate-45" />
                  </div>
                  <div className="absolute top-2 right-2 text-[#1E3F20]/20 pointer-events-none">
                    <Leaf size={24} className="transform rotate-45" />
                  </div>
                  
                  {/* Main Image Frame */}
                  <div className="group relative border border-[#B8860B]/30 rounded-lg overflow-hidden cursor-zoom-in bg-[#FDFCF0]" onClick={() => setIsZoomed(true)}>
                    <img 
                      src={imageSrc} 
                      alt="Membership Intake Calendar Flyer" 
                      className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback if image not found or failed to load
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://picsum.photos/seed/kpi-calendar/1200/900?blur=1';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="bg-[#FDFCF0] text-[#1E3F20] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg">
                        <ZoomIn size={16} /> Click to Expand
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-[#B8860B] text-xs font-semibold mt-4 italic">
                    * Official Membership Intake Calendar Infographic Flyer (July 2026 – January 2027)
                  </p>
                </div>
              </div>

              {/* Right side: Sidebar with details, download, and optional upload */}
              <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                
                {/* Quick Actions Card */}
                <div className="bg-white border border-[#B8860B]/30 rounded-xl p-6 shadow-[0_4px_20px_rgba(30,63,32,0.04)]">
                  <h2 className="text-[#1E3F20] font-serif text-xl uppercase tracking-wider mb-4 border-b border-[#B8860B]/20 pb-2">
                    Flyer Actions
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href={imageSrc} 
                      download="Membership_Intake_Calendar.jpg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#1E3F20] hover:bg-[#1E3F20]/90 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-center"
                    >
                      <Download size={16} /> Download Flyer File
                    </a>
                    
                    <button 
                      onClick={() => setIsZoomed(true)}
                      className="flex-1 border border-[#1E3F20] hover:bg-[#1E3F20]/5 text-[#1E3F20] font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                      <ZoomIn size={16} /> Fullscreen Zoom
                    </button>
                  </div>
                </div>

                {/* Upload Panel for Admin/Officer */}
                {(userRole === 'admin' || userRole === 'officer') && (
                  <div className="bg-white border border-[#B8860B]/30 rounded-xl p-6 shadow-[0_4px_20px_rgba(30,63,32,0.04)]">
                    <h2 className="text-[#1E3F20] font-serif text-xl uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Upload size={18} className="text-[#B8860B]" /> Update Official Flyer
                    </h2>
                    <p className="text-gray-500 text-xs mb-4">
                      As an authorized officer, you can upload a new designed calendar flyer to replace the official image instantly.
                    </p>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        isDragging 
                          ? 'border-[#1E3F20] bg-[#1E3F20]/5 scale-[0.99]' 
                          : 'border-[#B8860B]/30 hover:border-[#1E3F20] hover:bg-[#B8860B]/5'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      
                      {uploading ? (
                        <div className="flex flex-col items-center py-4">
                          <Loader2 className="animate-spin text-[#1E3F20] mb-2" size={36} />
                          <p className="text-sm font-semibold text-[#1E3F20]">Saving new flyer to server...</p>
                        </div>
                      ) : uploadSuccess ? (
                        <div className="flex flex-col items-center py-4 text-green-700">
                          <CheckCircle className="mb-2" size={36} />
                          <p className="text-sm font-bold">Flyer Updated Successfully!</p>
                          <p className="text-xs text-gray-400 mt-1">Refreshed live across the portal.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-[#B8860B]/10 flex items-center justify-center mb-3">
                            <Image className="text-[#B8860B]" size={24} />
                          </div>
                          <p className="text-[#1E3F20] text-sm font-bold mb-1">
                            Drag & drop or Click to browse
                          </p>
                          <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                            PNG, JPG, or JPEG up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {uploadError && (
                      <div className="mt-3 text-red-600 text-xs font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                        {uploadError}
                      </div>
                    )}
                  </div>
                )}

                {/* Milestone Dates Card */}
                <div className="bg-white border border-[#B8860B]/30 rounded-xl p-6 shadow-[0_4px_20px_rgba(30,63,32,0.04)] flex-grow">
                  <h2 className="text-[#1E3F20] font-serif text-xl uppercase tracking-wider mb-4 border-b border-[#B8860B]/20 pb-2 flex items-center gap-2">
                    <Clock size={18} className="text-[#B8860B]" /> Milestone Dates
                  </h2>
                  
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {[
                      { step: 1, title: 'Inquire Within', date: 'Jul 8, 2026', desc: 'Formal start of the outreach period.' },
                      { step: 3, title: 'Application Due', date: 'Jul 21, 2026', desc: 'Application packages must be complete.' },
                      { step: 5, title: 'Tea Time Gatherings', date: 'Jul 26–Aug 1, 2026', desc: 'Social tea-time sessions with applicants.' },
                      { step: 7, title: 'Applicant Interviews', date: 'Aug 12, 14, 15, 2026', desc: 'Officer panel reviews.' },
                      { step: 10, title: 'Selection Notification', date: 'Aug 27, 2026', desc: 'Final notification letters dispatched.' },
                      { step: 14, title: 'Intake Commencement', date: 'Sep 17, 2026', desc: 'Education sessions and formal curriculum begin.' },
                      { step: 21, title: 'Initiation Weekend', date: 'Jan 15–17, 2027', desc: 'Culmination and formal induction ceremonies.' },
                    ].map((m) => (
                      <div key={m.step} className="flex gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-[#1E3F20] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                          {m.step}
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-[#1E3F20]">{m.title}</h4>
                            <span className="text-xs font-bold text-[#B8860B] whitespace-nowrap">{m.date}</span>
                          </div>
                          <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Grid Layout */
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 md:gap-8 relative pt-4">
              
              {events.map((event, index) => (
                <motion.div
                  key={event.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={itemVariants}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="bg-white border-2 border-[#B8860B] rounded-xl p-4 w-full h-full flex flex-col items-center text-center shadow-[0_8px_20px_rgba(30,63,32,0.08)] relative hover:-translate-y-1 transition-transform duration-300">
                    
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1E3F20] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-[#FDFCF0] shadow-md z-10">
                      {event.step}
                    </div>

                    <div className="mt-4 mb-3">
                      <event.icon size={36} strokeWidth={1.5} className="text-[#1E3F20]" />
                    </div>
                    
                    <h3 className="text-[#1E3F20] font-bold text-sm leading-tight mb-3 flex-grow">
                      {event.title}
                    </h3>
                    
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B8860B]/50 to-transparent my-2" />
                    
                    <p className="text-[#B8860B] text-xs font-semibold tracking-wider uppercase mt-1">
                      {event.date}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Leaf Accents */}
        <div className="flex justify-between items-end mt-20 px-8 opacity-40 pointer-events-none">
          <Leaf size={64} className="text-[#1E3F20] transform -scale-x-100" />
          <Leaf size={64} className="text-[#1E3F20]" />
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 transition-all duration-300">
          {/* Close button */}
          <button 
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50 cursor-pointer shadow-lg border border-white/10"
          >
            <X size={24} />
          </button>
          
          {/* Flyer Image Container */}
          <div className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center overflow-hidden">
            <img 
              src={imageSrc} 
              alt="Membership Intake Calendar Flyer Fullscreen" 
              className="max-w-full max-h-full object-contain select-none rounded shadow-2xl border border-[#B8860B]/40"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://picsum.photos/seed/kpi-calendar/1200/900?blur=1';
              }}
            />
          </div>
          
          <div className="mt-6 flex gap-4 text-center">
            <a 
              href={imageSrc} 
              download="Membership_Intake_Calendar.jpg"
              className="bg-[#1E3F20] hover:bg-[#1E3F20]/90 border border-[#B8860B] text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg transition-colors cursor-pointer"
            >
              <Download size={14} /> Download Flyer File
            </a>
            <button 
              onClick={() => setIsZoomed(false)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 text-xs uppercase tracking-widest transition-colors cursor-pointer"
            >
              Close View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
