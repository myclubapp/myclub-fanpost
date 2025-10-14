import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import Studio from "./pages/Studio";
import Impressum from "./pages/Impressum";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PrivacyPolicyDe from "./pages/PrivacyPolicyDe";
import TermsAndConditions from "./pages/TermsAndConditions";
import TermsAndConditionsDe from "./pages/TermsAndConditionsDe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/edit/:id" element={<TemplateEditor />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
