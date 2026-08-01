import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'
import ChooseRole from '@/pages/Auth/ChooseRole'

// Dashboard layout + dashboards
import DashboardLayout from '@/components/layout/DashboardLayout'
import DonorDashboard from '@/pages/Dashboard/DonorDashboard'
import CreateDonation from '@/pages/Dashboard/Donor/CreateDonation'
import DonationList from '@/pages/Dashboard/Donor/DonationList'
import DonationDetail from '@/pages/Dashboard/Donor/DonationDetail'
import ImpactDashboard from '@/pages/Dashboard/Donor/ImpactDashboard'
import PickupTracking from '@/pages/Dashboard/Donor/PickupTracking'

import RecipientDashboard from '@/pages/Dashboard/RecipientDashboard'
import BrowseDonations from '@/pages/Dashboard/Recipient/BrowseDonations'
import OrganizationOnboarding from '@/pages/Dashboard/Recipient/OrganizationOnboarding'
import MyRequirements from '@/pages/Dashboard/Recipient/MyRequirements'
import AcceptedDonations from '@/pages/Dashboard/Recipient/AcceptedDonations'
import RecipientDeliveryHistory from '@/pages/Dashboard/Recipient/DeliveryHistory'

import VolunteerDashboard from '@/pages/Dashboard/VolunteerDashboard'
import VolunteerImpactDashboard from '@/pages/Dashboard/Volunteer/ImpactDashboard'
import AllAssignments from '@/pages/Dashboard/Volunteer/AllAssignments'
import AvailablePickups from '@/pages/Dashboard/Volunteer/AvailablePickups'
import VolunteerDeliveryHistory from '@/pages/Dashboard/Volunteer/DeliveryHistory'
import VolunteerRatings from '@/pages/Dashboard/Volunteer/Ratings'

import AdminDashboard from '@/pages/Dashboard/AdminDashboard'
import LiveOperations from '@/pages/Dashboard/Admin/LiveOperations'
import Verifications from '@/pages/Dashboard/Admin/Verifications'
import AllDonations from '@/pages/Dashboard/Admin/AllDonations'
import UserManagement from '@/pages/Dashboard/Admin/UserManagement'
import Reports from '@/pages/Dashboard/Admin/Reports'
import PlatformAnalytics from '@/pages/Dashboard/Admin/PlatformAnalytics'

import AnalystDashboard from '@/pages/Dashboard/AnalystDashboard'
import DonationAnalytics from '@/pages/Dashboard/Analyst/DonationAnalytics'
import GeographicDashboard from '@/pages/Dashboard/Analyst/GeographicDashboard'
import DataExport from '@/pages/Dashboard/Analyst/DataExport'
import RecipientAnalytics from '@/pages/Dashboard/Analyst/RecipientAnalytics'
import MLInsights from '@/pages/Dashboard/Analyst/MLInsights'

// Shared
import Settings from '@/pages/Shared/Settings'
import Notifications from '@/pages/Shared/Notifications'
import OrganisationProfile from '@/pages/Shared/OrganisationProfile'

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
        <Route path="/choose-role" element={<ChooseRole />} />

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
          <Route path="tracking"     element={<PickupTracking />} />
          <Route path="impact"       element={<ImpactDashboard />} />
          <Route path="notifications"element={<Notifications />} />
          <Route path="organisation" element={<OrganisationProfile />} />
          <Route path="settings"     element={<Settings />} />
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
          <Route path="requirements"  element={<MyRequirements />} />
          <Route path="accepted"      element={<AcceptedDonations />} />
          <Route path="history"       element={<RecipientDeliveryHistory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="organisation"  element={<OrganisationProfile />} />
          <Route path="settings"      element={<Settings />} />
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
          <Route path="assignments" element={<AllAssignments />} />
          <Route path="available"   element={<AvailablePickups />} />
          <Route path="history"     element={<VolunteerDeliveryHistory />} />
          <Route path="impact"      element={<VolunteerImpactDashboard />} />
          <Route path="ratings"     element={<VolunteerRatings />} />
          <Route path="settings"    element={<Settings />} />
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
          <Route path="operations"    element={<LiveOperations />} />
          <Route path="verifications" element={<Verifications />} />
          <Route path="donations"     element={<AllDonations />} />
          <Route path="users"         element={<UserManagement />} />
          <Route path="reports"       element={<Reports />} />
          <Route path="analytics"     element={<PlatformAnalytics />} />
          <Route path="settings"      element={<Settings />} />
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
          <Route index element={<AnalystDashboard />} />
          <Route path="donations"  element={<DonationAnalytics />} />
          <Route path="recipients" element={<RecipientAnalytics />} />
          <Route path="geographic" element={<GeographicDashboard />} />
          <Route path="ml"         element={<MLInsights />} />
          <Route path="export"     element={<DataExport />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
