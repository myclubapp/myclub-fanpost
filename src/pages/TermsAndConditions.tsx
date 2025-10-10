import React from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Terms and Conditions (Version January 2025)</h1>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to FanPost. These Terms of Use ("Terms") govern your use of the FanPost website and application ("Service"). By accessing or using our Service, you agree to these Terms and our Privacy Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Use of Service</h2>
              <p className="text-muted-foreground mb-2">a. The Service is intended for users who are at least 18 years old. Minors may only use the Service in consultation with their legal guardians.</p>
              <p className="text-muted-foreground mb-2">b. You may only use the Service for lawful purposes and in accordance with these Terms.</p>
              <p className="text-muted-foreground mb-2">c. Any use or access by persons under 18 years of age is prohibited, unless the use is in consultation with legal guardians.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Accounts</h2>
              <p className="text-muted-foreground mb-2">a. To use certain features of the Service, you must create an account.</p>
              <p className="text-muted-foreground mb-2">b. You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p className="text-muted-foreground mb-2">c. You agree to promptly notify us if you become aware of any breach of security or unauthorized use of your account. Please use the email address <a href="mailto:hello@fanpost.ch" className="text-primary hover:underline">hello@fanpost.ch</a></p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Copyright</h2>
              <p className="text-muted-foreground mb-2">a. The Service and its original content, features, and functionality are and will remain the exclusive property of FanPost and its licensors.</p>
              <p className="text-muted-foreground mb-2">b. You may not copy, modify, distribute, sell, or lease any part of our Service or included software.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Payments and Subscriptions</h2>
              <p className="text-muted-foreground mb-2">a. Some parts of the Service may be provided for a fee ("Subscription(s)").</p>
              <p className="text-muted-foreground mb-2">b. You will be billed in advance on a recurring and periodic basis ("Billing Cycle").</p>
              <p className="text-muted-foreground mb-2">c. Fees are non-refundable except as required by law.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Termination</h2>
              <p className="text-muted-foreground mb-2">We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground mb-2">In no event shall FanPost, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="text-muted-foreground mb-2">These Terms shall be governed and construed in accordance with the laws of Switzerland, without regard to its conflict of law provisions.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground mb-2">We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-2">If you have any questions about these Terms, please contact us at <a href="mailto:hello@fanpost.ch" className="text-primary hover:underline">hello@fanpost.ch</a></p>
            </section>
            
            <div className="mt-12">
              <Link to="/" className="text-primary hover:underline">Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;