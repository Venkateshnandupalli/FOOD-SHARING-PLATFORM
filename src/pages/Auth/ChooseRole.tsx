import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Heart, Users, Truck, ArrowRight } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/database'
import toast from 'react-hot-toast'

export default function ChooseRole() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if they are already onboarded
  useEffect(() => {
    if (profile?.is_onboarded) {
      navigate('/')
    }
  }, [profile, navigate])

  const roles = [
    {
      id: 'DONOR' as UserRole,
      title: 'Food Donor',
      description: 'I have surplus food to share (Restaurants, Supermarkets, Individuals)',
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-50',
      borderColor: 'border-red-500',
    },
    {
      id: 'RECIPIENT' as UserRole,
      title: 'Recipient Organisation',
      description: 'I manage an NGO, shelter, or community kitchen that needs food',
      icon: Users,
      color: 'text-[hsl(25,95%,60%)]',
      bg: 'bg-[hsl(25,95%,95%)]',
      borderColor: 'border-[hsl(25,95%,60%)]',
    },
    {
      id: 'VOLUNTEER' as UserRole,
      title: 'Volunteer Driver',
      description: 'I want to help pick up and deliver food to those in need',
      icon: Truck,
      color: 'text-[hsl(195,85%,41%)]',
      bg: 'bg-[hsl(195,85%,92%)]',
      borderColor: 'border-[hsl(195,85%,41%)]',
    },
  ]

  async function handleComplete() {
    if (!selectedRole || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({
          role: selectedRole,
          is_onboarded: true
        })
        .eq('auth_user_id', user.id)

      if (error) throw error

      await refreshProfile()
      toast.success('Profile updated successfully!')
      
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin',
        DONOR: '/donor',
        RECIPIENT: '/recipient',
        VOLUNTEER: '/volunteer',
        ANALYST: '/analytics',
      }
      
      navigate(roleRoutes[selectedRole] || '/')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(40,20%,97%)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(142,71%,28%)] mb-6 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-[hsl(220,15%,12%)] mb-3">How would you like to join?</h1>
          <p className="text-lg text-[hsl(220,10%,52%)] max-w-xl mx-auto">
            Choose how you want to participate in the SharePlate network. You can always change this later in settings.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`relative cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                selectedRole === role.id
                  ? `ring-2 ring-offset-2 ${role.borderColor} shadow-md`
                  : 'hover:shadow-md hover:border-[hsl(220,15%,85%)]'
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="p-6 h-full flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full ${role.bg} ${role.color} flex items-center justify-center mb-4`}>
                  <role.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(220,15%,15%)] mb-2">{role.title}</h3>
                <p className="text-[hsl(220,10%,52%)] text-sm flex-1">{role.description}</p>
                
                <div className={`mt-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedRole === role.id 
                    ? `${role.borderColor} bg-[hsl(25,95%,65%)]` 
                    : 'border-gray-300'
                }`}>
                  {selectedRole === role.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            className="w-full max-w-sm"
            disabled={!selectedRole}
            isLoading={isSubmitting}
            onClick={handleComplete}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  )
}
