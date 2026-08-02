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

interface ValidationErrorItem {
  sectionKey: string;
  sectionTitle: string;
  fieldLabel: string;
  reason: string;
}

const validateApplication = (data: ApplicationData): ValidationErrorItem[] => {
  const errors: ValidationErrorItem[] = [];

  // Personal Info
  if (!data.firstName?.trim()) {
    errors.push({ sectionKey: 'personal', sectionTitle: 'Personal Information', fieldLabel: 'First Name', reason: 'Field is required' });
  }
  if (!data.lastName?.trim()) {
    errors.push({ sectionKey: 'personal', sectionTitle: 'Personal Information', fieldLabel: 'Last Name', reason: 'Field is required' });
  }
  if (!data.dateOfBirth?.trim()) {
    errors.push({ sectionKey: 'personal', sectionTitle: 'Personal Information', fieldLabel: 'Date of Birth', reason: 'Field is required' });
  }
  if (!data.phone?.trim()) {
    errors.push({ sectionKey: 'personal', sectionTitle: 'Personal Information', fieldLabel: 'Home/Cell Phone', reason: 'Field is required' });
  }
  if (!data.address?.trim()) {
    errors.push({ sectionKey: 'personal', sectionTitle: 'Personal Information', fieldLabel: 'Permanent Address', reason: 'Field is required' });
  }

  // Questions (Essays)
  const countWords = (text: string) => text?.trim() ? text.trim().split(/\s+/).length : 0;

  // Question 1: Purpose of Kappa Pi (Max 50 words)
  const q1Words = countWords(data.essay1);
  if (!data.essay1?.trim()) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 1: Purpose of Kappa Pi', reason: 'Response is required' });
  } else if (q1Words > 50) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 1: Purpose of Kappa Pi', reason: `Exceeds 50-word maximum limit (currently ${q1Words} words)` });
  }

  // Question 2: Community Role Model (Min 150 words)
  const q2Words = countWords(data.essay2);
  if (!data.essay2?.trim()) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 2: Community Role Model', reason: 'Response is required (minimum 150 words)' });
  } else if (q2Words < 150) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 2: Community Role Model', reason: `Requires at least 150 words (currently ${q2Words} words)` });
  }

  // Question 3: Service Projects (Min 150 words)
  const q3Words = countWords(data.essay3);
  if (!data.essay3?.trim()) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 3: Service Projects', reason: 'Response is required (minimum 150 words)' });
  } else if (q3Words < 150) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 3: Service Projects', reason: `Requires at least 150 words (currently ${q3Words} words)` });
  }

  // Question 4: Impact for Black and Brown Queer & Trans Communities (Min 150 words)
  const q4Words = countWords(data.essay4);
  if (!data.essay4?.trim()) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 4: Impact for Black and Brown Queer & Trans Communities', reason: 'Response is required (minimum 150 words)' });
  } else if (q4Words < 150) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 4: Impact for Black and Brown Queer & Trans Communities', reason: `Requires at least 150 words (currently ${q4Words} words)` });
  }

  // Question 5: Future Contributions (Min 150 words)
  const q5Words = countWords(data.essay5);
  if (!data.essay5?.trim()) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 5: Future Contributions', reason: 'Response is required (minimum 150 words)' });
  } else if (q5Words < 150) {
    errors.push({ sectionKey: 'essays', sectionTitle: 'Questions', fieldLabel: 'Question 5: Future Contributions', reason: `Requires at least 150 words (currently ${q5Words} words)` });
  }

  // Additional Disclosures
  if (!data.isFraternityMember) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'Fraternity Membership Question', reason: 'Please select Yes or No' });
  } else if (data.isFraternityMember === 'yes' && !data.fraternityDetails?.trim()) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'Fraternity Name & Initiation Date', reason: 'Details required when selecting Yes' });
  }

  if (!data.hasAkaFamily) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'Alpha Kappa Alpha Family Question', reason: 'Please select Yes or No' });
  } else if (data.hasAkaFamily === 'yes' && !data.akaFamilyDetails?.trim()) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'AKA Family Member Details', reason: 'Details required when selecting Yes' });
  }

  if (!data.previousApplied) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'Previously Applied Question', reason: 'Please select Yes or No' });
  } else if (data.previousApplied === 'yes' && !data.previousAppliedDetails?.trim()) {
    errors.push({ sectionKey: 'disclosures', sectionTitle: 'Additional Disclosures', fieldLabel: 'Explanation for Discontinuing', reason: 'Explanation required when selecting Yes' });
  }

  // Social & Professional Presence
  if (!data.socialUrls?.trim()) {
    errors.push({ sectionKey: 'social', sectionTitle: 'Social & Professional Presence', fieldLabel: 'Social or professional website URLs', reason: 'Response is required (write "none" if not applicable)' });
  }

  return errors;
};

interface ApplicationProps {
  onUnsavedChangesChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<any>) | null>;
}

export default function MembershipApplication({ onUnsavedChangesChange, saveRef }: ApplicationProps) {
  const [data, setData] = useState<ApplicationData>(initialData);
  const [openSection, setOpenSection] = useState<string | null>(() => {
    return sessionStorage.getItem('lastApplicationSection') || 'personal';
  });

  useEffect(() => {
    if (openSection) {
      sessionStorage.setItem('lastApplicationSection', openSection);
    }
  }, [openSection]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
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
        if (res.application.last_saved_at || res.application.lastSavedAt || res.application.submitted_at || res.application.submittedAt) {
          const rawTime = res.application.last_saved_at || res.application.lastSavedAt || res.application.submitted_at || res.application.submittedAt;
          try {
            setLastSavedTime(new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } catch (e) {
            setLastSavedTime(null);
          }
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
      const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(formattedTime);
      if (isManual) {
        setSaveSuccess(true);
        setShowSaveModal(true);
        setTimeout(() => setSaveSuccess(false), 4000);
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
    
    // Comprehensive validation check
    const vErrors = validateApplication(data);
    
    if (vErrors.length > 0) {
      setValidationErrors(vErrors);
      setError(`Please complete all required fields and questions (${vErrors.length} required item${vErrors.length > 1 ? 's' : ''} need attention).`);
      
      // Auto-open the section of the first validation error
      if (vErrors[0]?.sectionKey) {
        setOpenSection(vErrors[0].sectionKey);
      }

      // Smooth scroll to error list
      setTimeout(() => {
        const errorElement = document.getElementById('application-validation-errors');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 200, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setValidationErrors([]);
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

      {/* Top Application Save Draft Action Toolbar */}
      <div className="bg-white border border-gold/30 rounded-2xl p-4 md:p-5 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl transition-all duration-300 ${
            saveSuccess 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : hasUnsavedChanges 
                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                : 'bg-gold/15 text-ivy border border-gold/30'
          }`}>
            {saveSuccess ? (
              <CheckCircle size={20} className="text-green-700" />
            ) : (
              <Save size={20} className="text-gold" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-ivy font-display">
                {saveSuccess 
                  ? 'Draft Saved' 
                  : hasUnsavedChanges 
                    ? 'Unsaved Draft Changes' 
                    : 'Application Saved'}
              </p>
              {lastSavedTime && (
                <span className="text-[10px] bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-md text-ivy font-mono">
                  Saved {lastSavedTime}
                </span>
              )}
            </div>
            <p className="text-[10px] text-ivy/60 font-body">
              {hasUnsavedChanges 
                ? 'Click Save Draft to save your latest changes.' 
                : 'Your responses are saved to your account and accessible whenever you log in.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-ivy font-bold uppercase tracking-widest text-xs hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ivy text-cream font-bold uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send size={16} className="text-gold" />
            Submit Form
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <motion.div 
          id="application-validation-errors"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/95 border-2 border-red-300 rounded-3xl p-6 shadow-xl space-y-4 font-body"
        >
          <div className="flex items-center gap-3 text-red-800 border-b border-red-200/80 pb-3">
            <div className="p-2.5 bg-red-100 rounded-2xl shrink-0">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base md:text-lg uppercase tracking-tight text-red-900">
                Incomplete Application — Action Required
              </h4>
              <p className="text-xs text-red-700">
                Please complete the following {validationErrors.length} required area{validationErrors.length > 1 ? 's' : ''} before submitting your application:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {validationErrors.map((err, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOpenSection(err.sectionKey);
                  const el = document.getElementById(`field-section-${err.sectionKey}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left bg-white border border-red-200/90 hover:border-red-400 hover:bg-red-50/50 p-3.5 rounded-2xl shadow-xs transition-all flex items-start gap-3 group cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                    {err.sectionTitle}
                  </p>
                  <p className="text-xs font-bold text-ivy group-hover:text-red-900 transition-colors truncate">
                    {err.fieldLabel}
                  </p>
                  <p className="text-[11px] text-red-600 font-medium">
                    {err.reason}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {error && validationErrors.length === 0 && (
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
        <div id="field-section-personal">
          <Section 
            title="Personal Information" 
            icon={User} 
            isOpen={openSection === 'personal'} 
            onToggle={() => setOpenSection(openSection === 'personal' ? null : 'personal')}
            isCompleted={data.firstName && data.lastName && data.dateOfBirth}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="What is your first name?" value={data.firstName} onChange={(v: string) => updateField('firstName', v)} required />
              <Input label="What is your middle name?" value={data.middleName} onChange={(v: string) => updateField('middleName', v)} />
              <Input label="What is your last name?" value={data.lastName} onChange={(v: string) => updateField('lastName', v)} required />
              <Input label="What is your date of birth?" value={data.dateOfBirth} onChange={(v: string) => updateField('dateOfBirth', v)} type="date" required />
              <Input label="What is your home or cell phone number?" value={data.phone} onChange={(v: string) => updateField('phone', v)} required />
              <Input label="What is your primary email address?" value={email} onChange={() => {}} description="Managed via candidate profile" />
            </div>
            <div className="mt-6">
              <Input label="What is your permanent address, city, state, and zip code?" value={data.address} onChange={(v: string) => updateField('address', v)} required />
            </div>
          </Section>
        </div>

        {/* Professional Profile */}
        <div id="field-section-professional">
          <Section 
            title="Professional Profile" 
            icon={Briefcase} 
            isOpen={openSection === 'professional'} 
            onToggle={() => setOpenSection(openSection === 'professional' ? null : 'professional')}
            isCompleted={data.employment && data.position}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="What is your current place of employment?" value={data.employment} onChange={(v: string) => updateField('employment', v)} />
              <Input label="What is your current job title or position?" value={data.position} onChange={(v: string) => updateField('position', v)} />
            </div>
          </Section>
        </div>

        {/* Academic History */}
        <div id="field-section-academic">
          <Section 
            title="Academic History" 
            icon={GraduationCap} 
            isOpen={openSection === 'academic'} 
            onToggle={() => setOpenSection(openSection === 'academic' ? null : 'academic')}
            isCompleted={data.degrees}
          >
            <div className="space-y-6">
              <TextArea 
                label="What degree(s) have you earned, including conferred dates and institutions attended?" 
                value={data.degrees} 
                onChange={(v: string) => updateField('degrees', v)} 
                placeholder="Example: Bachelor of Science in Biology; May 2018; Morehouse College"
              />
              <TextArea 
                label="What academic honors or achievements did you receive while pursuing your degree(s)?" 
                value={data.honors} 
                onChange={(v: string) => updateField('honors', v)} 
                placeholder="List honors received while pursuing your degree(s)..."
              />
            </div>
          </Section>
        </div>

        {/* Community Involvement */}
        <div id="field-section-community">
          <Section 
            title="Community Involvement" 
            icon={Users} 
            isOpen={openSection === 'community'} 
            onToggle={() => setOpenSection(openSection === 'community' ? null : 'community')}
            isCompleted={data.organizations}
          >
            <div className="space-y-6">
              <TextArea 
                label="What community or professional organizations are you currently involved with?" 
                value={data.organizations} 
                onChange={(v: string) => updateField('organizations', v)} 
                placeholder="Organization Name, Purpose, Position Held, Dates of Service..."
                description="List current involvement that directly impacts your community."
              />
              <TextArea 
                label="What is your prior knowledge of Kappa Pi?" 
                value={data.priorKnowledge} 
                onChange={(v: string) => updateField('priorKnowledge', v)} 
                placeholder="Describe your prior knowledge of the fraternity..."
              />
            </div>
          </Section>
        </div>

        {/* Essays */}
        <div id="field-section-essays">
          <Section 
            title="Questions" 
            icon={MessageSquare} 
            isOpen={openSection === 'essays'} 
            onToggle={() => setOpenSection(openSection === 'essays' ? null : 'essays')}
            isCompleted={data.essay1 && data.essay5}
          >
            <div className="space-y-10">
              <TextArea 
                label="Question 1: What is the purpose of Kappa Pi in your own words, and how does it align with your personal journey?" 
                value={data.essay1} 
                onChange={(v: string) => updateField('essay1', v)} 
                maxWords={50}
                placeholder="In your own words, what is the purpose of Kappa Pi and how does it align with your personal journey?"
                required
              />
              <TextArea 
                label="Question 2: How have you served as a role model or advocate for young people in your community?" 
                value={data.essay2} 
                onChange={(v: string) => updateField('essay2', v)} 
                minWords={150}
                placeholder="How have you served as a role model or advocate for young people in your community? Please provide a specific example."
                required
              />
              <TextArea 
                label="Question 3: How have you actively participated in community service projects that address local or societal issues?" 
                value={data.essay3} 
                onChange={(v: string) => updateField('essay3', v)} 
                minWords={150}
                placeholder="How have you actively participated in community service projects addressing local or societal issues?"
                required
              />
              <TextArea 
                label="Question 4: What have you done to encourage positive self-esteem and involvement among Black and Brown Queer & Trans Communities?" 
                value={data.essay4} 
                onChange={(v: string) => updateField('essay4', v)} 
                minWords={150}
                placeholder="What specific actions have you taken to encourage positive self-esteem and involvement among Black and Brown Queer & Trans Communities?"
                required
              />
              <TextArea 
                label="Question 5: What unique talents, experiences, and professional skills do you possess to contribute to Kappa Pi's premier status?" 
                value={data.essay5} 
                onChange={(v: string) => updateField('essay5', v)} 
                minWords={150}
                placeholder="What unique talents, experiences, and professional skills do you possess to contribute to Kappa Pi's premier status?"
                required
              />
            </div>
          </Section>
        </div>

        {/* Additional Disclosures */}
        <div id="field-section-disclosures">
          <Section 
            title="Additional Disclosures" 
            icon={Info} 
            isOpen={openSection === 'disclosures'} 
            onToggle={() => setOpenSection(openSection === 'disclosures' ? null : 'disclosures')}
            isCompleted={Boolean(data.isFraternityMember && data.hasAkaFamily && data.previousApplied)}
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
                    label="What is your fraternity name and initiation date?" 
                    value={data.fraternityDetails} 
                    onChange={(v: string) => updateField('fraternityDetails', v)} 
                    required
                  />
                )}
              </div>

              <div className="space-y-6 p-6 rounded-2xl bg-gold/5 border border-gold/10">
                <RadioGroup 
                  label="Do you have a family member(s) who are members of Alpha Kappa Alpha Sorority, Inc.?" 
                  value={data.hasAkaFamily} 
                  onChange={(v: string) => updateField('hasAkaFamily', v)}
                  options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                  required
                />
                {data.hasAkaFamily === 'yes' && (
                  <TextArea 
                    label="What are the details of your family member(s) in Alpha Kappa Alpha Sorority, Inc.?" 
                    value={data.akaFamilyDetails} 
                    onChange={(v: string) => updateField('akaFamilyDetails', v)} 
                    placeholder="Names, relationships, chapter, and year of initiation..."
                    required
                  />
                )}
              </div>

              <div className="space-y-6 p-6 rounded-2xl bg-gold/5 border border-gold/10">
                <RadioGroup 
                  label="Have you previously applied for Kappa Pi membership?" 
                  value={data.previousApplied} 
                  onChange={(v: string) => updateField('previousApplied', v)}
                  options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                  required
                />
                {data.previousApplied === 'yes' && (
                  <TextArea 
                    label="What was the reason or explanation for discontinuing the process?" 
                    value={data.previousAppliedDetails} 
                    onChange={(v: string) => updateField('previousAppliedDetails', v)} 
                    placeholder="Explain why you did not continue or discontinued the process..."
                    required
                  />
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Social Presence */}
        <div id="field-section-social">
          <Section 
            title="Social & Professional Presence" 
            icon={Globe} 
            isOpen={openSection === 'social'} 
            onToggle={() => setOpenSection(openSection === 'social' ? null : 'social')}
            isCompleted={Boolean(data.socialUrls?.trim())}
          >
            <TextArea 
              label="What are your social or professional website URLs (e.g., LinkedIn, Facebook, Instagram)?" 
              value={data.socialUrls} 
              onChange={(v: string) => updateField('socialUrls', v)} 
              placeholder="Write 'none' if this does not apply..."
              description="List any websites that depict you in a personal or professional manner."
              required
            />
          </Section>
        </div>
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
                  ? 'Draft Saved!' 
                  : hasUnsavedChanges 
                    ? 'Unsaved Draft Changes' 
                    : 'Draft Progress Saved'}
              </p>
              <p className="text-gold text-[10px] uppercase tracking-widest font-bold">
                {saveSuccess 
                  ? 'Your progress has been saved' 
                  : hasUnsavedChanges 
                    ? 'Click Save Draft to keep changes' 
                    : `Last saved: ${lastSavedTime || new Date().toLocaleTimeString()}`}
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

      {/* Save Draft Success Pop-Up Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-ivy/70 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-gold/40 rounded-[28px] p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl text-center space-y-6 font-display"
            >
              <div className="w-16 h-16 bg-green-100 border border-green-300 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle size={36} className="text-green-700" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold uppercase tracking-tight text-ivy">
                  Draft Saved
                </h3>
                <p className="text-ivy/70 text-xs font-body leading-relaxed">
                  Your application progress has been saved for <span className="font-bold text-ivy">{email}</span>.
                </p>
              </div>

              <div className="p-4 bg-cream/60 rounded-xl border border-gold/20 text-center space-y-1.5 text-xs text-ivy/80 font-body">
                <div className="flex justify-center items-center gap-2 text-green-800 font-bold text-xs">
                  <CheckCircle size={15} className="text-green-600 shrink-0" />
                  <span>{lastSavedTime ? `Saved at ${lastSavedTime}` : 'Progress Saved'}</span>
                </div>
                <p className="text-ivy/60 text-[11px] leading-relaxed">
                  You can safely log out or close your browser at any time. When you log back in, your responses will be restored automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="w-full py-3.5 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-md cursor-pointer"
              >
                OK / Continue Application
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
