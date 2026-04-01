import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TemplateRedirect } from "@/components/TemplateRedirect";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const Studio = lazy(() => import("./pages/Studio"));
const Impressum = lazy(() => import("./pages/Impressum"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PrivacyPolicyDe = lazy(() => import("./pages/PrivacyPolicyDe"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const TermsAndConditionsDe = lazy(() => import("./pages/TermsAndConditionsDe"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/profile/templates/new" element={<TemplateEditor />} />
            <Route path="/profile/templates/edit/:id" element={<TemplateEditor />} />
            {/* Redirect old /templates routes to /profile/templates */}
            <Route path="/templates" element={<Navigate to="/profile/templates" replace />} />
            <Route path="/templates/new" element={<Navigate to="/profile/templates/new" replace />} />
            <Route path="/templates/edit/:id" element={<TemplateRedirect />} />
            <Route path="/templates/:id" element={<TemplateRedirect />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/:sport" element={<Studio />} />
            <Route path="/studio/:sport/:clubId" element={<Studio />} />
            <Route path="/studio/:sport/:clubId/:teamId" element={<Studio />} />
            <Route path="/studio/:sport/:clubId/:teamId/:gameId" element={<Studio />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy-de" element={<PrivacyPolicyDe />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms-and-conditions-de" element={<TermsAndConditionsDe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
