'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Video, Package, Globe } from 'lucide-react'
import { useActiveGenerations } from '@/hooks/useActiveGenerations'

export default function Navbar() {
  const router = useRouter()
  const { hasActive, activeGenerations } = useActiveGenerations()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Video className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">CrossFi Video Generator</span>
            </Link>
            
            <div className="flex space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md relative"
              >
                <Video className="h-4 w-4" />
                <span>Генерации</span>
                {hasActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{activeGenerations.length}</span>
                  </div>
                )}
              </Link>
              
              <Link 
                href="/products" 
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                <Package className="h-4 w-4" />
                <span>Продукты</span>
              </Link>
              
              <Link 
                href="/domains" 
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                <Globe className="h-4 w-4" />
                <span>Домены</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
