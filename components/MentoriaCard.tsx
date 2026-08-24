'use client';

import React from 'react';
import Link from 'next/link';

interface MentoriaCardProps {
  isLive?: boolean;
  nextEvent?: string;
}

const MentoriaCard: React.FC<MentoriaCardProps> = ({
  isLive = false,
  nextEvent = 'Domingo 19h',
}) => {
  return (
    <Link
      href="/mentoria"
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-between text-center min-h-[170px]"
    >
      <div className="w-20 h-20 flex items-center justify-center relative">
        <img
          src="/images/mentoria-icon.png"
          alt="Mentoria"
          className="w-16 h-16 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {isLive && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.55rem] font-bold px-2 py-0.5 rounded-full animate-pulse">
            AO VIVO
          </span>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-base min-h-[48px] flex items-center justify-center">
        Mentoria
      </h3>
      
      <p className="text-[0.55rem] text-gray-400 mt-1 flex items-center gap-1">
        {isLive ? (
          <span className="text-red-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Ao vivo agora!
          </span>
        ) : (
          `Próxima: ${nextEvent}`
        )}
      </p>
    </Link>
  );
};

export default MentoriaCard;
