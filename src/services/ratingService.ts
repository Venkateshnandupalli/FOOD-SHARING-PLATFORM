import { supabase } from '@/lib/supabase'

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
    const { error } = await supabase
      .from('ratings')
      .insert({
        delivery_id: input.delivery_id,
        reviewer_id: input.reviewer_id,
        reviewed_user_id: input.reviewed_user_id,
        rating: input.rating,
        category: input.category,
        comments: input.comments || null
      })

    if (error) {
      throw new Error('Failed to submit rating: ' + error.message)
    }

    return true
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
