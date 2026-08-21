import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Users, 
  MessageSquare, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateApplicationPDF } from '../utils/pdfGenerator';
import { saveApplication } from '../lib/memberDb';

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

export default function StandaloneApplication() {
  const [email, setEmail] = useState('applicant@orderofkpi.org');
  const [data, setData] = useState<ApplicationData>({
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
    isFraternityMember: 'no',
    fraternityDetails: '',
    hasAkaFamily: 'no',
    akaFamilyDetails: '',
    previousApplied: 'no',
    previousAppliedDetails: '',
    socialUrls: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof ApplicationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleExtractPDF = () => {
    if (!data.firstName || !data.lastName) {
      setError('Please provide at least your First and Last Name before extracting the PDF.');
      return;
    }
    setError('');
    generateApplicationPDF(data, email || 'applicant@orderofkpi.org');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.firstName || !data.lastName || !email) {
      setError('Please fill in your name and email address to submit.');
      return;
    }
    setError('');
    
    try {
      await saveApplication(email, data, 'submitted');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission error:', err);
      setError('An error occurred while submitting your application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cream/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link 
            to="/applicant-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ivy hover:text-gold transition-colors"
          >
            <ArrowLeft size={16} /> Back to Applicant Portal
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 text-ivy border border-gold/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Manual Application Form
          </div>
        </div>

        <div className="text-center space-y-3 bg-white border border-gold/30 rounded-[32px] p-8 md:p-12 shadow-soft">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-ivy uppercase tracking-tight">
            Order of KPI <span className="text-gold">Membership Application Form</span>
          </h1>
          <p className="text-ivy/70 text-xs md:text-sm font-body max-w-2xl mx-auto leading-relaxed">
            Manual form to complete the application. You can download and extract your official application PDF at any time.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={handleExtractPDF}
              className="px-6 py-3 bg-gold text-ivy rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download size={16} /> Extract PDF Copy Now
            </button>
          </div>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-green-500/30 rounded-[32px] p-8 md:p-12 text-center space-y-6 shadow-xl"
          >
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-ivy uppercase">
                Standalone Application <span className="text-gold">Submitted Successfully</span>
              </h2>
              <p className="text-ivy/70 text-sm max-w-md mx-auto">
                Thank you, <span className="font-bold text-ivy">{data.firstName} {data.lastName}</span>. Your standalone application data has been recorded and verified.
              </p>
            </div>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={handleExtractPDF}
                className="px-6 py-3 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Download size={16} /> Extract Official PDF
              </button>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-6 py-3 bg-cream text-ivy border border-gold/40 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gold/10 transition-all"
              >
                Edit Form Data
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-red-800 text-xs flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Personal Information */}
            <div className="bg-white border border-gold/20 rounded-[28px] p-6 md:p-8 space-y-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2 border-b border-gold/10 pb-3">
                <User size={18} /> 1. Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={data.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    placeholder="e.g. Jack"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={data.middleName}
                    onChange={e => updateField('middleName', e.target.value)}
                    placeholder="e.g. David"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={data.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    placeholder="e.g. Tester"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={data.dateOfBirth}
                    onChange={e => updateField('dateOfBirth', e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={data.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="e.g. 404-555-0199"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. averyt16@gmail.com"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Permanent Residential Address *</label>
                <input
                  type="text"
                  required
                  value={data.address}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="Street Address, City, State, Zip"
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                />
              </div>
            </div>

            {/* Section 2: Professional & Academic */}
            <div className="bg-white border border-gold/20 rounded-[28px] p-6 md:p-8 space-y-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2 border-b border-gold/10 pb-3">
                <Briefcase size={18} /> 2. Professional & Academic Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Place of Employment</label>
                  <input
                    type="text"
                    value={data.employment}
                    onChange={e => updateField('employment', e.target.value)}
                    placeholder="Company or Organization"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Position / Title</label>
                  <input
                    type="text"
                    value={data.position}
                    onChange={e => updateField('position', e.target.value)}
                    placeholder="Job Title or Role"
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Degrees Earned, Dates, and Institutions *</label>
                <textarea
                  required
                  rows={3}
                  value={data.degrees}
                  onChange={e => updateField('degrees', e.target.value)}
                  placeholder="List degrees, universities, and graduation years..."
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                />
              </div>

              <div>
                <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Academic Honors & Achievements</label>
                <textarea
                  rows={2}
                  value={data.honors}
                  onChange={e => updateField('honors', e.target.value)}
                  placeholder="List any honors, awards, or recognitions..."
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                />
              </div>
            </div>

            {/* Section 3: Community & Organization Profile */}
            <div className="bg-white border border-gold/20 rounded-[28px] p-6 md:p-8 space-y-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2 border-b border-gold/10 pb-3">
                <GraduationCap size={18} /> 3. Community & Organization Profile
              </h3>

              <div>
                <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Current & Past Organization Involvements *</label>
                <textarea
                  required
                  rows={3}
                  value={data.organizations}
                  onChange={e => updateField('organizations', e.target.value)}
                  placeholder="List community service, civic, or professional organizations..."
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                />
              </div>

              <div>
                <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-1">Prior Knowledge of Kappa Pi *</label>
                <textarea
                  required
                  rows={3}
                  value={data.priorKnowledge}
                  onChange={e => updateField('priorKnowledge', e.target.value)}
                  placeholder="How did you come to know about Kappa Pi?"
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                />
              </div>
            </div>

            {/* Section 4: Disclosures */}
            <div className="bg-white border border-gold/20 rounded-[28px] p-6 md:p-8 space-y-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2 border-b border-gold/10 pb-3">
                <Users size={18} /> 4. Additional Disclosures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block">Are you a member of another organization/society?</label>
                  <select
                    value={data.isFraternityMember}
                    onChange={e => updateField('isFraternityMember', e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                  {data.isFraternityMember === 'yes' && (
                    <input
                      type="text"
                      value={data.fraternityDetails}
                      onChange={e => updateField('fraternityDetails', e.target.value)}
                      placeholder="Organization details..."
                      className="w-full mt-2 bg-cream/40 border border-gold/20 rounded-xl py-2 px-3 text-ivy text-xs"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block">Family in Alpha Kappa Alpha Sorority, Inc.?</label>
                  <select
                    value={data.hasAkaFamily}
                    onChange={e => updateField('hasAkaFamily', e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                  {data.hasAkaFamily === 'yes' && (
                    <input
                      type="text"
                      value={data.akaFamilyDetails}
                      onChange={e => updateField('akaFamilyDetails', e.target.value)}
                      placeholder="Family member details..."
                      className="w-full mt-2 bg-cream/40 border border-gold/20 rounded-xl py-2 px-3 text-ivy text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block">Previously applied for Kappa Pi membership?</label>
                  <select
                    value={data.previousApplied}
                    onChange={e => updateField('previousApplied', e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                  {data.previousApplied === 'yes' && (
                    <input
                      type="text"
                      value={data.previousAppliedDetails}
                      onChange={e => updateField('previousAppliedDetails', e.target.value)}
                      placeholder="Previous application details..."
                      className="w-full mt-2 bg-cream/40 border border-gold/20 rounded-xl py-2 px-3 text-ivy text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-ivy/70 font-bold uppercase tracking-widest block mb-2">Social or professional website URLs</label>
                  <input
                    type="text"
                    value={data.socialUrls}
                    onChange={e => updateField('socialUrls', e.target.value)}
                    placeholder="LinkedIn, portfolio, or social link..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 px-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Essay Questions */}
            <div className="bg-white border border-gold/20 rounded-[28px] p-6 md:p-8 space-y-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-2 border-b border-gold/10 pb-3">
                <FileText size={18} /> 5. Written Essay Questions
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-ivy block mb-2">
                    Question 1: In your own words, describe the purpose of Kappa Pi and how it aligns with your personal journey. *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={data.essay1}
                    onChange={e => updateField('essay1', e.target.value)}
                    placeholder="Write your response here..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl p-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ivy block mb-2">
                    Question 2: How have you served as a role model or advocate for young people in your community? Give a specific example. *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={data.essay2}
                    onChange={e => updateField('essay2', e.target.value)}
                    placeholder="Write your response here..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl p-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ivy block mb-2">
                    Question 3: How have you actively participated in community service projects that address local or societal issues? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={data.essay3}
                    onChange={e => updateField('essay3', e.target.value)}
                    placeholder="Write your response here..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl p-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ivy block mb-2">
                    Question 4: What have you done to encourage positive self-esteem and involvement among Black and Brown Queer & Trans Communities? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={data.essay4}
                    onChange={e => updateField('essay4', e.target.value)}
                    placeholder="Write your response here..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl p-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ivy block mb-2">
                    Question 5: What unique talents, experiences, and professional skills do you possess to contribute to Kappa Pi’s premier status? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={data.essay5}
                    onChange={e => updateField('essay5', e.target.value)}
                    placeholder="Write your response here..."
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl p-4 text-ivy text-sm focus:outline-none focus:border-ivy"
                  />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-ivy text-cream rounded-[28px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <h4 className="font-display font-bold text-lg uppercase tracking-tight text-gold">Ready to Export or Submit?</h4>
                <p className="text-xs text-cream/70 mt-1">Extract an official PDF copy instantly or submit your completed application form.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExtractPDF}
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-gold text-ivy rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Extract PDF
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-3.5 bg-cream text-ivy rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} className="text-ivy" /> Submit Form
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
