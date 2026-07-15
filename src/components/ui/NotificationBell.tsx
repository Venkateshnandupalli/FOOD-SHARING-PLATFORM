import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notificationService, type Notification } from '@/services/notificationService'
import { useAuthStore } from '@/store/authStore'
import { Button } from './index' // Assuming Button is exported from index.tsx

export function NotificationBell() {
  const { profile } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!profile) return

    // 1. Fetch initial
    const loadNotifs = async () => {
      try {
        const data = await notificationService.getNotifications(profile.id)
        setNotifications(data)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      }
    }
    loadNotifs()

    // 2. Subscribe to real-time
    const subscription = notificationService.subscribeToNotifications(profile.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev])
      // Play a small sound or toast here if desired
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [profile])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error('Failed to mark read', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!profile) return
    try {
      await notificationService.markAllAsRead(profile.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark all read', err)
    }
  }

  if (!profile) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-[hsl(25,95%,53%)] hover:text-[hsl(25,95%,45%)] font-medium flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm flex flex-col items-center">
                <Bell className="w-8 h-8 text-gray-300 mb-2" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors hover:bg-gray-50 block ${notif.is_read ? 'opacity-70' : 'bg-[hsl(220,14%,98%)]'}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        {notif.link_url ? (
                          <Link 
                            to={notif.link_url} 
                            onClick={() => {
                              if (!notif.is_read) handleMarkAsRead(notif.id)
                              setIsOpen(false)
                            }}
                            className="block"
                          >
                            <p className={`text-sm font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                          </Link>
                        ) : (
                          <div className="block">
                            <p className={`text-sm font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                          {new Date(notif.created_at).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="text-gray-400 hover:text-[hsl(25,95%,53%)] self-start p-1"
                          title="Mark as read"
                        >
                          <span className="w-2 h-2 rounded-full bg-[hsl(25,95%,53%)] block"></span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
