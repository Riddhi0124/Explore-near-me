import { Check, LogOut, Shield, MapPin, Heart, Star, Sparkles, X, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserSession } from '../types';
import { useState } from 'react';

interface UserProfileModalProps {
  user: UserSession;
  savedCount: number;
  onLogout: () => void;
  onClose: () => void;
  onUpdateUser: (updated: UserSession) => void;
}

export default function UserProfileModal({ 
  user, 
  savedCount, 
  onLogout, 
  onClose,
  onUpdateUser
}: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);

  const AVATARS = ['🏕️', '🧭', '🍕', '☕', '🎡', '🦁', '🎨', '🏃', '🍔', '🍦', '🚗', '🗺️'];

  const handleUpdate = () => {
    if (!editName.trim()) return;
    onUpdateUser({
      ...user,
      name: editName,
      avatar: editAvatar
    });
    setIsEditing(false);
  };

  // Compute a playful Level based on user engagement!
  const engagementPoints = (savedCount * 15);
  const levelClass = engagementPoints >= 45 ? 'Elite Voyager' : engagementPoints >= 15 ? 'Expert Scout' : 'Novice Wayfarer';
  const progressPercent = Math.min(100, (engagementPoints % 45) * 2.22 || 10);

  return (
    <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
      {/* Click outside to close wrapper */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Profile Card Bottom Sheet */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-white dark:bg-gray-900 rounded-t-[36px] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] border-t border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar z-50 transition-colors"
      >
        {/* Header anchor bar */}
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4 flex-shrink-0"></div>

        {/* Title & Close buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-950 dark:text-gray-100">Explorer Passport</h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar Presentation with visual ring */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-5xl shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/30">
              {isEditing ? editAvatar : user.avatar}
            </div>
            
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-750 text-gray-600 dark:text-gray-300 rounded-full hover:scale-110 active:scale-95 transition-all"
            >
              <Edit2 size={12} />
            </button>
          </div>

          <div className="mt-4 w-full">
            {isEditing ? (
              <div className="space-y-3 px-2">
                <input 
                  type="text" 
                  className="w-full text-center font-bold text-lg border-b border-blue-500 dark:text-white bg-transparent outline-none py-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={25}
                />
                
                {/* Avatar select row */}
                <div className="flex gap-1.5 overflow-x-auto py-2 no-scrollbar px-1 justify-start md:justify-center">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      className={`text-xl p-1.5 min-w-[38px] min-h-[38px] rounded-xl transition-all ${
                        editAvatar === av 
                          ? 'bg-blue-600 text-white scale-110'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-700"
                  >
                    <Check size={12} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-gray-950 dark:text-white leading-tight flex items-center justify-center gap-1.5">
                  <span>{user.name}</span>
                  {user.isGuest ? (
                    <span className="text-[10px] font-bold tracking-widest uppercase py-0.5 px-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">GUEST</span>
                  ) : (
                    <Shield size={14} className="text-blue-500 stroke-[2.5]" />
                  )}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">{user.email}</p>
              </>
            )}
          </div>
        </div>

        {/* Level Indicator Game Module (High Interactive Quality) */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-3xl p-4 border border-blue-100/30 dark:border-indigo-900/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} className="animate-pulse" />
              Progress Rank
            </span>
            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">{levelClass}</span>
          </div>
          
          <div className="w-full bg-gray-200/60 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-3 text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-mono uppercase">
            <span>LVL {Math.max(1, Math.floor(savedCount / 3) + 1)} Explorer</span>
            <span>{savedCount} of {Math.floor(savedCount / 3) * 3 + 3} target</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 flex items-center gap-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
              <Heart size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Favorites</p>
              <p className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">{savedCount}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
              <Star size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reviews</p>
              <p className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                {localStorage.getItem('user_reviews_count') || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Security / System Footer actions */}
        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
          <button 
            onClick={onLogout}
            className="w-full h-12 flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-100/50 dark:hover:bg-rose-950/40 active:scale-95 transition-all text-sm mt-2"
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
