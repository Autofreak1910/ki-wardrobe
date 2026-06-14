'use client'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  // Animation handled by AppWrapper globally
  return <>{children}</>
}