import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Building2, 
  MapPin, 
  Bell, 
  Plus, 
  User, 
  Compass, 
  Menu, 
  X,
  Network,
  LogOut,
  Mail,
  GraduationCap,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import { NotificationItem, UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar' | 'faculty';
  setActiveTab: (tab: 'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar' | 'faculty') => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenEmailModal: () => void;
  onOpenFacultyModal: () => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  firebaseUser: FirebaseUser | null;
  onLogout: () => void;
  onRoleRestrictedNotice: () => void;
  onOpenVideoShowcase?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  onOpenNotifications,
  onOpenEmailModal,
  onOpenFacultyModal,
  userProfile,
  onOpenProfile,
  firebaseUser,
  onLogout,
  onRoleRestrictedNotice,
  onOpenVideoShowcase,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isOrganizer = userProfile.role === 'organizer';

  const navItems: { id: 'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar'; label: string; icon: any }[] = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'events', label: 'Events', icon: CalendarIcon },
    { id: 'clubs', label: 'Clubs', icon: Users },
    { id: 'resources', label: 'Resources', icon: Building2 },
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'calendar', label: 'My Schedule', icon: CalendarIcon },
  ];

  const handleNavClick = (id: 'explore' | 'events' | 'clubs' | 'resources' | 'map' | 'calendar') => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handlePostEventClick = () => {
    if (isOrganizer) {
      onOpenFacultyModal();
    } else {
      onRoleRestrictedNotice();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF9F2]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-orange-200/80 dark:border-slate-800 text-stone-900 dark:text-slate-100 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              id="brand-logo"
              onClick={() => handleNavClick('explore')}
              className="flex items-center gap-2.5 text-left group select-none cursor-pointer"
            >
              <div className="relative w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs group-hover:bg-orange-700 transition-all border border-orange-500/40">
                <Network className="w-5 h-5 text-white transition-transform group-hover:scale-105" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="leading-tight flex flex-col justify-center">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-stone-900 dark:text-white block">
                  CampusConnect
                </span>
                <span className="text-[10px] sm:text-[11px] text-orange-800/80 dark:text-orange-400/90 font-medium tracking-tight block">
                  Vellore Institute of Technology
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 font-bold border border-orange-200/80 dark:border-orange-800/60 shadow-2xs'
                        : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-orange-50/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.id === 'calendar' && (userProfile?.rsvpdEvents || []).length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                        {(userProfile?.rsvpdEvents || []).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-orange-100/70 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
              title={theme === 'dark' ? "Switch to Warm Light Mode" : "Switch to High-Contrast Dark Mode"}
              aria-label="Toggle Theme Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700 dark:text-slate-300" />
              )}
            </button>

            {/* User Role Badge */}
            <div 
              id="user-role-badge"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                isOrganizer
                  ? 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700/80'
                  : 'bg-orange-100/70 dark:bg-slate-800 text-orange-900 dark:text-orange-300 border-orange-200 dark:border-slate-700'
              }`}
              title={isOrganizer ? "Logged in with Event Organizer privileges" : "Student account"}
            >
              {isOrganizer ? (
                <>
                  <Briefcase className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Organizer</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
                  <span>Student</span>
                </>
              )}
            </div>

            {/* Create / Host Event Button */}
            <button
              id="btn-post-event-nav"
              onClick={handlePostEventClick}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isOrganizer 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs' 
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
              }`}
              title={isOrganizer ? "Post a new event to campus" : "Requires Event Organizer permissions"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isOrganizer ? "Post Event" : "Post Event 🔒"}</span>
            </button>

            {/* Video Tour Showcase Button */}
            {onOpenVideoShowcase && (
              <button
                id="btn-video-tour-nav"
                onClick={onOpenVideoShowcase}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-100/80 dark:bg-slate-800 hover:bg-orange-200/80 dark:hover:bg-slate-700 text-orange-950 dark:text-orange-300 border border-orange-300/70 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Watch Campus Video & Infrastructure Tour"
              >
                <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 animate-pulse"></span>
                <span>Video Tour</span>
              </button>
            )}

            {/* Email Notifications Center */}
            <button
              id="btn-email-notifications-toggle"
              onClick={onOpenEmailModal}
              className="relative p-2 rounded-lg text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-orange-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Email Notifications & Sent Tickets"
              aria-label="Email Notifications"
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Notifications Toggle */}
            <button
              id="btn-notifications-toggle"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-orange-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-600 rounded-full" />
              )}
            </button>

            {/* Authenticated User Status & Logout Button */}
            {firebaseUser && (
              <div className="flex items-center gap-2">
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-800 dark:hover:text-rose-200 border border-rose-200/80 dark:border-rose-800/60 transition-colors shadow-2xs cursor-pointer"
                  title="Sign out from Firebase and return to login"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            )}

            {/* User Profile Avatar Pill */}
            <button
              id="btn-user-profile"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-2 rounded-lg text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-orange-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Student Settings & Preferences"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white md:hidden cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-orange-200/60 dark:border-slate-800 space-y-1 animate-in fade-in duration-150 bg-[#FFF9F2] dark:bg-[#0B0F19]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between text-left cursor-pointer ${
                    isActive
                      ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'calendar' && (userProfile?.rsvpdEvents || []).length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                      {(userProfile?.rsvpdEvents || []).length}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-orange-200/60 dark:border-slate-800 space-y-2">
              {/* Mobile Theme Toggle */}
              <button
                id="btn-theme-toggle-mobile"
                onClick={onToggleTheme}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-orange-100/70 dark:bg-slate-800 text-stone-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
                  <span>{theme === 'dark' ? 'Theme: Dark Mode' : 'Theme: Light Mode'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200/70 dark:bg-slate-700 text-orange-950 dark:text-slate-200 font-bold">
                  {theme === 'dark' ? 'Switch to Light ☀️' : 'Switch to Dark 🌙'}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenEmailModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-orange-100 dark:bg-slate-800 text-orange-900 dark:text-orange-300 flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                <span>Email Notifications & Sent Tickets</span>
              </button>

              <button
                onClick={() => {
                  handlePostEventClick();
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  isOrganizer ? 'bg-orange-600 text-white' : 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isOrganizer ? "Post Campus Event" : "Post Event (Organizer Only 🔒)"}</span>
              </button>

              {firebaseUser && (
                <div className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-slate-800/80 text-[11px] text-stone-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="truncate">{firebaseUser.email}</span>
                  <button
                    id="btn-mobile-logout"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

