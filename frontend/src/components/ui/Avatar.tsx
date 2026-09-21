import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'

interface AvatarProps {
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-xl' }

const colors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', getColor(name), sizes[size], className)}>
      {getInitials(name)}
    </div>
  )
}
