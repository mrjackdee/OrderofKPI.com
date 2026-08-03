import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { GraduationCap, LogIn, ChevronLeft, ExternalLink, RefreshCcw } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { initAuth, googleSignIn, getAccessToken } from '../lib/googleAuth';

export default function ClassroomPortal() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, t) => {
        setToken(t);
        setNeedsAuth(false);
        fetchCourses(t);
      },
      () => {
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchCourses = async (accessToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setNeedsAuth(false);
        fetchCourses(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="w-full max-w-7xl mx-auto px-6 py-6 md:py-12 space-y-12">
        <MemberHeader />

        <div className="flex items-center justify-between mb-8">
          <Link to="/member-portal" className="text-xs text-ivy/60 hover:text-ivy uppercase tracking-widest font-bold flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Portal
          </Link>
          {token && (
            <button onClick={() => fetchCourses(token)} className="text-xs text-ivy/60 hover:text-ivy uppercase tracking-widest font-bold flex items-center gap-1">
              <RefreshCcw size={14} /> Refresh
            </button>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-1">
            <GraduationCap size={14} className="text-gold" />
            <span className="text-[10px] font-bold text-ivy uppercase tracking-[0.2em]">
              Education Portal
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter text-ivy">
            Google <span className="text-gold">Classroom</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ivy"></div>
          </div>
        ) : needsAuth ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-8">
            <p className="text-ivy/60">Please sign in with Google to access Classroom integration.</p>
            <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button disabled:opacity-50">
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center bg-white border border-gray-300 rounded shadow-sm px-4 py-2 hover:bg-gray-50 transition-colors">
                <div className="gsi-material-button-icon mr-3">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents text-sm font-medium text-gray-700">Sign in with Google</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full py-12 text-center text-ivy/60">
                No Classroom courses found for this account.
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="bg-white border border-gold/20 rounded-lg p-6 flex flex-col shadow-soft">
                  <div className="flex-1">
                    <h3 className="text-xl font-display text-ivy font-bold mb-2">{course.name}</h3>
                    <p className="text-sm text-ivy/70 mb-4">{course.section}</p>
                    <p className="text-xs text-ivy/50 line-clamp-2 mb-4">{course.description}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-gold/10 pt-4 mt-auto">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{course.courseState}</span>
                    <a href={course.alternateLink} target="_blank" rel="noreferrer" className="text-ivy/60 hover:text-ivy transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
