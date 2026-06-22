import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { DevStatusBanner } from "@/components/DevStatusBanner";
import { AdminRoute } from "@/components/AdminRoute";
import PricingPage from "./pages/Pricing.tsx";
import Billing from "./pages/Billing.tsx";
import MockCheckout from "./pages/MockCheckout.tsx";
import AdminPanel from "./pages/admin/AdminPanel.tsx";
import ClaimAdmin from "./pages/admin/ClaimAdmin.tsx";
import Landing from "./pages/Landing.tsx";
import Features from "./pages/landing/Features.tsx";
import HowItWorks from "./pages/landing/HowItWorks.tsx";
import Families from "./pages/landing/Families.tsx";
import Pricing from "./pages/landing/Pricing.tsx";
import About from "./pages/landing/About.tsx";
import Contact from "./pages/landing/Contact.tsx";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Moments from "./pages/Moments.tsx";
import NewMemory from "./pages/NewMemory.tsx";
import Grow from "./pages/Grow.tsx";
import Records from "./pages/Records.tsx";
import Family from "./pages/Family.tsx";
import Share from "./pages/Share.tsx";
import Settings from "./pages/Settings.tsx";
import MyBooks from "./pages/books/MyBooks.tsx";
import CreateBook from "./pages/books/CreateBook.tsx";
import TemplateSelector from "./pages/books/TemplateSelector.tsx";
import MemorySelection from "./pages/books/MemorySelection.tsx";
import BookCustomizer from "./pages/books/BookCustomizer.tsx";
import BookPreview from "./pages/books/BookPreview.tsx";
import BookCheckout from "./pages/books/BookCheckout.tsx";
import OrderConfirmation from "./pages/books/OrderConfirmation.tsx";
import ExportShare from "./pages/ExportShare.tsx";
import GetApp from "./pages/GetApp.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <DevStatusBanner />

      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/get-app" element={<GetApp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/families" element={<Families />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moments"
              element={
                <ProtectedRoute>
                  <Moments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moments/new"
              element={
                <ProtectedRoute>
                  <NewMemory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grow"
              element={
                <ProtectedRoute>
                  <Grow />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <Records />
                </ProtectedRoute>
              }
            />
            <Route
              path="/family"
              element={
                <ProtectedRoute>
                  <Family />
                </ProtectedRoute>
              }
            />
            <Route path="/share/:token" element={<Share />} />
            <Route
              path="/export"
              element={
                <ProtectedRoute>
                  <ExportShare />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <MyBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/new"
              element={
                <ProtectedRoute>
                  <CreateBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/templates"
              element={
                <ProtectedRoute>
                  <TemplateSelector />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/memories"
              element={
                <ProtectedRoute>
                  <MemorySelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/customize"
              element={
                <ProtectedRoute>
                  <BookCustomizer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/preview"
              element={
                <ProtectedRoute>
                  <BookPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/checkout"
              element={
                <ProtectedRoute>
                  <BookCheckout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:id/confirmation"
              element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />
            <Route path="/pricing-plans" element={<PricingPage />} />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <MockCheckout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claim-admin"
              element={
                <ProtectedRoute>
                  <ClaimAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
