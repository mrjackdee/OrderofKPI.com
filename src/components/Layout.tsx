import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronUp, Instagram } from 'lucide-react';

const MotionLink = motion(Link);

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'CONFERENCE REGISTRATION', path: '/registration' },
    { name: 'CONTACT US', path: 'mailto:conference@orderofkpi.com', isExternal: true },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-[#000000] text-primary font-display antialiased">
      <div className="layout-container flex h-full grow flex-col pt-[72px] md:pt-[88px]">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary px-4 md:px-10 py-4 md:py-6 bg-black/95 backdrop-blur fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center gap-2 md:gap-4 text-primary">
            <img 
              src="https://orderofkpi.com/kpi_logo.jpg" 
              alt="KP Logo" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-primary text-base md:text-xl font-bold leading-tight tracking-tight uppercase">The Order of KP, Inc.</h2>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex flex-1 justify-end">
            <nav className="flex items-center gap-10">
              {navItems.map((item) => (
                item.isExternal ? (
                  <motion.a
                    key={item.name}
                    href={item.path}
                    className="relative text-primary hover:text-white transition-colors text-sm font-semibold uppercase tracking-[0.15em] group"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.name}
                    <motion.span 
                      className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all group-hover:w-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                    />
                  </motion.a>
                ) : (
                  <MotionLink
                    key={item.name}
                    to={item.path}
                    className={`relative transition-colors text-sm font-semibold uppercase tracking-[0.15em] group ${
                      item.name === 'CONFERENCE REGISTRATION' 
                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                        : 'text-primary hover:text-white'
                    }`}
                    whileHover={{ y: -2 }}
                    animate={item.name === 'CONFERENCE REGISTRATION' ? {
                      textShadow: [
                        "0 0 4px rgba(255,255,255,0.4)",
                        "0 0 12px rgba(255,255,255,0.8)",
                        "0 0 4px rgba(255,255,255,0.4)"
                      ]
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    {item.name}
                    <motion.span 
                      className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all group-hover:w-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                    />
                  </MotionLink>
                )
              ))}
              <motion.a
                href="http://www.instagram.com/kpi2012"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary hover:bg-primary hover:text-black transition-all ml-4 group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Instagram"
              >
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden xl:block">Follow Us</span>
                <Instagram size={18} className="group-hover:scale-110 transition-transform" />
              </motion.a>
            </nav>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-primary p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </header>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-40 bg-black lg:hidden flex flex-col items-center justify-center gap-6 md:gap-8 overflow-y-auto py-20"
            >
              {navItems.map((item) => (
                item.isExternal ? (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-primary text-xl md:text-2xl font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-xl md:text-2xl font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] transition-colors ${
                      item.name === 'CONFERENCE REGISTRATION'
                        ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                        : 'text-primary hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              <motion.a
                href="http://www.instagram.com/kpi2012"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="mt-8 flex flex-col items-center gap-4 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                aria-label="Instagram"
              >
                <div className="w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center bg-primary/5 group-hover:bg-primary group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                  <Instagram size={40} />
                </div>
                <span className="text-primary text-sm font-bold tracking-[0.3em] uppercase group-hover:text-white transition-colors">Follow Us @kpi2012</span>
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col items-center">
          <Outlet />
        </main>

        <footer className="w-full border-t border-primary py-12 px-6 md:px-10 bg-black text-center flex flex-col items-center gap-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {navItems.map((item) => (
              item.isExternal ? (
                <a key={item.name} className="text-primary hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em]" href={item.path}>{item.name}</a>
              ) : (
                <Link key={item.name} className="text-primary hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em]" to={item.path}>{item.name}</Link>
              )
            ))}
          </nav>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-primary opacity-80">
              <img 
                src="https://orderofkpi.com/kpi_logo.jpg" 
                alt="KP Logo" 
                className="w-8 h-8 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-bold uppercase tracking-widest">The Order of KP, Inc.</span>
            </div>
            <div className="flex flex-col items-center gap-6 mt-2">
              <a href="mailto:conference@orderofkpi.com" className="text-silver hover:text-white transition-colors text-sm font-medium tracking-widest">
                conference@orderofkpi.com
              </a>
              <motion.a 
                href="http://www.instagram.com/kpi2012" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 bg-primary/5 border border-primary/20 rounded-full text-primary hover:bg-primary hover:text-black transition-all group"
                whileHover={{ y: -3, scale: 1.05 }}
                aria-label="Instagram"
              >
                <Instagram size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Follow Our Journey</span>
              </motion.a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-primary opacity-60 text-xs uppercase tracking-[0.2em]">© 2026 The Order of KP, Inc. All rights reserved.</p>
            <p className="text-primary opacity-60 text-xs uppercase tracking-[0.2em]">
              Digital Creation By <a href="http://www.MrJackDee.com" target="_blank" rel="noopener noreferrer" className="font-bold text-silver hover:text-white transition-colors underline underline-offset-4">MrJackDee</a>™
            </p>
          </div>
        </footer>

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] group"
              aria-label="Back to top"
            >
              <div className="relative flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 bg-silver/20 rounded-full blur-md group-hover:bg-silver/40 transition-colors" />
                
                {/* Main Circle */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 bg-black border-2 border-silver rounded-full flex flex-col items-center justify-center transition-transform group-hover:-translate-y-1">
                  <span className="text-lg md:text-2xl font-black tracking-widest text-pure-white leading-none">KP</span>
                  <ChevronUp className="w-4 h-4 md:w-6 md:h-6 text-pure-white mt-0.5 md:mt-1 group-hover:animate-bounce stroke-[3px]" />
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
