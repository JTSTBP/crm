import React from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useEmails } from '../../hooks/useEmails'

interface HeaderProps {
  onMenuClick: () => void
  isMobile: boolean
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile }) => {
  const { profile } = useAuth()
  const { getUnreadCount } = useEmails()
  
  const unreadEmailCount = getUnreadCount()

  return (
    <header className="glass border-b border-white/30 px-4 lg:px-6 py-4 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, proposals..."
                className="pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all duration-300 w-80"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-3 text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 rounded-xl hover:bg-white/20">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
              {3 + unreadEmailCount}
            </span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-success rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <span className="text-white font-semibold">
                {profile?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isMobile && (
              <div>
                <p className="text-sm font-semibold text-white">{profile?.name}</p>
                <p className="text-xs text-gray-300 font-medium">{profile?.role}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header