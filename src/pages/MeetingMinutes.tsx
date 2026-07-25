import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Send, 
  Download, 
  Printer, 
  History, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

export default function MeetingMinutes() {
  const [rawNotes, setRawNotes] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateMinutes = async () => {
    if (!rawNotes.trim()) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/minutes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes })
      });
      
      const data = await response.json();
      if (data.success) {
        setMinutes(data.minutes);
      } else {
        throw new Error(data.error || 'Failed to generate minutes');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(minutes.replace(/[#*]/g, ''), 180);
    doc.setFontSize(12);
    doc.text(splitText, 15, 15);
    doc.save('KPI_Meeting_Minutes.pdf');
  };

  const clearAll = () => {
    setRawNotes('');
    setMinutes('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-ivy py-16 px-4 mb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display text-cream mb-4">Automated Meeting Minutes</h1>
          <p className="text-cream/70 font-body max-w-2xl">
            Input raw notes, bullet points, or audio transcripts. Gemini will transform them into professional, structured Minutes for the Grammateus review.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg border border-gold/20 shadow-soft">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-display text-ivy flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Raw Meeting Notes
              </h2>
              <button 
                onClick={clearAll}
                className="text-ivy/40 hover:text-red-500 transition-colors"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw notes here... e.g. Attendance: Brian, Edward. Discussed FY27 MIP budget. Decision: Approved $500 for marketing. Edward to contact vendors by Friday."
              className="w-full h-96 p-4 border border-gold/10 rounded-md focus:ring-2 focus:ring-gold/20 outline-none text-sm font-body resize-none"
            />
            
            <button
              onClick={generateMinutes}
              disabled={isGenerating || !rawNotes.trim()}
              className="w-full mt-6 bg-ivy text-cream py-4 rounded-md font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-ivy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Minutes...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Structured Minutes
                </>
              )}
            </button>
          </div>

          <div className="bg-ivy/5 p-6 rounded-lg border border-ivy/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ivy/60 mb-3 flex items-center gap-2">
              <History className="w-3 h-3" /> Tips for better results
            </h3>
            <ul className="text-xs text-ivy/50 space-y-2 list-disc pl-4">
              <li>Include names of attendees for accurate list generation.</li>
              <li>Specify key decisions and person responsible for action items.</li>
              <li>Mention the date and meeting type (General, Executive, Committee).</li>
              <li>Bullet points are better than continuous prose.</li>
            </ul>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg border border-gold/20 shadow-soft h-full flex flex-col min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-display text-ivy flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Review Minutes
              </h2>
              {minutes && (
                <div className="flex gap-3">
                  <button 
                    onClick={exportPDF}
                    className="p-2 text-ivy/60 hover:text-gold transition-colors"
                    title="Export PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    className="p-2 text-ivy/60 hover:text-gold transition-colors"
                    title="Print"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {!minutes && !isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center text-ivy/20 text-center px-12">
                <FileText className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm">Generated minutes will appear here after processing.</p>
              </div>
            )}

            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
                <p className="text-ivy/40 text-sm animate-pulse">Gemini is structuring your notes...</p>
              </div>
            )}

            {minutes && (
              <div className="flex-1 overflow-y-auto prose prose-sm max-w-none text-ivy markdown-body">
                <ReactMarkdown>{minutes}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
