import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

interface SafeAreaViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  className?: string
  children: React.ReactNode
}

const edgeToClass: Record<string, string> = {
  top: 'pt-[env(safe-area-inset-top)]',
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  left: 'pl-[env(safe-area-inset-left)]',
  right: 'pr-[env(safe-area-inset-right)]',
}

export default function SafeAreaView({
  edges = ['top', 'bottom'],
  className,
  children,
}: SafeAreaViewProps) {
  const edgeClasses = edges.map((edge) => edgeToClass[edge]).join(' ')

  return <div className={cn(edgeClasses, className)}>{children}</div>
}