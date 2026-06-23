// app/dashboard/layout.tsx
import FloatingCartButton from '@/components/FloatingCartButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <FloatingCartButton />
    </>
  )
}