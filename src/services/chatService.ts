import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  // Added by join
  sender?: {
    full_name: string
    profile_image_url: string
  }
}

export const chatService = {
  /** Fetch existing messages for a match */
  async getMessages(matchId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(full_name, profile_image_url)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as ChatMessage[]
  },

  /** Send a new message */
  async sendMessage(matchId: string, senderId: string, content: string) {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content
      })

    if (error) throw error
  },

  /** Subscribe to new real-time messages for a match */
  subscribeToMatch(matchId: string, onMessage: (payload: any) => void) {
    return supabase
      .channel(`chat:match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          onMessage(payload.new)
        }
      )
      .subscribe()
  }
}
