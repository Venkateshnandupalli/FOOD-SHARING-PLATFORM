import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'

// Dashboard layout + dashboards
import DashboardLayout from '@/components/layout/DashboardLayout'
import DonorDashboard from '@/pages/Dashboard/DonorDashboard'
import CreateDonation from '@/pages/Dashboard/Donor/CreateDonation'
import DonationList from '@/pages/Dashboard/Donor/DonationList'
import DonationDetail from '@/pages/Dashboard/Donor/DonationDetail'
import ImpactDashboard from '@/pages/Dashboard/Donor/ImpactDashboard'
import RecipientDashboard from '@/pages/Dashboard/RecipientDashboard'
import BrowseDonations from '@/pages/Dashboard/Recipient/BrowseDonations'
import OrganizationOnboarding from '@/pages/Dashboard/Recipient/OrganizationOnboarding'

import VolunteerDashboard from '@/pages/Dashboard/VolunteerDashboard'
import AdminDashboard from '@/pages/Dashboard/AdminDashboard'

// Guards
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Placeholder page for routes not yet built
function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(142,60%,94%)] flex items-center justify-center text-3xl mb-4">
        🚧
      </div>
      <h3 className="text-2xl font-bold text-[hsl(220,15%,15%)] mb-2">{page}</h3>
      <p className="text-[hsl(220,10%,52%)] max-w-sm">
        This page is being built. Check back soon — we're adding it in the next phase!
      </p>
    </div>
  )
}

export default function App() {
  // Bootstraps auth session on app load
  useAuth()

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: 'hsl(142,71%,28%)', secondary: 'white' } },
          error:   { iconTheme: { primary: 'hsl(0,75%,50%)',   secondary: 'white' } },
        }}
      />

      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Donor routes ── */}
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
              <DashboardLayout role="DONOR" />
            </ProtectedRoute>
          }
        >
          <Route index element={<DonorDashboard />} />
          <Route path="create"       element={<CreateDonation />} />
          <Route path="donations"    element={<DonationList />} />
          <Route path="donations/:id"element={<DonationDetail />} />
          <Route path="tracking"     element={<ComingSoon page="Pickup Tracking" />} />
          <Route path="impact"       element={<ImpactDashboard />} />
          <Route path="notifications"element={<ComingSoon page="Notifications" />} />
          <Route path="organisation" element={<ComingSoon page="Organisation Profile" />} />
          <Route path="settings"     element={<ComingSoon page="Settings" />} />
        </Route>

        {/* ── Recipient routes ── */}
        <Route
          path="/recipient"
          element={
            <ProtectedRoute allowedRoles={['RECIPIENT', 'ADMIN']}>
              <DashboardLayout role="RECIPIENT" />
            </ProtectedRoute>
          }
        >
          <Route index element={<RecipientDashboard />} />
          <Route path="onboarding"    element={<OrganizationOnboarding />} />
          <Route path="browse"        element={<BrowseDonations />} />
          <Route path="requirements"  element={<ComingSoon page="My Requirements" />} />
          <Route path="accepted"      element={<ComingSoon page="Accepted Donations" />} />
          <Route path="history"       element={<ComingSoon page="Delivery History" />} />
          <Route path="notifications" element={<ComingSoon page="Notifications" />} />
          <Route path="organisation"  element={<ComingSoon page="Organisation Profile" />} />
          <Route path="settings"      element={<ComingSoon page="Settings" />} />
        </Route>

        {/* ── Volunteer routes ── */}
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']}>
              <DashboardLayout role="VOLUNTEER" />
            </ProtectedRoute>
          }
        >
          <Route index element={<VolunteerDashboard />} />
          <Route path="assignments" element={<ComingSoon page="All Assignments" />} />
          <Route path="available"   element={<ComingSoon page="Available Pickups" />} />
          <Route path="history"     element={<ComingSoon page="Delivery History" />} />
          <Route path="impact"      element={<ComingSoon page="My Impact" />} />
          <Route path="ratings"     element={<ComingSoon page="Ratings & Reviews" />} />
          <Route path="settings"    element={<ComingSoon page="Settings" />} />
        </Route>

        {/* ── Admin routes ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout role="ADMIN" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="operations"    element={<ComingSoon page="Live Operations Map" />} />
          <Route path="verifications" element={<ComingSoon page="Verification Queue" />} />
          <Route path="donations"     element={<ComingSoon page="All Donations" />} />
          <Route path="users"         element={<ComingSoon page="User Management" />} />
          <Route path="reports"       element={<ComingSoon page="Reports & Incidents" />} />
          <Route path="analytics"     element={<ComingSoon page="Platform Analytics" />} />
          <Route path="settings"      element={<ComingSoon page="Platform Settings" />} />
        </Route>

        {/* ── Analytics routes ── */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['ANALYST', 'ADMIN']}>
              <DashboardLayout role="ANALYST" />
            </ProtectedRoute>
          }
        >
          <Route index element={<ComingSoon page="Analytics Overview" />} />
          <Route path="donations"  element={<ComingSoon page="Donation Analytics" />} />
          <Route path="recipients" element={<ComingSoon page="Recipient Analytics" />} />
          <Route path="geographic" element={<ComingSoon page="Geographic Dashboard" />} />
          <Route path="ml"         element={<ComingSoon page="ML Insights" />} />
          <Route path="export"     element={<ComingSoon page="Data Export" />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
