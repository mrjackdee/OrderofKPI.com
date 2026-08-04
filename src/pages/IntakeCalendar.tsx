import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Heart, Users, Coffee, Edit3, ClipboardCheck, Mail, Video, 
  ThumbsUp, Star, Hand, Wallet, Sparkles, Shield, UserCheck, 
  CalendarDays, Leaf, GraduationCap, Clock, LayoutList,
  Download, ZoomIn, Upload, X, Loader2, CheckCircle, Image
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

const events = [
  { step: 1, title: 'Interest Meeting #1', date: 'Sunday, August 2', time: '1:00 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 2, title: 'Interest Meeting #2', date: 'Monday, August 3', time: '9:08 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 3, title: 'Applications Distributed', date: 'After each interest meeting', time: 'Distributed to attendees', category: 'Applications & Scoring', icon: Mail },
  { step: 4, title: 'Applications Due', date: 'Friday, August 7', time: '12:00 PM (noon) ET', category: 'Applications & Scoring', icon: ClipboardCheck },
  { step: 5, title: 'Application Scoring', date: 'Friday, August 7 – Sunday, August 9', time: 'Scoring period', category: 'Applications & Scoring', icon: Edit3 },
  { step: 6, title: 'Candidate Notifications & Tea Time Invites', date: 'Monday, August 10, 2026', time: 'Scoring removals & Tea Time invites', category: 'Applications & Scoring', icon: Star },
  { step: 7, title: 'Tea Time Period', date: 'Wednesday, August 12 – Sunday, August 16', time: 'Tea Time period', category: 'Tea Time', icon: Coffee },
  { step: 8, title: 'Facebook Group Opens', date: 'Wednesday, August 12 – Sunday, August 16', time: 'Opens Aug 12 at 7:00 PM ET', category: 'Tea Time', icon: Users },
  { step: 9, title: 'Tea Time Zoom Call', date: 'Thursday, August 13', time: '8:00 PM – 9:30 PM ET', category: 'Tea Time', icon: Video },
  { step: 10, title: 'Candidate Interviews', date: 'Wednesday, August 19 – Friday, August 21', time: '20 minutes each (times TBD)', category: 'Interviews & Review', icon: UserCheck },
  { step: 11, title: 'Makeup Interviews', date: 'Monday, August 24', time: 'If needed', category: 'Interviews & Review', icon: UserCheck },
  { step: 12, title: 'Interview Video Review', date: 'Tuesday, August 25 – Friday, August 28', time: 'Review by active members', category: 'Interviews & Review', icon: Video },
  { step: 13, title: 'MIP Voting Period', date: 'Monday, August 31 – Wednesday, September 2', time: 'MIP voting period', category: 'Voting & Next Steps', icon: ThumbsUp },
  { step: 14, title: 'Candidate Notifications', date: 'Friday, September 4', time: 'Candidate notifications', category: 'Voting & Next Steps', icon: Star },
  { step: 15, title: 'No Contact Period Begins', date: 'Monday, September 7', time: 'No contact period begins', category: 'Voting & Next Steps', icon: Hand },
  { step: 16, title: 'First Initiation Payment Due', date: 'Friday, September 11', time: 'Due from candidates for membership', category: 'Voting & Next Steps', icon: Wallet },
];

const deanEvents = [
  { step: 1, title: 'Chapter Notification & Nominations Open', date: 'Friday, August 7', time: 'Chapter notification of Dean process and opening of nomination submissions', icon: Mail },
  { step: 2, title: 'Dean Nominations Accepted', date: 'Monday, August 10 – Wednesday, August 12', time: 'Closes 9:08 PM ET on August 12', icon: Edit3 },
  { step: 3, title: 'Special Meeting', date: 'Sunday, August 16', time: '7:00 PM ET', icon: Users },
  { step: 4, title: 'Dean Team Voting', date: 'Monday, August 17 – Wednesday, August 19', time: 'Dean team voting', icon: ThumbsUp },
  { step: 5, title: 'Announcement of Dean', date: 'Friday, August 21', time: 'Announcement of Dean', icon: Star },
  { step: 6, title: 'Dean Selects Assistant Dean & Team', date: 'Monday, August 24 – Friday, August 28', time: 'Assistant Dean of Pledges and Dean team', icon: UserCheck },
  { step: 7, title: 'Drop Date for Dean Team', date: 'Friday, August 28', time: 'Drop date for Dean team', icon: Shield },
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

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header background / styling
    doc.setFillColor(30, 63, 32); // #1E3F20 Ivy
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(253, 252, 240); // #FDFCF0 Cream
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MEMBERSHIP INTAKE CALENDAR', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11); // Gold #B8860B
    doc.text('August 2026 – September 2026', 105, 25, { align: 'center' });

    let y = 48;
    const sections = [
      {
        title: 'I. Interest Meetings',
        events: events.filter(e => e.category === 'Interest Meetings')
      },
      {
        title: 'II. Candidate Applications and Scoring',
        events: events.filter(e => e.category === 'Applications & Scoring')
      },
      {
        title: 'III. Tea Time',
        events: events.filter(e => e.category === 'Tea Time')
      },
      {
        title: 'IV. Candidate Interviews and Review',
        events: events.filter(e => e.category === 'Interviews & Review')
      },
      {
        title: 'V. Voting, Notifications, and Next Steps',
        events: events.filter(e => e.category === 'Voting & Next Steps')
      }
    ];

    doc.setFont('Helvetica', 'normal');

    sections.forEach((sec) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Section title banner
      doc.setFillColor(245, 243, 230);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 63, 32);
      doc.text(sec.title, 16, y);
      y += 8;

      sec.events.forEach((ev) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 63, 32);
        doc.text(`• #${ev.step} - ${ev.title}`, 18, y);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`${ev.date} | ${ev.time}`, 120, y);
        y += 6;
      });
      y += 6;
    });

    // Dean Process Timeline in PDF
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(245, 243, 230);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 63, 32);
    doc.text('Dean Process Timeline', 16, y);
    y += 8;

    deanEvents.forEach((ev) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 63, 32);
      doc.text(`• #${ev.step} - ${ev.title}`, 18, y);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${ev.date} | ${ev.time}`, 120, y);
      y += 6;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Official Membership Intake Calendar — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save('Membership_Intake_Calendar_2026.pdf');
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-20 relative overflow-hidden">
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
                August 2026 – September 2026
              </p>
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            </div>
          </motion.div>
        </div>

        {/* View Mode Switcher & PDF Export */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 px-4">
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

          <button
            onClick={exportToPDF}
            className="bg-[#B8860B] hover:bg-[#1E3F20] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Download size={14} /> Export Professional PDF
          </button>
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
                      { step: 1, title: 'Interest Meeting #1', date: 'Sun, Aug 2, 2026', desc: '1:00 PM ET — Session 1 for prospective candidates.' },
                      { step: 2, title: 'Interest Meeting #2', date: 'Mon, Aug 3, 2026', desc: '9:08 PM ET — Session 2 for prospective candidates.' },
                      { step: 4, title: 'Applications Due', date: 'Wed, Aug 5, 2026', desc: '11:59 PM ET deadline for candidate submission.' },
                      { step: 6, title: 'Scoring & Invites', date: 'Mon, Aug 10, 2026', desc: 'Tea Time invitations issued to advancing candidates.' },
                      { step: 8, title: 'Tea Time Zoom Call', date: 'Thu, Aug 13, 2026', desc: '8:00 PM – 9:30 PM ET candidate social gathering.' },
                      { step: 9, title: 'Candidate Interviews', date: 'Aug 19–21, 2026', desc: '20-minute individual interview panels.' },
                      { step: 12, title: 'MIP Voting Period', date: 'Aug 31 – Sep 2', desc: 'Financial chapter members selection voting.' },
                      { step: 13, title: 'Selection Notifications', date: 'Fri, Sep 4, 2026', desc: 'Official notifications dispatched to candidates.' },
                      { step: 14, title: 'No Contact Period', date: 'Mon, Sep 7, 2026', time: 'Formal restrictions take effect.' },
                      { step: 15, title: '1st Initiation Payment', date: 'Fri, Sep 11, 2026', desc: 'First initiation dues payment deadline.' },
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
                          <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{m.desc || m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Interactive Grid & Section Breakdown Layout */
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-12">
            
            {/* Section Breakdown Cards */}
            <div className="space-y-8">
              {[
                {
                  sectionTitle: 'I. Interest Meetings',
                  events: events.filter(e => e.category === 'Interest Meetings')
                },
                {
                  sectionTitle: 'II. Candidate Applications and Scoring',
                  events: events.filter(e => e.category === 'Applications & Scoring')
                },
                {
                  sectionTitle: 'III. Tea Time',
                  events: events.filter(e => e.category === 'Tea Time')
                },
                {
                  sectionTitle: 'IV. Candidate Interviews and Review',
                  events: events.filter(e => e.category === 'Interviews & Review')
                },
                {
                  sectionTitle: 'V. Voting, Notifications, and Next Steps',
                  events: events.filter(e => e.category === 'Voting & Next Steps')
                }
              ].map((section, secIdx) => (
                <div key={secIdx} className="bg-[#FFFFFF] border border-[#B8860B]/30 rounded-2xl p-6 md:p-8 shadow-[0_6px_24px_rgba(30,63,32,0.05)]">
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E3F20] font-bold tracking-wide mb-6 border-b border-[#B8860B]/20 pb-3 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#B8860B]" />
                    {section.sectionTitle}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.events.map((event) => (
                      <div 
                        key={event.step}
                        className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl p-5 flex flex-col justify-between hover:border-[#1E3F20] transition-all duration-300 relative group shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-[#1E3F20] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              Step #{event.step}
                            </span>
                            <event.icon size={22} className="text-[#B8860B] group-hover:scale-110 transition-transform" />
                          </div>
                          
                          <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                            {event.title}
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#B8860B]/20">
                          <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                            {event.date}
                          </p>
                          <p className="text-[#B8860B] text-xs font-semibold mt-0.5">
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Dean Process Timeline Section */}
            <div className="bg-[#FFFFFF] border border-[#B8860B]/30 rounded-2xl p-6 md:p-8 shadow-[0_6px_24px_rgba(30,63,32,0.05)] mt-12">
              <h2 className="text-xl md:text-2xl font-serif text-[#1E3F20] font-bold tracking-wide mb-6 border-b border-[#B8860B]/20 pb-3 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#1E3F20]" />
                Dean Process Timeline
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deanEvents.map((event) => (
                  <div 
                    key={event.step}
                    className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl p-5 flex flex-col justify-between hover:border-[#1E3F20] transition-all duration-300 relative group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-[#1E3F20] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Dean Step #{event.step}
                        </span>
                        <event.icon size={22} className="text-[#B8860B] group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                        {event.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#B8860B]/20">
                      <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                        {event.date}
                      </p>
                      <p className="text-[#B8860B] text-xs font-semibold mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
