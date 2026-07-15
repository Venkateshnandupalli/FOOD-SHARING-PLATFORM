import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  link_url?: string
  created_at: string
}

export const notificationService = {
  /** Fetch recent notifications for a user */
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data as Notification[]
  },

  /** Mark a single notification as read */
  async markAsRead(notificationId: string) {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  /** Mark all unread notifications as read for a user */
  async markAllAsRead(userId: string) {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  },

  /** Subscribe to new real-time notifications */
  subscribeToNotifications(userId: string, onNotify: (payload: any) => void) {
    return supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotify(payload.new)
        }
      )
      .subscribe()
  }
}
