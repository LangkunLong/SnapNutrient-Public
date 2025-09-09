"use client"
// app/pages/privacy-policy/page.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();
  
  const handleReturn = () => {
    router.push('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* X Button to return to base URL */}
      <div className="absolute top-4 left-4">
        <div 
          onClick={handleReturn}
          className="p-2 bg-white rounded-full shadow cursor-pointer hover:bg-gray-100 transition-colors">
          <X size={24} />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-4">Last Updated: March 24, 2025</p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p className="text-gray-700">
                Welcome to SnapNutrient (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring you have a positive experience on our website and while using our application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
              <div className="space-y-2">
                <p className="text-gray-700">We collect several types of information from and about users of our service:</p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li><strong>Personal Information:</strong> Name, email address, and profile information provided during registration or through OAuth services.</li>
                  <li><strong>Authentication Data:</strong> Information required to verify your identity when you sign in through Google OAuth.</li>
                  <li><strong>Food and Nutritional Data:</strong> Images of food you upload, nutritional information derived from these images, and your dietary history.</li>
                  <li><strong>User Preferences:</strong> Dietary goals, preferences, and other personalization information you provide.</li>
                  <li><strong>Social Platform Data:</strong> Posts, comments, likes, and interactions you create on our social platform.</li>
                  <li><strong>Usage Data:</strong> Information about how you access and use our service, including device information, browser type, and IP address.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <div className="space-y-2">
                <p className="text-gray-700">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Provide you with accurate nutritional analysis of your food images</li>
                  <li>Generate personalized dietary recommendations based on your goals and history</li>
                  <li>Authenticate your identity and maintain your account</li>
                  <li>Enable social platform functionality, including sharing achievements and progress</li>
                  <li>Improve our services and develop new features</li>
                  <li>Communicate with you about updates or changes to our service</li>
                  <li>Ensure the security and proper functioning of our platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Storage and Security</h2>
              <p className="text-gray-700">
                We use industry-standard security measures to protect your information. Your data is stored using Amazon Web Services (AWS), including DynamoDB for structured data and S3 for image storage. We implement appropriate technical and organizational measures to maintain the safety of your personal data.
              </p>
              <p className="text-gray-700 mt-2">
                While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. Your account is protected by your password, and we encourage you to use a unique and strong password, limit access to your computer and browser, and log out after using our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Third-Party Services</h2>
              <p className="text-gray-700">
                Our service integrates with several third-party services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mt-2">
                <li><strong>Google OAuth:</strong> Used for authentication purposes. When you use Google to sign in, we receive information in accordance with your Google privacy settings.</li>
                <li><strong>OpenAI:</strong> Used for image analysis and nutritional content estimation. Food images you upload may be processed by OpenAI&apos;s services.</li>
                <li><strong>Amazon Web Services (AWS):</strong> Used for data storage and processing. Your information is stored in compliance with AWS&apos;s security standards.</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Each of these services has their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
              <p className="text-gray-700">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mt-2">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccuracies in your personal information</li>
                <li>Delete your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Restrict or object to certain processing of your data</li>
              </ul>
              <p className="text-gray-700 mt-2">
                To exercise these rights, please contact us through the contact information provided at the end of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies and Similar Technologies</h2>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. These are sent to your browser from a website and stored on your device.
              </p>
              <p className="text-gray-700 mt-2">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Children&apos;s Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for use by individuals under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to remove that information from our servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 mt-2">
                Email: langkunlong@gmail.com<br />
                SnapNutrient Team<br />
                University of Toronto<br />
                Toronto, ON, Canada
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
