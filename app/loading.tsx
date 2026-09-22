export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#FFB800] rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Carregando...</p>
      </div>
    </div>
  )
}
