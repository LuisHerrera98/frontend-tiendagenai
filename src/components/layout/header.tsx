'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-black text-white sticky top-0 z-50 w-full">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo space with rounded container */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-lg sm:text-xl">L</span>
            </div>
            <Link href="/" className="text-lg sm:text-xl font-bold truncate">
              Ecommerce Store
            </Link>
          </div>

          {/* Desktop Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Desktop Cart and admin link */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 text-xs sm:text-sm">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" />
              <span className="hidden sm:inline">Carrito (0)</span>
            </Button>
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-black text-xs sm:text-sm">
                Admin
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search and Menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} mt-4 space-y-4 sm:hidden`}>
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Mobile Menu Items */}
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" className="justify-start text-white hover:bg-gray-800">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Carrito (0)
            </Button>
            <Link href="/admin/login" className="w-full">
              <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-black">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}