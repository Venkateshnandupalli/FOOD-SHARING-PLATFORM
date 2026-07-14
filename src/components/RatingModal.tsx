import React, { useState } from 'react'
import { Star, X } from 'lucide-react'
import { Button } from './ui'
import { ratingService, type RatingCategory } from '@/services/ratingService'
import toast from 'react-hot-toast'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  deliveryId: string
  reviewerId: string
  reviewedUserId: string
  reviewedUserName: string
  defaultCategory?: RatingCategory
  onSuccess?: () => void
}

export function RatingModal({
  isOpen, onClose, deliveryId, reviewerId, reviewedUserId, reviewedUserName,
  defaultCategory = 'GENERAL' as any, onSuccess
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [category, setCategory] = useState<RatingCategory>(
    defaultCategory === 'GENERAL' as any ? 'FOOD_QUALITY' : defaultCategory
  )
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }

    setIsSubmitting(true)
    try {
      // Basic check
      const hasRated = await ratingService.hasRated(deliveryId, reviewerId, reviewedUserId)
      if (hasRated) {
        toast.error('You have already rated this user for this delivery.')
        onClose()
        return
      }

      await ratingService.submitRating({
        delivery_id: deliveryId,
        reviewer_id: reviewerId,
        reviewed_user_id: reviewedUserId,
        rating,
        category,
        comments
      })
      toast.success('Thank you for your feedback!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Rate {reviewedUserName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-gray-500">
              {rating === 0 ? 'Select a rating' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RatingCategory)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="FOOD_QUALITY">Food Quality</option>
              <option value="PICKUP_EXPERIENCE">Pickup Experience</option>
              <option value="DELIVERY_EXPERIENCE">Delivery Experience</option>
              <option value="QUANTITY_ACCURACY">Quantity Accuracy</option>
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            isLoading={isSubmitting}
            className="mt-2 shadow-md hover:shadow-lg"
          >
            Submit Feedback
          </Button>
        </form>
      </div>
    </div>
  )
}
