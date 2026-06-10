import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

interface PhoneSimulatorProps {
  children: React.ReactNode;
}

export default function PhoneSimulator({ children }: PhoneSimulatorProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // first hour is 12
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-0 md:p-6 transition-colors duration-300 font-sans">
      {/* Phone physical layout wrapper on desktop */}
      <div className="relative w-full h-screen md:w-[412px] md:h-[846px] md:min-h-[846px] md:rounded-[48px] md:border-[10px] md:border-slate-900 dark:md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Hardware side control buttons (purely visual & interactive for high fidelity simulator) */}
        <div className="hidden md:block absolute left-[-13px] top-[140px] w-[3px] h-[55px] bg-slate-800 dark:bg-slate-700 rounded-l-md"></div>
        <div className="hidden md:block absolute left-[-13px] top-[205px] w-[3px] h-[55px] bg-slate-800 dark:bg-slate-700 rounded-l-md"></div>
        <div className="hidden md:block absolute right-[-13px] top-[180px] w-[3px] h-[75px] bg-slate-800 dark:bg-slate-700 rounded-r-md"></div>

        {/* Dynamic Island / Pill Camera cutout on desktop */}
        <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-100 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950 shadow-[0_0_4px_rgba(59,130,246,0.5)]"></div>
        </div>

        {/* App Virtual Status Bar */}
        <div className="w-full h-11 px-6 pt-2 flex items-center justify-between pointer-events-none select-none z-50 flex-shrink-0 bg-transparent text-gray-900 dark:text-gray-100">
          <span className="text-xs font-bold font-mono tracking-tight">{currentTime || '12:00 PM'}</span>
          
          <div className="flex items-center gap-1.5">
            <Signal size={12} className="stroke-[2.5]" />
            <span className="text-[10px] font-bold tracking-widest font-mono">5G</span>
            <Wifi size={12} className="stroke-[2.5]" />
            <div className="flex items-center gap-0.5 ml-1">
              <Battery size={16} className="stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Real App canvas inside the viewport */}
        <div className="flex-1 w-full relative flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>

        {/* Desktop Virtual Home Navigator Pill at the bottom */}
        <div className="hidden md:block w-full h-6 pb-2 flex items-center justify-center bg-transparent z-50 pointer-events-none select-none flex-shrink-0">
          <div className="w-32 h-1 bg-gray-400 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
