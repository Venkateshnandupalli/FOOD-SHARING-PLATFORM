import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database'

export function useAuth() {
  const { user, session, profile, isLoading, isAuthenticated, setUser, setSession, setProfile, setLoading, signOut } =
    useAuthStore()

  useEffect(() => {
    console.log('[DEBUG] useAuth effect mounted')
    // Bootstrap session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[DEBUG] useAuth getSession resolved:', session)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        console.log('[DEBUG] useAuth: No session found, setting loading to false')
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DEBUG] useAuth onAuthStateChange event:', event, 'session:', session)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        console.log('[DEBUG] useAuth onAuthStateChange: No session, setting loading to false')
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      console.log('[DEBUG] useAuth effect unmounted')
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile(authUserId: string) {
    console.log('[DEBUG] fetchProfile starts for authUserId:', authUserId)
    setLoading(true)
    try {
      console.log('[DEBUG] fetchProfile: Querying profiles from supabase...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()
      console.log('[DEBUG] fetchProfile response:', { data, error })
      setProfile(data as Profile | null)
    } catch (err) {
      console.error('[DEBUG] fetchProfile caught error:', err)
      setProfile(null)
    } finally {
      console.log('[DEBUG] fetchProfile finally block - setting loading to false')
      setLoading(false)
    }
  }

  return { user, session, profile, isLoading, isAuthenticated, signOut }
}
