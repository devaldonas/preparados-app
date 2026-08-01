'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface RadioCardProps {
  onlineUsers?: number;
  activeChannel?: string;
}

const RadioCard: React.FC<RadioCardProps> = ({
  onlineUsers = 0,
  activeChannel = 'CH CIDADES',
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-between text-center min-h-[170px] animate-pulse">
        <div className="w-20 h-20 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    );
  }

  return (
    <Link
      href="/comunicador"
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
    >
      <div className="w-20 h-20 flex items-center justify-center relative">
        <img
          src="/images/comunicador1-icon.png"
          alt="Comunicador Via Rádio"
          className="w-16 h-16 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {onlineUsers > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[0.55rem] font-bold px-2 py-0.5 rounded-full min-w-[18px]">
            {onlineUsers}
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
        Rádio
      </h3>
      
      <p className="text-[0.55rem] text-gray-400 mt-1">
        {onlineUsers} conectados • {activeChannel}
      </p>
    </Link>
  );
};

export default RadioCard;