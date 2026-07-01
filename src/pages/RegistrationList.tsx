import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle, Search, Loader2 } from 'lucide-react';

interface RegistrationData {
  Name: string;
  'Registration Type': string;
}

export default function RegistrationList() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await fetch('/api/registrations');
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setRegistrations(data);
        } else {
          // Backend did not return JSON. Fallback to direct fetch of the public spreadsheet CSV.
          console.warn('Member API endpoint returned non-JSON response. Falling back to direct live spreadsheet feed.');
          const directRes = await fetch("https://docs.google.com/spreadsheets/d/1rPsW1nfG_p6jLQRZD_n4-Ee38-BGYtVoCaMm0Gu15f8/gviz/tq?tqx=out:csv");
          if (!directRes.ok) {
            throw new Error('Unable to connect to the active database.');
          }
          const csvText = await directRes.text();
          const rows = csvText.split('\n').map(row => {
            const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            return matches.map(match => match.replace(/^"|"$/g, ''));
          });

          if (rows.length < 2) {
            setRegistrations([]);
            return;
          }

          const headers = rows[0];
          const data = rows.slice(1).map((row) => {
            let obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || "";
            });
            return obj;
          });
          setRegistrations(data);
        }
      } catch (err: any) {
        console.error('Registration fetch error:', err);
        setError('The confirmed registrations list is currently unavailable. Please verify your connection and try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const filteredRegistrations = registrations.filter(reg => {
    const name = (reg.Name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search);
  });

  return (
    <div className="pt-24 pb-20 min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-widest">
              Confirmed Registrations
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-silver text-lg font-light max-w-2xl"
          >
            A verified list of members who have successfully registered for the Biennial Conference.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md"
        >
          {/* Search bar */}
          <div className="mb-8 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-silver/50" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-silver/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all font-light"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-silver font-light animate-pulse">Loading registration data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400 font-medium mb-2">Failed to Load</p>
              <p className="text-red-400/80 text-sm font-light">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-silver text-lg font-light">No registrations found matching your search.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-xs font-semibold text-primary uppercase tracking-widest">Status</th>
                      <th className="py-4 px-4 text-xs font-semibold text-silver uppercase tracking-widest">Name</th>
                      <th className="py-4 px-4 text-xs font-semibold text-silver uppercase tracking-widest">Registration Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (index * 0.05), duration: 0.3 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 text-xs font-medium uppercase tracking-wider">Confirmed</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white font-medium">
                          {reg.Name}
                        </td>
                        <td className="py-4 px-4 text-silver/80 font-mono text-sm">
                          {reg['Registration Type']}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
