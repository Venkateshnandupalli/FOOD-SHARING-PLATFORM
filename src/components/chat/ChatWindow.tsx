import React, { useState, useEffect, useRef } from 'react'
import { Send, User } from 'lucide-react'
import { chatService, type ChatMessage } from '@/services/chatService'
import { Avatar, Spinner } from '@/components/ui'
import { profileService } from '@/services/profileService'
import toast from 'react-hot-toast'

interface ChatWindowProps {
  matchId: string
  currentUserId: string
}

export function ChatWindow({ matchId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch profiles for realtime messages if needed (realtime doesn't join automatically)
  const fetchSenderProfile = async (senderId: string) => {
    try {
      return await profileService.getProfile(senderId)
    } catch {
      return null
    }
  }

  useEffect(() => {
    let subscription: any

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(matchId)
        setMessages(data)
      } catch (err: any) {
        toast.error('Failed to load chat: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    subscription = chatService.subscribeToMatch(matchId, async (newMsg: ChatMessage) => {
      // It won't have the joined `sender` object from realtime, so we fetch it or just use an empty object
      const profile = await fetchSenderProfile(newMsg.sender_id)
      const messageWithSender = {
        ...newMsg,
        sender: profile ? { full_name: profile.full_name, profile_image_url: profile.profile_image_url } : { full_name: 'Unknown', profile_image_url: '' }
      }
      setMessages((prev) => [...prev, messageWithSender as ChatMessage])
    })

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [matchId])

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      await chatService.sendMessage(matchId, currentUserId, newMessage.trim())
      setNewMessage('')
    } catch (err: any) {
      toast.error('Failed to send message: ' + err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-xl border border-gray-100">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Match Chat</h3>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
          End-to-end encrypted
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[hsl(220,20%,99%)]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <User className="w-10 h-10 opacity-50" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId
            // Determine if we should show the avatar (if the previous message was from a different user)
            const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 ${!showAvatar ? 'invisible' : ''}`}>
                  <Avatar 
                    name={msg.sender?.full_name || 'User'} 
                    imageUrl={msg.sender?.profile_image_url} 
                    size="sm" 
                  />
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {showAvatar && (
                    <span className="text-[10px] text-gray-500 mb-1 mx-1">
                      {isMe ? 'You' : msg.sender?.full_name?.split(' ')[0] || 'User'}
                    </span>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-[hsl(142,71%,28%)] text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 mx-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 max-h-32 min-h-[44px] resize-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,28%)] focus:bg-white text-sm transition-all"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              !newMessage.trim() || isSending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[hsl(142,71%,28%)] text-white hover:bg-[hsl(142,71%,24%)] shadow-sm'
            }`}
          >
            {isSending ? <Spinner size="sm" color="white" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}
