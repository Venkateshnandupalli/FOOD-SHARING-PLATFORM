import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  Leaf, Bell, Menu, X, LogOut, Settings, ChevronRight,
  LayoutDashboard, Package, Heart, Truck, BarChart3,
  Users, Shield, MapPin, PlusCircle, ClipboardList,
  Star, TrendingUp, FileText
} from 'lucide-react'
import { Avatar, Badge, NotificationBell } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { roleLabel, cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

// ─── Nav item definitions per role ────────────────────────────────────────────
const NAV_ITEMS: Record<UserRole, { label: string; path: string; icon: React.ElementType; badge?: string }[]> = {
  DONOR: [
    { label: 'Overview',         path: '/donor',                   icon: LayoutDashboard },
    { label: 'Create Donation',  path: '/donor/create',            icon: PlusCircle,    badge: 'New' },
    { label: 'My Donations',     path: '/donor/donations',         icon: Package },
    { label: 'Pickup Tracking',  path: '/donor/tracking',          icon: MapPin },
    { label: 'Impact Report',    path: '/donor/impact',            icon: TrendingUp },
    { label: 'Notifications',    path: '/donor/notifications',     icon: Bell },
    { label: 'Organisation',     path: '/donor/organisation',      icon: ClipboardList },
    { label: 'Settings',         path: '/donor/settings',          icon: Settings },
  ],
  RECIPIENT: [
    { label: 'Overview',         path: '/recipient',               icon: LayoutDashboard },
    { label: 'Nearby Donations', path: '/recipient/browse',        icon: MapPin },
    { label: 'My Requirements',  path: '/recipient/requirements',  icon: ClipboardList },
    { label: 'Accepted',         path: '/recipient/accepted',      icon: Heart },
    { label: 'Delivery History', path: '/recipient/history',       icon: Truck },
    { label: 'Notifications',    path: '/recipient/notifications', icon: Bell },
    { label: 'Organisation',     path: '/recipient/organisation',  icon: ClipboardList },
    { label: 'Settings',         path: '/recipient/settings',      icon: Settings },
  ],
  VOLUNTEER: [
    { label: 'Overview',         path: '/volunteer',               icon: LayoutDashboard },
    { label: 'Assignments',      path: '/volunteer/assignments',   icon: Truck },
    { label: 'Available Pickups',path: '/volunteer/available',     icon: Package },
    { label: 'My History',       path: '/volunteer/history',       icon: FileText },
    { label: 'Impact',           path: '/volunteer/impact',        icon: TrendingUp },
    { label: 'Ratings',          path: '/volunteer/ratings',       icon: Star },
    { label: 'Settings',         path: '/volunteer/settings',      icon: Settings },
  ],
  ADMIN: [
    { label: 'Overview',         path: '/admin',                   icon: LayoutDashboard },
    { label: 'Live Operations',  path: '/admin/operations',        icon: MapPin },
    { label: 'Verifications',    path: '/admin/verifications',     icon: Shield,  badge: '3' },
    { label: 'All Donations',    path: '/admin/donations',         icon: Package },
    { label: 'Users',            path: '/admin/users',             icon: Users },
    { label: 'Reports',          path: '/admin/reports',           icon: FileText },
    { label: 'Analytics',        path: '/admin/analytics',         icon: BarChart3 },
    { label: 'Settings',         path: '/admin/settings',          icon: Settings },
  ],
  ANALYST: [
    { label: 'Overview',         path: '/analytics',               icon: LayoutDashboard },
    { label: 'Donations',        path: '/analytics/donations',     icon: Package },
    { label: 'Recipients',       path: '/analytics/recipients',    icon: Heart },
    { label: 'Geographic',       path: '/analytics/geographic',    icon: MapPin },
    { label: 'ML Insights',      path: '/analytics/ml',            icon: TrendingUp },
    { label: 'Export',           path: '/analytics/export',        icon: FileText },
  ],
}

const ROLE_COLORS: Record<UserRole, { accent: string; light: string }> = {
  DONOR:     { accent: 'hsl(142,71%,28%)', light: 'hsl(142,60%,94%)' },
  RECIPIENT: { accent: 'hsl(25,90%,44%)',  light: 'hsl(25,100%,94%)' },
  VOLUNTEER: { accent: 'hsl(195,85%,41%)', light: 'hsl(195,85%,92%)' },
  ADMIN:     { accent: 'hsl(270,60%,38%)', light: 'hsl(270,70%,94%)' },
  ANALYST:   { accent: 'hsl(210,80%,38%)', light: 'hsl(210,80%,94%)' },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ role, onClose }: { role: UserRole; onClose?: () => void }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const items = NAV_ITEMS[role] ?? []
  const colors = ROLE_COLORS[role]

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="h-full flex flex-col bg-white border-r border-[hsl(220,13%,91%)]">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[hsl(220,13%,91%)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}cc)` }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[hsl(220,15%,15%)]">
            Share<span style={{ color: colors.accent }}>Plate</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(220,13%,94%)]" aria-label="Close sidebar">
            <X className="w-4 h-4 text-[hsl(220,10%,52%)]" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-[hsl(220,13%,91%)]">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: colors.light, color: colors.accent }}
        >
          {roleLabel(role)}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role.toLowerCase()}`}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 no-underline group',
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-[hsl(220,10%,45%)] hover:bg-[hsl(220,13%,96%)] hover:text-[hsl(220,15%,20%)]'
                )
              }
              style={({ isActive }) =>
                isActive ? { background: colors.accent } : {}
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[hsl(25,90%,44%)] text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-[hsl(220,13%,91%)] p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name ?? 'User'} imageUrl={profile?.profile_image_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[hsl(220,15%,15%)] truncate">
              {profile?.full_name ?? 'Your Name'}
            </p>
            <p className="text-xs text-[hsl(220,10%,52%)] truncate">{roleLabel(role)}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-[hsl(220,10%,60%)] hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Sign out"
            id="sidebar-signout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ role, onMenuClick }: { role: UserRole; onMenuClick: () => void }) {
  const { profile } = useAuthStore()
  const colors = ROLE_COLORS[role]

  return (
    <header className="h-16 bg-white border-b border-[hsl(220,13%,91%)] flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-[hsl(220,13%,94%)]"
        aria-label="Open sidebar"
        id="topbar-menu-btn"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Notification bell */}
      <NotificationBell />

      {/* User chip */}
      <div className="flex items-center gap-2.5 pl-2 border-l border-[hsl(220,13%,91%)]">
        <Avatar name={profile?.full_name ?? 'User'} imageUrl={profile?.profile_image_url} size="sm" />
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-[hsl(220,15%,15%)] leading-tight">
            {profile?.full_name ?? 'User'}
          </p>
          <p className="text-[10px] font-medium" style={{ color: colors.accent }}>
            {roleLabel(role)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(220,10%,60%)]" />
      </div>
    </header>
  )
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
export default function DashboardLayout({ role }: { role: UserRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout bg-[hsl(40,20%,97%)]">
      {/* Desktop sidebar (Grid column 1) */}
      <div className="hidden lg:block h-screen sticky top-0 border-r border-[hsl(220,13%,91%)] z-40 bg-white">
        <Sidebar role={role} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-72 h-full bg-white" onClick={(e) => e.stopPropagation()}>
            <Sidebar role={role} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content (Grid column 2) */}
      <div className="flex flex-col min-h-screen min-w-0">
        <Topbar role={role} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
