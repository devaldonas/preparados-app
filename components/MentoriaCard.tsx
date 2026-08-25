'use client';

import Link from 'next/link';

interface MentoriaCardProps {
  isLive?: boolean;
  nextEvent?: string | null;
}

export default function MentoriaCard({ isLive = false, nextEvent = null }: MentoriaCardProps) {
  return (
    <Link href="/mentoria">
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer text-center">
        <div className="w-20 h-20 mx-auto bg-[#FFB800]/10 rounded-full flex items-center justify-center">
          <img
            src="/images/mentoria-icon.png"
            alt="Mentoria"
            className="w-16 h-16 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
        <h3 className="mt-3 font-semibold text-gray-800">Mentoria</h3>
        {isLive && (
          <span className="inline-block mt-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
            AO VIVO
          </span>
        )}
      </div>
    </Link>
  );
}
