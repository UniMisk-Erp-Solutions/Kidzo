import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Documents from "./pages/Documents.tsx";
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
import CompanyLegal from "./pages/legal/CompanyLegal.tsx";
import Terms from "./pages/legal/Terms.tsx";
import Privacy from "./pages/legal/Privacy.tsx";
import CookiePolicy from "./pages/legal/CookiePolicy.tsx";
import CookiePreferences from "./pages/legal/CookiePreferences.tsx";
import Disclaimer from "./pages/legal/Disclaimer.tsx";
import RefundPolicy from "./pages/legal/RefundPolicy.tsx";
import ShippingPolicy from "./pages/legal/ShippingPolicy.tsx";
import ActivityInsight from "./pages/legal/ActivityInsight.tsx";
import DataProcessing from "./pages/legal/DataProcessing.tsx";
import DataRights from "./pages/legal/DataRights.tsx";

type Guard = "user" | "admin";
type AppRoute = { path: string; element: ReactElement; guard?: Guard };

/** Every route in the app. Pages marked "user" need a signed-in account; "admin" needs the admin role. */
const ROUTES: AppRoute[] = [
  { path: "/auth", element: <Auth /> },
  { path: "/get-app", element: <GetApp /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/settings", element: <Settings />, guard: "user" },
  { path: "/onboarding", element: <Onboarding />, guard: "user" },
  { path: "/", element: <Landing /> },
  { path: "/features", element: <Features /> },
  { path: "/how-it-works", element: <HowItWorks /> },
  { path: "/families", element: <Families /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/about", element: <About /> },
  { path: "/contact", element: <Contact /> },

  // Company & Legal
  { path: "/legal", element: <CompanyLegal /> },
  { path: "/legal/terms", element: <Terms /> },
  { path: "/legal/privacy", element: <Privacy /> },
  { path: "/legal/data-processing", element: <DataProcessing /> },
  { path: "/legal/data-rights", element: <DataRights /> },
  { path: "/legal/activity-insight", element: <ActivityInsight /> },
  { path: "/legal/cookies", element: <CookiePolicy /> },
  { path: "/legal/cookie-preferences", element: <CookiePreferences /> },
  { path: "/legal/disclaimer", element: <Disclaimer /> },
  { path: "/legal/refund-policy", element: <RefundPolicy /> },
  { path: "/legal/shipping-policy", element: <ShippingPolicy /> },

  { path: "/home", element: <Index />, guard: "user" },
  { path: "/moments", element: <Moments />, guard: "user" },
  { path: "/moments/new", element: <NewMemory />, guard: "user" },
  { path: "/grow", element: <Grow />, guard: "user" },
  { path: "/documents", element: <Documents />, guard: "user" },
  { path: "/records", element: <Navigate to="/documents" replace /> },
  { path: "/family", element: <Family />, guard: "user" },
  { path: "/share/:token", element: <Share /> },
  { path: "/export", element: <ExportShare />, guard: "user" },
  { path: "/books", element: <MyBooks />, guard: "user" },
  { path: "/books/new", element: <CreateBook />, guard: "user" },
  { path: "/books/templates", element: <TemplateSelector />, guard: "user" },
  { path: "/books/:id/memories", element: <MemorySelection />, guard: "user" },
  { path: "/books/:id/customize", element: <BookCustomizer />, guard: "user" },
  { path: "/books/:id/preview", element: <BookPreview />, guard: "user" },
  { path: "/books/:id/checkout", element: <BookCheckout />, guard: "user" },
  { path: "/books/:id/confirmation", element: <OrderConfirmation />, guard: "user" },
  { path: "/pricing-plans", element: <PricingPage /> },
  { path: "/billing", element: <Billing />, guard: "user" },
  { path: "/checkout", element: <MockCheckout />, guard: "user" },
  { path: "/claim-admin", element: <ClaimAdmin />, guard: "user" },
  { path: "/admin", element: <AdminPanel />, guard: "admin" },
];

const GUARDS = { user: ProtectedRoute, admin: AdminRoute };

const guarded = ({ element, guard }: AppRoute) => {
  if (!guard) return element;
  const Guard = GUARDS[guard];
  return <Guard>{element}</Guard>;
};

export const AppRoutes = () => (
  <Routes>
    {ROUTES.map((route) => (
      <Route key={route.path} path={route.path} element={guarded(route)} />
    ))}
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);
