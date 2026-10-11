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
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'calendar', label: 'Schedule', icon: CalendarIcon },
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
    <header className="sticky top-0 z-40 cc-navbar backdrop-blur-md border-b border-ink-200 text-ink-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              id="brand-logo"
              onClick={() => handleNavClick('explore')}
              className="flex items-center gap-2.5 text-left group select-none cursor-pointer"
            >
              <div className="cc-btn-brand relative w-9 h-9 rounded-xl flex items-center justify-center shadow-xs group-hover:bg-brand-700 transition-all border border-brand-500/40">
                <Network className="w-5 h-5 text-white transition-transform group-hover:scale-105" />
                              </div>
              <div className="leading-tight flex flex-col justify-center">
                <span className="font-display font-semibold text-lg tracking-tight text-ink-900 block whitespace-nowrap">
                  CampusConnect
                </span>
                <span className="text-xs text-ink-500 font-medium block whitespace-nowrap">
                  {isOrganizer ? 'Organizer account' : 'VIT Vellore'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav aria-label="Primary" className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-50 text-brand-800 font-semibold'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 hidden lg:block ${isActive ? 'text-brand-600' : 'text-ink-400'}`} />
                    <span>{item.label}</span>
                    {item.id === 'calendar' && (userProfile?.rsvpdEvents || []).length > 0 && (
                      <span className="cc-btn-brand ml-0.5 px-1.5 py-0.5 rounded-full text-2xs font-bold">
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
              className="p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer relative"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </button>

            {isOrganizer && (
              <button
                id="btn-post-event-nav"
                onClick={handlePostEventClick}
                className="cc-btn-brand cc-press hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Post event</span>
              </button>
            )}

            {/* Email Notifications Center */}
            <button
              id="btn-email-notifications-toggle"
              onClick={onOpenEmailModal}
              className="relative hidden sm:block p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
              title="Email center"
              aria-label="Email center"
            >
              <Mail className="w-[18px] h-[18px]" />
            </button>

            {/* Notifications Toggle */}
            <button
              id="btn-notifications-toggle"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-2xs font-semibold flex items-center justify-center tabular-nums">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Authenticated User Status & Logout Button */}
            {firebaseUser && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="hidden sm:block p-2 rounded-lg text-ink-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}

            {/* User Profile Avatar Pill */}
            <button
              id="btn-user-profile"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
              aria-label="Your profile"
              title="Your profile"
            >
              <User className="w-[18px] h-[18px]" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-ink-600 hover:text-ink-900 md:hidden cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-brand-200/60 space-y-1 animate-in fade-in duration-150 bg-paper">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between text-left cursor-pointer ${
                    isActive
                      ? 'bg-brand-100 text-brand-950 font-bold'
                      : 'text-ink-600 hover:bg-brand-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-brand-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'calendar' && (userProfile?.rsvpdEvents || []).length > 0 && (
                    <span className="cc-btn-brand px-1.5 py-0.5 rounded-full text-2xs font-bold">
                      {(userProfile?.rsvpdEvents || []).length}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-brand-200/60 space-y-2">
              {/* Mobile Theme Toggle */}
              <button
                id="btn-theme-toggle-mobile"
                onClick={onToggleTheme}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-brand-100/70 text-ink-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-ink-700" />}
                  <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                </div>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-brand-200/70 text-brand-950 font-bold">
                  {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenEmailModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-brand-100 text-brand-900 flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-brand-700" />
                <span>Email center</span>
              </button>

              <button
                onClick={() => {
                  handlePostEventClick();
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
                  isOrganizer ? 'cc-btn-brand' : 'bg-ink-200 text-ink-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isOrganizer ? "Post event" : "Post event (organizers only)"}</span>
              </button>

              {firebaseUser && (
                <div className="px-3 py-2 rounded-lg bg-brand-50 text-xs text-ink-700 flex items-center justify-between">
                  <span className="truncate">{firebaseUser.email}</span>
                  <button
                    id="btn-mobile-logout"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
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

