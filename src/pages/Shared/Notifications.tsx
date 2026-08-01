import React, { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCheck, Trash2, Info, Package, Truck, Star, AlertCircle } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { notificationService, type Notification } from '@/services/notificationService'
import { timeAgo, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  MATCH_FOUND:       { icon: Package,      color: 'text-emerald-600', bg: 'bg-emerald-100' },
  DONATION_ACCEPTED: { icon: CheckCheck,   color: 'text-blue-600',    bg: 'bg-blue-100'    },
  DELIVERY_UPDATE:   { icon: Truck,        color: 'text-orange-600',  bg: 'bg-orange-100'  },
  RATING_RECEIVED:   { icon: Star,         color: 'text-yellow-600',  bg: 'bg-yellow-100'  },
  SYSTEM_ALERT:      { icon: AlertCircle,  color: 'text-red-600',     bg: 'bg-red-100'     },
  DEFAULT:           { icon: Info,         color: 'text-gray-600',    bg: 'bg-gray-100'    },
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const n of notifications) {
    const d = new Date(n.created_at)
    let key: string
    if (d.toDateString() === today.toDateString()) key = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = formatDate(n.created_at, 'dd MMM yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  }
  return groups
}

export default function Notifications() {
  const { profile } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      const data = await notificationService.getNotifications(profile.id)
      setNotifications(data)
    } catch (err: any) {
      toast.error('Failed to load notifications: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Subscribe to real-time notifications
    if (!profile) return
    const channel = notificationService.subscribeToNotifications(profile.id, (newN) => {
      setNotifications(prev => [newN as Notification, ...prev])
      toast(newN.title, { icon: '🔔' })
    })
    return () => { channel.unsubscribe() }
  }, [profile])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    if (!profile) return
    setMarkingAll(true)
    try {
      await notificationService.markAllAsRead(profile.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const grouped = groupByDate(notifications)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You\'re all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} isLoading={markingAll}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="w-8 h-8 text-gray-400" />}
          title="No notifications yet"
          description="When there's activity on your donations or deliveries, you'll see it here."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{dateLabel}</p>
              <div className="space-y-2">
                {items.map((n) => {
                  const cfg = TYPE_CONFIG[n.notification_type] ?? TYPE_CONFIG.DEFAULT
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className={`
                        flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer group
                        ${n.is_read
                          ? 'bg-white border-gray-100 hover:border-gray-200'
                          : 'bg-[hsl(142,60%,98%)] border-[hsl(142,71%,85%)] hover:border-[hsl(142,71%,70%)] shadow-sm'
                        }
                      `}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[hsl(142,71%,28%)] shrink-0" />
                            )}
                            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        {n.notification_type && (
                          <Badge
                            variant="default"
                            className="mt-2 text-[10px]"
                          >
                            {n.notification_type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
