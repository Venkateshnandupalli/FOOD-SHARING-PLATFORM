import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database'

export function useAuth() {
  const { user, session, profile, isLoading, isAuthenticated, setUser, setSession, setProfile, setLoading, signOut } =
    useAuthStore()

  useEffect(() => {
    // Bootstrap session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile(authUserId: string) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()
      setProfile(data as Profile | null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  return { user, session, profile, isLoading, isAuthenticated, signOut }
}
