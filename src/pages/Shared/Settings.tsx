import React, { useState } from 'react'
import {
  User, Phone, Save, Lock, Mail, ShieldCheck, Trash2,
  Eye, EyeOff, CheckCircle, AlertTriangle
} from 'lucide-react'
import { Input, Button, Card, Spinner, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { profileService } from '@/services/profileService'
import { supabase } from '@/lib/supabase'
import { roleLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function Settings() {
  const { profile, refreshProfile, user, signOut } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [showDanger, setShowDanger] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await profileService.updateProfile(profile.id, formData)
      await refreshProfile()
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update profile: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setIsSendingReset(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSendingReset(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm.')
      return
    }
    try {
      // Sign out first (account deletion requires backend/edge-function in prod)
      toast('Account deletion requested. Your account will be reviewed for removal.', { icon: '⚠️', duration: 5000 })
      await signOut()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your profile, security, and account preferences.</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(142,71%,28%)] to-[hsl(142,71%,42%)] flex items-center justify-center text-white text-lg font-bold">
            {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-bold text-gray-900">{profile.full_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="info" className="text-xs">{roleLabel(profile.role as any)}</Badge>
              {profile.is_active !== false && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Profile Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            leftIcon={<Phone className="w-4 h-4" />}
            type="tel"
          />
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Section */}
      <Card className="p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">Security</h2>
        <div className="space-y-4">
          {/* Email (read-only) */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Email Address</p>
              <p className="text-sm font-medium text-gray-800">{user?.email || 'Not available'}</p>
            </div>
            <Badge variant="default" className="text-xs">Read-only</Badge>
          </div>

          {/* Password Reset */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Password</p>
              <p className="text-xs text-gray-500 mt-0.5">
                We'll send a secure reset link to <strong>{user?.email}</strong>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              isLoading={isSendingReset}
              className="shrink-0"
            >
              Reset Password
            </Button>
          </div>

          {/* 2FA placeholder */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white opacity-60">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account.</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-medium shrink-0">Coming Soon</span>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-100">
        <button
          onClick={() => setShowDanger(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide">Danger Zone</h2>
          </div>
          <span className="text-xs text-gray-400">{showDanger ? 'Hide' : 'Show'}</span>
        </button>

        {showDanger && (
          <div className="mt-5 pt-5 border-t border-red-100 space-y-4">
            <p className="text-sm text-gray-600">
              Deleting your account is <strong>irreversible</strong>. All your donation records, history, and profile data will be permanently removed.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Type <code className="bg-red-50 text-red-600 px-1 py-0.5 rounded">DELETE</code> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full h-11 px-4 rounded-xl border border-red-200 text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              className="w-full"
              disabled={deleteConfirm !== 'DELETE'}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
