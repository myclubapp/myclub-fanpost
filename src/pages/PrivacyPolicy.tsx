import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy (Version Oktober 2025)</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to KANVA. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use our Service, as well as the associated choices you have.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Collection and Use of Information</h2>
            <p className="text-muted-foreground mb-4">
              For a better experience while using our Service, we may require certain personally identifiable information from you, including but not limited to your email address, first and last name. This information is used to create your user profile, with which social media posts for your sports team are created and managed.
            </p>
            
            <h3 className="text-xl font-semibold mb-2">a. Profile Creation</h3>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground space-y-2">
              <li>
                <strong>Required Information:</strong> To create an account, we require your email address, first name, and last name.
              </li>
              <li>
                <strong>Additional Information:</strong> Your profile information is used to personalize your experience with KANVA.
              </li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-2">b. Data Hosting</h3>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground">
              <li>
                Your data is processed and stored in Switzerland (Europe-West6 region) to ensure compliance with local data protection and privacy regulations.
              </li>
            </ul>
          </section>
          
          {/*<section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are files with a small amount of data that is commonly used as an anonymous unique identifier. These are sent to your browser from the website that you visit and are stored on your device's internal memory.
            </p>
            <p className="text-muted-foreground mb-4">
              This Service uses "cookies" explicitly to improve user experience. You have the option to either accept or refuse these cookies and know when a cookie is being sent to your device.
            </p>
          </section>*/}
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Service Providers</h2>
            <p className="text-muted-foreground mb-4">
              We may employ third-party companies and individuals due to the following reasons:
            </p>
            <ul className="list-disc pl-5 mb-4 text-muted-foreground space-y-2">
              <li>To facilitate our Service;</li>
              <li>To provide the Service on our behalf;</li>
              <li>To perform Service-related services; or</li>
              <li>To assist us in analyzing how our Service is used.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <p className="text-muted-foreground mb-4">
              We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Links to Other Sites</h2>
            <p className="text-muted-foreground mb-4">
              This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at <a href="mailto:support@getkanva.io" className="text-primary hover:underline">support@getkanva.io</a>.
            </p>
          </section>
          
          <div className="mt-12">
            <Link to="/" className="text-primary hover:underline">Back to Home</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;