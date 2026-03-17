import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/header'
import Footer from '@/components/footer'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import Loading from '@/components/loading'
import { useSessionExpiry } from '@/hooks/useSessionExpiry'

// Lazy load page components for code splitting
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Home = lazy(() => import('@/pages/Home'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const Login = lazy(() => import('@/pages/Login'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Verify = lazy(() => import('@/pages/Verify'))
const Signup = lazy(() => import('@/pages/Signup'))
const Register = lazy(() => import('@/pages/Register'))
const Manager = lazy(() => import('@/pages/Manager'))
const SuperAdmin = lazy(() => import('@/pages/SuperAdmin'))
const Admin = lazy(() => import('@/pages/Admin'))
const Owner = lazy(() => import('@/pages/Owner'))
const Tenant = lazy(() => import('@/pages/Tenant'))
const Maintenance = lazy(() => import('@/pages/Maintenance'))
const PageNotFound = lazy(() => import('@/pages/PageNotFound'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Handoff = lazy(() => import('@/pages/Handoff'))
const FreeTrial = lazy(() => import('@/pages/FreeTrial'))
const Features = lazy(() => import('@/pages/Features'))
const Product = lazy(() => import('@/pages/Product'))

const HIDE_CHROME_PREFIXES = [
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/super-admin',
  '/admin',
  '/dashboard',
  '/owner',
  '/tenant',
  '/maintenance',
  '/handoff',
]

function App() {
  const location = useLocation()
  const shouldHideChrome = HIDE_CHROME_PREFIXES.some(route => location.pathname.startsWith(route))

  // Redirect to /login when the HTTP layer detects an unrecoverable session
  useSessionExpiry()

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          {!shouldHideChrome && <Header />}
          <main id="main-content" className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/free-trial" element={<FreeTrial />} />
                <Route path="/features" element={<Features />} />
                <Route path="/product" element={<Product />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/signup/:token" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                
                {/* Protected Routes - Role-Specific Portals */}
                <Route path="/super-admin/*" element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <SuperAdmin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/*" element={
                  <ProtectedRoute allowedRoles={["manager"]}>
                    <Manager />
                  </ProtectedRoute>
                } />
                <Route path="/owner/*" element={
                  <ProtectedRoute allowedRoles={["owner"]}>
                    <Owner />
                  </ProtectedRoute>
                } />
                <Route path="/tenant/*" element={
                  <ProtectedRoute allowedRoles={["tenant"]}>
                    <Tenant />
                  </ProtectedRoute>
                } />
                <Route path="/maintenance/*" element={
                  <ProtectedRoute allowedRoles={["maintenance"]}>
                    <Maintenance />
                  </ProtectedRoute>
                } />
                
                {/* Semi-protected routes (available to logged-in users) */}
                <Route path="/handoff/:propertyId?" element={
                  <ProtectedRoute>
                    <Handoff />
                  </ProtectedRoute>
                } />
                
                {/* 404 Page */}
                <Route path="*" element={<PageNotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          {!shouldHideChrome && <Footer />}
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
