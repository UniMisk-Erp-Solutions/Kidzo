import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AmbientDecor } from "@/components/AmbientDecor";
import { SectionTheme, PageTransition } from "@/components/SectionTheme";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieBanner } from "@/components/CookieBanner";
import { AppRoutes } from "./AppRoutes.tsx";

// Short staleTime: revisiting a page shows cached data instantly instead of refetching every time.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />

      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <SectionTheme />
          <AmbientDecor />
          <CookieBanner />
          <PageTransition>
          <AppRoutes />
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
