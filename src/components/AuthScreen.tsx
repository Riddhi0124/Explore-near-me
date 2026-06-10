import React, { useState } from 'react';
import { Mail, Lock, User, Compass, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession } from '../types';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from "../firebase";

interface AuthScreenProps {
  onAuthSuccess: (user: UserSession) => void;
}

const AVATARS = [
  { char: '🏕️', label: 'Camper' },
  { char: '🧭', label: 'Explorer' },
  { char: '🍕', label: 'Foodie' },
  { char: '☕', label: 'Cafe Lover' },
  { char: '🎡', label: 'Thrill Seeker' },
  { char: '🦁', label: 'Wildlife Fan' },
  { char: '🎨', label: 'Museum Lover' },
  { char: '🏃', label: 'Active User' },
];

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[1].char);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      onAuthSuccess({
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Google User',
        avatar: firebaseUser.photoURL || '👤',
        isGuest: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    if (isSignUp && !name) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const usersJson = localStorage.getItem('registered_users');
        const users = usersJson ? JSON.parse(usersJson) : [];

        if (isSignUp) {
          const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            setError('This email is already registered.');
            setIsLoading(false);
            return;
          }

          const newUser = {
            email: email.toLowerCase(),
            password,
            name,
            avatar: selectedAvatar,
            isGuest: false,
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          localStorage.setItem('registered_users', JSON.stringify(users));

          onAuthSuccess({
            email: newUser.email,
            name: newUser.name,
            avatar: newUser.avatar,
            isGuest: false,
            createdAt: newUser.createdAt,
          });
        } else {
          const matchedUser = users.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (!matchedUser) {
            setError('Invalid email or password combination.');
            setIsLoading(false);
            return;
          }

          onAuthSuccess({
            email: matchedUser.email,
            name: matchedUser.name,
            avatar: matchedUser.avatar,
            isGuest: false,
            createdAt: matchedUser.createdAt || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Auth handler incident:', err);
        setError('An issue occurred during login. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleGuestEntry = () => {
    setIsLoading(true);
    setTimeout(() => {
      onAuthSuccess({
        email: 'guest@explorenearme.local',
        name: 'Guest Explorer',
        avatar: '🗺️',
        isGuest: true,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-950 flex flex-col justify-between px-6 py-8 overflow-y-auto no-scrollbar transition-colors">
      <div className="text-center mt-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl mb-4 shadow-inner"
        >
          <Compass size={40} />
        </motion.div>

        <h1 className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
          Explore Near Me
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          Discover restaurants, cafes, attractions, and local entertainment nearby.
        </p>
      </div>

      <div className="my-auto py-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-950/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          </div>
          <span className="relative bg-white dark:bg-gray-950 px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">
            Or
          </span>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  required={isSignUp}
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-gray-900/60 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all placeholder-gray-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-850">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 text-center">
                  Select Explorer Persona
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av.char}
                      onClick={() => setSelectedAvatar(av.char)}
                      className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                        selectedAvatar === av.char
                          ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-400'
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-800'
                      }`}
                      title={av.label}
                    >
                      {av.char}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="relative">
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full h-12 pl-11 pr-4 bg-gray-50 dark:bg-gray-900/60 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              className="w-full h-12 pl-11 pr-11 bg-gray-50 dark:bg-gray-900/60 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 mt-2 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-2.5xl shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? 'Create Explorer Account' : 'Access Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={handleGuestEntry}
          disabled={isLoading}
          className="w-full h-12 mt-4 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-850 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Sparkles size={16} className="text-amber-500" />
          <span>Explore as Guest</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isSignUp ? 'Already a member? Sign In instead' : 'New around here? Join as Explorer'}
        </button>
      </div>
    </div>
  );
}