import { supabase } from '@/lib/supabase'
import { fetchApi } from '@/lib/api'

export type RatingCategory = 'FOOD_QUALITY' | 'PICKUP_EXPERIENCE' | 'DELIVERY_EXPERIENCE' | 'QUANTITY_ACCURACY'

export interface RatingInput {
  delivery_id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  category: RatingCategory
  comments?: string
}

export const ratingService = {
  /** Submit a new rating */
  async submitRating(input: RatingInput) {
    return fetchApi('/ratings/', {
      method: 'POST',
      body: JSON.stringify({
        delivery_id: input.delivery_id,
        target_user_id: input.reviewed_user_id,
        rating: input.rating,
        feedback: input.comments || '',
        role_of_rater: 'UNKNOWN' // We might need to adjust the backend if the frontend doesn't supply this
      })
    })
  },

  /** Check if user has already rated a specific delivery */
  async hasRated(deliveryId: string, reviewerId: string, reviewedUserId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select('id')
      .eq('delivery_id', deliveryId)
      .eq('reviewer_id', reviewerId)
      .eq('reviewed_user_id', reviewedUserId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      throw new Error('Failed to check rating status: ' + error.message)
    }

    return !!data
  }
}
