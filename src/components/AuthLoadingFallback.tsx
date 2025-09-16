import { LucideIcon } from 'lucide-react'

interface AuthLoadingFallbackProps {
  icon: LucideIcon
  title: string
  message: string
}

export default function AuthLoadingFallback({ 
  icon: Icon, 
  title, 
  message 
}: AuthLoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  )
}
