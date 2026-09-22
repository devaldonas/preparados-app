'use client'

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <img 
          src="/logoBco2.png" 
          alt="PREPARADO" 
          className="h-16 w-auto animate-pulse"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FFB800] rounded-full animate-spin" />
      </div>
    </div>
  )
}
