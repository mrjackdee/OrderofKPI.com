import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Save, 
  Send, 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Users, 
  MessageSquare, 
  Info,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react';
import { saveApplication, fetchApplication } from '../lib/memberDb';

interface ApplicationData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  employment: string;
  position: string;
  degrees: string;
  honors: string;
  organizations: string;
  priorKnowledge: string;
  essay1: string;
  essay2: string;
  essay3: string;
  essay4: string;
  essay5: string;
  isFraternityMember: string;
  fraternityDetails: string;
  hasAkaFamily: string;
  akaFamilyDetails: string;
  previousApplied: string;
  previousAppliedDetails: string;
  socialUrls: string;
}

const initialData: ApplicationData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  phone: '',
  address: '',
  employment: '',
  position: '',
  degrees: '',
  honors: '',
  organizations: '',
  priorKnowledge: '',
  essay1: '',
  essay2: '',
  essay3: '',
  essay4: '',
  essay5: '',
  isFraternityMember: '',
  fraternityDetails: '',
  hasAkaFamily: '',
  akaFamilyDetails: '',
  previousApplied: '',
  previousAppliedDetails: '',
  socialUrls: '',
};

const Section = ({ title, icon: Icon, isOpen, onToggle, children, isCompleted }: any) => (
  <div className="border border-gold/20 rounded-2xl overflow-hidden bg-white shadow-soft transition-all duration-300 hover:border-gold/40">
    <button 
      onClick={onToggle}
      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gold/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${isOpen ? 'bg-ivy text-cream' : 'bg-gold/10 text-ivy'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-display font-bold text-ivy tracking-tight">{title}</h3>
        </div>
      </div>
      <ChevronDown 
        size={20} 
        className={`text-gold transition-transform duration-500 ${isOpen ? 'rotate-180' : 'opacity-40'}`} 
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
        >
          <div className="px-6 pb-8 pt-2 border-t border-gold/10">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", required = false, description }: any) => (
  <div className="space-y-1.5">
    <label className="text-[11px] text-ivy/60 uppercase tracking-widest font-bold ml-1 flex justify-between">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-cream/30 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy focus:bg-white transition-all placeholder:text-ivy/20"
      placeholder={placeholder}
    />
    {description && <p className="text-[10px] text-ivy/40 ml-1">{description}</p>}
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, required = false, minWords, maxWords, description }: any) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isError = (minWords && wordCount < minWords) || (maxWords && wordCount > maxWords);

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-ivy/60 uppercase tracking-widest font-bold ml-1 flex justify-between">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cream/30 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy focus:bg-white transition-all placeholder:text-ivy/20 min-h-[120px] resize-y"
        placeholder={placeholder}
      />
      <div className="flex justify-between items-center px-1">
        {description ? (
          <p className="text-[10px] text-ivy/40">{description}</p>
        ) : (
          <div />
        )}
        <span className={`text-[10px] font-bold ${isError ? 'text-red-500' : 'text-ivy/40'}`}>
          {wordCount} words {minWords ? `(Min: ${minWords})` : ''} {maxWords ? `(Max: ${maxWords})` : ''}
        </span>
      </div>
    </div>
  );
};

const RadioGroup = ({ label, value, onChange, options, required = false }: any) => (
  <div className="space-y-3">
    <label className="text-[11px] text-ivy/60 uppercase tracking-widest font-bold ml-1 flex justify-between">
      <span>{label}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-wrap gap-4">
      {options.map((opt: any) => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 transition-all ${value === opt.value ? 'border-ivy bg-ivy' : 'border-gold/30 group-hover:border-gold/60'}`}>
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-cream" />}
            </div>
          </div>
          <span className={`text-sm transition-colors ${value === opt.value ? 'text-ivy font-medium' : 'text-ivy/60 group-hover:text-ivy/80'}`}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  </div>
);

interface ApplicationProps {
  onUnsavedChangesChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<any>) | null>;
}

export default function MembershipApplication({ onUnsavedChangesChange, saveRef }: ApplicationProps) {
  const [data, setData] = useState<ApplicationData>(initialData);
  const [openSection, setOpenSection] = useState<string | null>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const email = sessionStorage.getItem('userEmail') || '';

  useEffect(() => {
    const loadData = async () => {
      if (!email) return;
      const res = await fetchApplication(email);
      if (res.success && res.application) {
        if (res.application.status === 'submitted') {
          setSubmitted(true);
        }
        const appData = res.application.data || res.application;
        const mappedData: any = {};
        const fields: (keyof ApplicationData)[] = [
          'firstName', 'middleName', 'lastName', 'dateOfBirth', 'phone', 'address',
          'employment', 'position', 'degrees', 'honors', 'organizations', 'priorKnowledge',
          'essay1', 'essay2', 'essay3', 'essay4', 'essay5',
          'isFraternityMember', 'fraternityDetails', 'hasAkaFamily', 'akaFamilyDetails',
          'previousApplied', 'previousAppliedDetails', 'socialUrls'
        ];
        fields.forEach(f => {
          if (appData[f] !== undefined) {
            if (f === 'isFraternityMember' || f === 'hasAkaFamily' || f === 'previousApplied') {
              if (appData[f] === true || appData[f] === 'yes') {
                mappedData[f] = 'yes';
              } else if (appData[f] === false || appData[f] === 'no') {
                mappedData[f] = 'no';
              } else {
                mappedData[f] = appData[f] || '';
              }
            } else {
              mappedData[f] = appData[f] || '';
            }
          }
        });
        setData(prev => ({ ...prev, ...mappedData }));
      }
      setLoading(false);
    };
    loadData();
  }, [email]);

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const updateField = (field: keyof ApplicationData, value: any) => {
    setData(prev => {
      if (prev[field] === value) return prev;
      setHasUnsavedChanges(true);
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async (isManual = true) => {
    if (!email) return;
    if (isManual) setSaving(true);
    const res = await saveApplication(email, data, 'draft');
    if (res.success) {
      setHasUnsavedChanges(false);
      if (isManual) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
    if (isManual) {
      setSaving(false);
    }
    return res;
  };

  // Expose save function to parent ref
  useEffect(() => {
    if (saveRef) {
      saveRef.current = () => handleSave(true);
    }
    return () => {
      if (saveRef) {
        saveRef.current = null;
      }
    };
  }, [saveRef, data]);

  // Debounced auto-save
  useEffect(() => {
    if (loading || submitted || !email || !hasUnsavedChanges) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await saveApplication(email, data, 'draft');
        if (res.success) {
          setHasUnsavedChanges(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [data, loading, submitted, email, hasUnsavedChanges]);

  // Prompt user before exiting window/tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSubmit = async () => {
    if (!email) return;
    setError('');
    
    // Simple validation check
    const requiredFields: (keyof ApplicationData)[] = [
      'firstName', 'lastName', 'dateOfBirth', 'phone', 'address', 
      'essay1', 'essay2', 'essay3', 'essay4', 'essay5',
      'isFraternityMember', 'hasAkaFamily', 'previousApplied'
    ];
    const missing = requiredFields.filter(f => !data[f]);

    // Also validate conditional disclosures
    if (data.isFraternityMember === 'yes' && !data.fraternityDetails) {
      missing.push('fraternityDetails');
    }
    if (data.hasAkaFamily === 'yes' && !data.akaFamilyDetails) {
      missing.push('akaFamilyDetails');
    }
    if (data.previousApplied === 'yes' && !data.previousAppliedDetails) {
      missing.push('previousAppliedDetails');
    }
    
    if (missing.length > 0) {
      setError('Please complete all required fields and questions before submitting.');
      setOpenSection(null); // Close everything to show error or maybe open the first missing one
      return;
    }

    setSaving(true);
    const res = await saveApplication(email, data, 'submitted');
    setSaving(false);
    
    if (res.success) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.message || 'Failed to submit application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gold/20 rounded-[32px] p-10 md:p-16 text-center space-y-8 shadow-soft"
        >
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
            <CheckCircle size={48} className="text-gold" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-ivy tracking-tighter uppercase">
              Application <span className="text-gold">Complete</span>
            </h1>
            <p className="text-ivy/60 text-lg leading-relaxed font-body max-w-lg mx-auto">
              Thank you for submitting your application to Kappa Pi. Your information has been securely transmitted to the Membership Committee for review.
            </p>
          </div>
          <div className="pt-6">
            <div className="bg-cream p-6 rounded-2xl border border-gold/20 text-sm text-ivy/80 inline-block">
              <p className="font-bold text-ivy mb-2 uppercase tracking-widest text-[11px]">What Happens Next?</p>
              <p className="font-body">You will be notified via email once your application has been reviewed by the committee.</p>
            </div>
          </div>
          <div className="pt-8">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-10 py-4 bg-ivy text-cream font-bold uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Return to Portal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-ivy tracking-tighter uppercase italic">
          Member <span className="text-gold">Application</span>
        </h1>
      </div>

      <div className="bg-ivy p-8 rounded-3xl space-y-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <AlertCircle size={80} className="text-gold" />
        </div>
        <h3 className="text-gold font-bold uppercase tracking-[0.2em] text-[11px] flex items-center gap-2">
          <AlertCircle size={14} /> Legal Disclaimer
        </h3>
        <p className="text-cream/80 text-sm leading-relaxed italic font-body">
          "I understand that falsification of any information on this application or attachments will eliminate me from being considered for membership. By submitting this form, I verify that all of the information I have provided is true and correct. I understand that at any time, Kappa Pi, can rescind any rights or privileges to an applicant based on the submission of false information or documents."
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-center gap-3 font-body"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <Section 
          title="Personal Information" 
          icon={User} 
          isOpen={openSection === 'personal'} 
          onToggle={() => setOpenSection(openSection === 'personal' ? null : 'personal')}
          isCompleted={data.firstName && data.lastName && data.dateOfBirth}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="First Name" value={data.firstName} onChange={(v: string) => updateField('firstName', v)} required />
            <Input label="Middle Name" value={data.middleName} onChange={(v: string) => updateField('middleName', v)} />
            <Input label="Last Name" value={data.lastName} onChange={(v: string) => updateField('lastName', v)} required />
            <Input label="Date of Birth" value={data.dateOfBirth} onChange={(v: string) => updateField('dateOfBirth', v)} type="date" required />
            <Input label="Home/Cell Phone" value={data.phone} onChange={(v: string) => updateField('phone', v)} required />
            <Input label="Email Address" value={email} onChange={() => {}} description="Managed via profile" />
          </div>
          <div className="mt-6">
            <Input label="Permanent Address / City / State / Zip" value={data.address} onChange={(v: string) => updateField('address', v)} required />
          </div>
        </Section>


        {/* Professional Profile */}
        <Section 
          title="Professional Profile" 
          icon={Briefcase} 
          isOpen={openSection === 'professional'} 
          onToggle={() => setOpenSection(openSection === 'professional' ? null : 'professional')}
          isCompleted={data.employment && data.position}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Place of Employment" value={data.employment} onChange={(v: string) => updateField('employment', v)} />
            <Input label="Title / Position" value={data.position} onChange={(v: string) => updateField('position', v)} />
          </div>
        </Section>

        {/* Academic History */}
        <Section 
          title="Academic History" 
          icon={GraduationCap} 
          isOpen={openSection === 'academic'} 
          onToggle={() => setOpenSection(openSection === 'academic' ? null : 'academic')}
          isCompleted={data.degrees}
        >
          <div className="space-y-6">
            <TextArea 
              label="Degree(s) Earned; Conferred Date; Institution" 
              value={data.degrees} 
              onChange={(v: string) => updateField('degrees', v)} 
              placeholder="Example: Bachelor of Science in Biology; May 2018; Morehouse College"
            />
            <TextArea 
              label="Honors and Achievements" 
              value={data.honors} 
              onChange={(v: string) => updateField('honors', v)} 
              placeholder="List honors received while pursuing your degree(s)..."
            />
          </div>
        </Section>

        {/* Community Involvement */}
        <Section 
          title="Community Involvement" 
          icon={Users} 
          isOpen={openSection === 'community'} 
          onToggle={() => setOpenSection(openSection === 'community' ? null : 'community')}
          isCompleted={data.organizations}
        >
          <div className="space-y-6">
            <TextArea 
              label="Organization Involvement" 
              value={data.organizations} 
              onChange={(v: string) => updateField('organizations', v)} 
              placeholder="Organization Name, Purpose, Position Held, Dates of Service..."
              description="List current involvement that directly impacts your community."
            />
            <TextArea 
              label="Prior Knowledge of Kappa Pi" 
              value={data.priorKnowledge} 
              onChange={(v: string) => updateField('priorKnowledge', v)} 
              placeholder="Describe your prior knowledge of the fraternity..."
            />
          </div>
        </Section>

        {/* Essays */}
        <Section 
          title="Questions" 
          icon={MessageSquare} 
          isOpen={openSection === 'essays'} 
          onToggle={() => setOpenSection(openSection === 'essays' ? null : 'essays')}
          isCompleted={data.essay1 && data.essay5}
        >
          <div className="space-y-10">
            <TextArea 
              label="Question 1: Purpose of Kappa Pi" 
              value={data.essay1} 
              onChange={(v: string) => updateField('essay1', v)} 
              maxWords={50}
              placeholder="Describe the purpose of Kappa Pi in your own words..."
              required
            />
            <TextArea 
              label="Question 2: Community Role Model" 
              value={data.essay2} 
              onChange={(v: string) => updateField('essay2', v)} 
              minWords={150}
              placeholder="How have you served as a role model for young people..."
              required
            />
            <TextArea 
              label="Question 3: Service Projects" 
              value={data.essay3} 
              onChange={(v: string) => updateField('essay3', v)} 
              minWords={150}
              placeholder="Describe participation in service projects..."
              required
            />
            <TextArea 
              label="Question 4: Impact for Black/Brown Queer & Trans* Communities" 
              value={data.essay4} 
              onChange={(v: string) => updateField('essay4', v)} 
              minWords={150}
              placeholder="What have you done to help encourage positive self-esteem and involvement..."
              required
            />
            <TextArea 
              label="Question 5: Future Contributions" 
              value={data.essay5} 
              onChange={(v: string) => updateField('essay5', v)} 
              minWords={150}
              placeholder="What talents do you possess to ensure premier status..."
              required
            />
          </div>
        </Section>

        {/* Additional Disclosures */}
        <Section 
          title="Additional Disclosures" 
          icon={Info} 
          isOpen={openSection === 'disclosures'} 
          onToggle={() => setOpenSection(openSection === 'disclosures' ? null : 'disclosures')}
          isCompleted={true}
        >
          <div className="space-y-10">
            <div className="space-y-6 p-6 rounded-2xl bg-gold/5 border border-gold/10">
              <RadioGroup 
                label="Are you a member of a fraternity?" 
                value={data.isFraternityMember} 
                onChange={(v: string) => updateField('isFraternityMember', v)}
                options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                required
              />
              {data.isFraternityMember === 'yes' && (
                <Input 
                  label="Fraternity Name & Initiation Date" 
                  value={data.fraternityDetails} 
                  onChange={(v: string) => updateField('fraternityDetails', v)} 
                  required
                />
              )}
            </div>

            <div className="space-y-6 p-6 rounded-2xl bg-gold/5 border border-gold/10">
              <RadioGroup 
                label="Do you have a family member in Alpha Kappa Alpha Sorority, Inc.?" 
                value={data.hasAkaFamily} 
                onChange={(v: string) => updateField('hasAkaFamily', v)}
                options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                required
              />
              {data.hasAkaFamily === 'yes' && (
                <TextArea 
                  label="Family Member Details" 
                  value={data.akaFamilyDetails} 
                  onChange={(v: string) => updateField('akaFamilyDetails', v)} 
                  placeholder="Names, relationships, chapter, and year of initiation..."
                  required
                />
              )}
            </div>

            <div className="space-y-6 p-6 rounded-2xl bg-gold/5 border border-gold/10">
              <RadioGroup 
                label="Have you previously applied for membership into Kappa Pi?" 
                value={data.previousApplied} 
                onChange={(v: string) => updateField('previousApplied', v)}
                options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                required
              />
              {data.previousApplied === 'yes' && (
                <TextArea 
                  label="Explanation for Discontinuing" 
                  value={data.previousAppliedDetails} 
                  onChange={(v: string) => updateField('previousAppliedDetails', v)} 
                  placeholder="Explain why you did not continue or discontinued the process..."
                  required
                />
              )}
            </div>
          </div>
        </Section>

        {/* Social Presence */}
        <Section 
          title="Social & Professional Presence" 
          icon={Globe} 
          isOpen={openSection === 'social'} 
          onToggle={() => setOpenSection(openSection === 'social' ? null : 'social')}
          isCompleted={data.socialUrls}
        >
          <TextArea 
            label="Website URLs (Facebook, LinkedIn, SnapChat, Twitter, Instagram)" 
            value={data.socialUrls} 
            onChange={(v: string) => updateField('socialUrls', v)} 
            placeholder="Write 'none' if this does not apply..."
            description="List any websites that depict you in a personal or professional manner."
          />
        </Section>
      </div>

      <div className="sticky bottom-8 left-0 right-0 z-40 px-4 md:px-0">
        <div className="max-w-4xl mx-auto bg-ivy/95 backdrop-blur-xl border border-gold/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full transition-all duration-300 ${
              saveSuccess 
                ? 'bg-green-600 text-cream scale-110' 
                : hasUnsavedChanges 
                  ? 'bg-amber-500 text-ivy animate-pulse' 
                  : 'bg-gold text-ivy'
            }`}>
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-cream font-bold text-sm font-display">
                {saveSuccess 
                  ? 'Draft Saved Successfully!' 
                  : hasUnsavedChanges 
                    ? 'Unsaved Draft Changes' 
                    : 'Draft Progress Saved'}
              </p>
              <p className="text-gold text-[10px] uppercase tracking-widest font-bold">
                {saveSuccess 
                  ? 'Changes written to secure cloud storage' 
                  : hasUnsavedChanges 
                    ? 'Auto-saving soon or click Save Draft...' 
                    : `Last saved: ${new Date().toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-gold/30 text-gold font-bold uppercase tracking-widest text-[11px] hover:bg-gold/10 transition-all disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-gold text-ivy font-bold uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Send size={16} />
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
