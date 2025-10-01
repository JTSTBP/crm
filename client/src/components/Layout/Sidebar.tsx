import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  CheckSquare, 
  BarChart3,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  Clock,
  Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  isMobile?: boolean
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isMobile, onClose }) => {
  const { profile, signOut } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'leads', label: 'Leads', icon: Users, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'email', label: 'Email', icon: Mail, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'internal-communication', label: 'Internal Comm', icon: MessageSquare, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'time-management', label: 'Time & Tasks', icon: Clock, roles: ['Admin', 'Manager'] },
    { id: 'automation', label: 'Automation', icon: Zap, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'proposals', label: 'Proposals', icon: FileText, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'rate-cards', label: 'Rate Cards', icon: DollarSign, roles: ['Admin', 'Manager'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Admin', 'Manager', 'BD Executive'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  )

  const handleItemClick = (pageId: string) => {
    onPageChange(pageId)
    if (isMobile && onClose) {
      onClose()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div className="h-full glass border-r border-white/30 flex flex-col relative overflow-y-auto">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none"></div>

      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg pulse-glow">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Jobs Territory
            </h1>
            <p className="text-sm text-gray-300 font-medium">CRM System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3 relative z-10">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? "gradient-primary text-white shadow-xl scale-105 border border-white/20"
                  : "text-gray-300 hover:bg-white/20 hover:text-white hover:scale-105 border border-transparent"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/30 relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 gradient-success rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold">
              {profile?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-white">{profile?.name}</p>
            <p className="text-xs text-gray-300 font-medium">{profile?.role}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar