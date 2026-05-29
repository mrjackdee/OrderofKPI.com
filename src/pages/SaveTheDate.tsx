import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-06-26T00:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <motion.span 
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl md:text-3xl font-display text-pure-white"
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
          <span className="text-[10px] uppercase tracking-widest text-silver/60">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-silver/10 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
          }}
          animate={{
            y: [null, Math.random() * -50 + "%"],
            x: [null, (Math.random() - 0.5) * 20 + "%"],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: Math.random() * 15 + 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export default function SaveTheDate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = 'Email address is required.';
    } else if (!emailRegex.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address.';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number (e.g., 123-456-7890).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Custom Modal logic would go here, but for now we use a simple check
    // Since window.confirm is restricted, we'll just proceed or use a state-based modal
    // For this task, let's just proceed to simulate the submission
    
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9xaoMk2caxBGGHEl_NKdZS1eD770XKAnRClsxQ7ZmVFHYznZSnOUrwyevA-UMc8wptg/exec';

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.emailAddress,
          phoneNumber: formData.phoneNumber
        }),
      });
      navigate('/success');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const formattedValue = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'emailAddress') {
      setFormData({ ...formData, [name]: value.toLowerCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex flex-col items-center justify-center relative px-4 pt-20 md:pt-24 pb-12 overflow-hidden"
    >
      <FloatingParticles />
      
      {/* City Skyline Background Overlay */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1549419130-979929d20c5e?q=80&w=2070&auto=format&fit=crop")'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-pure-black via-pure-black/80 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-8">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4 md:space-y-8"
        >
          <h1 className="text-4xl md:text-9xl font-outline text-outline uppercase tracking-widest" style={{ transform: 'scaleY(1.2)' }}>
            Save The Date
          </h1>
          
          <CountdownTimer />

          <div className="flex flex-col items-center justify-center gap-1 md:gap-2 mt-4 md:mt-6">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <span className="h-px w-10 md:w-16 bg-silver"></span>
              <h2 className="text-silver text-sm md:text-lg font-medium tracking-widest uppercase">June 26-28, 2026</h2>
              <span className="h-px w-10 md:w-16 bg-silver"></span>
            </div>
            <h2 className="text-silver text-sm md:text-lg font-medium tracking-widest uppercase">Charlotte, NC</h2>
          </div>
        </motion.div>

        <motion.form 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          onSubmit={handleSubmit} 
          className="space-y-6 bg-pure-black/50 p-6 md:p-12 rounded-3xl border border-silver-foil backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
              <label htmlFor="firstName" className="text-sm font-semibold tracking-widest text-silver uppercase">
                First Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full bg-transparent border ${errors.firstName ? 'border-red-500' : 'border-silver'} rounded-full px-6 py-3 text-pure-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-300`}
              />
              <AnimatePresence>
                {errors.firstName && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.firstName}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="lastName" className="text-sm font-semibold tracking-widest text-silver uppercase">
                Last Name
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full bg-transparent border ${errors.lastName ? 'border-red-500' : 'border-silver'} rounded-full px-6 py-3 text-pure-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-300`}
              />
              <AnimatePresence>
                {errors.lastName && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.lastName}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label htmlFor="emailAddress" className="text-sm font-semibold tracking-widest text-silver uppercase">
              Email Address
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="email"
              id="emailAddress"
              name="emailAddress"
              required
              value={formData.emailAddress}
              onChange={handleChange}
              className={`w-full bg-transparent border ${errors.emailAddress ? 'border-red-500' : 'border-silver'} rounded-full px-6 py-3 text-pure-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-300`}
            />
            <AnimatePresence>
              {errors.emailAddress && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.emailAddress}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 text-left">
            <label htmlFor="phoneNumber" className="text-sm font-semibold tracking-widest text-silver uppercase">
              Phone Number
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full bg-transparent border ${errors.phoneNumber ? 'border-red-500' : 'border-silver'} rounded-full px-6 py-3 text-pure-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-300`}
            />
            <AnimatePresence>
              {errors.phoneNumber && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.phoneNumber}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-8">
            <motion.button 
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 0 30px rgba(192,192,192,0.6)',
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              whileTap={{ scale: 0.95 }}
              type="submit" 
              className="btn-silver w-full md:w-auto px-12 py-4 text-lg font-bold uppercase tracking-widest cursor-pointer"
            >
              Submit RSVP
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: [0.9, 1, 0.9],
                scale: [1, 1.05, 1],
                y: 0
              }}
              transition={{ 
                opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 0.8, delay: 0.6 }
              }}
              className="mt-8 bg-silver/10 border border-silver-foil/30 px-6 py-4 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(192,192,192,0.1)] max-w-sm mx-auto"
            >
              <p className="text-pure-white text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase leading-relaxed">
                Registration opens on <br className="md:hidden" />
                <span className="text-silver">Wednesday, April 1, 2026</span>
              </p>
            </motion.div>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
}
