import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * A wrapper around native fetch that automatically attaches the
 * Supabase JWT token to the Authorization header.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // 1. Get the current session to extract the JWT token
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    throw new Error('User is not authenticated. Cannot call secure API.')
  }

  // 2. Prepare headers
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${session.access_token}`)
  
  // Default to JSON if sending a body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // 3. Make the fetch call to the Python Backend
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers
  })

  // 4. Handle HTTP errors generically
  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching data.'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorMessage
    } catch (e) {
      // Not JSON
    }
    throw new Error(`API Error (${response.status}): ${errorMessage}`)
  }

  return response.json()
}
