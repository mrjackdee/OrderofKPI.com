import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle, Search, Loader2 } from 'lucide-react';

interface RegistrationData {
  Timestamp: string;
  'Email Address': string;
  'What is your first name?': string;
  'What is your last name? ': string;
  'Member ID': string;
  'Are you registering for another Brother?': string;
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
        if (!response.ok) {
          throw new Error('Failed to fetch registrations');
        }
        const data = await response.json();
        setRegistrations(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const filteredRegistrations = registrations.filter(reg => {
    const fullName = `${reg['What is your first name?']} ${reg['What is your last name? ']}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || (reg['Member ID'] || '').toLowerCase().includes(search);
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
              placeholder="Search by name or Member ID..."
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
                      <th className="py-4 px-4 text-xs font-semibold text-silver uppercase tracking-widest hidden md:table-cell">Member ID</th>
                      <th className="py-4 px-4 text-xs font-semibold text-silver uppercase tracking-widest hidden lg:table-cell">Registration Date</th>
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
                          {reg['What is your first name?']} {reg['What is your last name? ']}
                        </td>
                        <td className="py-4 px-4 text-silver/80 font-mono text-sm hidden md:table-cell">
                          {reg['Member ID'] || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-silver/60 text-sm hidden lg:table-cell">
                          {new Date(reg.Timestamp).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
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
