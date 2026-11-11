import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import PolicyLayout from './PolicyLayout';

const policySections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use-your-information', title: 'How We Use Your Information' },
  { id: 'property-enquiries-and-contact-information', title: 'Property Enquiries and Contact Information' },
  { id: 'cookies-and-browser-storage', title: 'Cookies and Browser Storage' },
  { id: 'sharing-information-with-third-parties', title: 'Sharing Information With Third Parties' },
  { id: 'data-security', title: 'Data Security' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'user-rights-and-choices', title: 'User Rights and Choices' },
  { id: 'third-party-links', title: 'Third-Party Links' },
  { id: 'childrens-privacy', title: "Children's Privacy" },
  { id: 'changes-to-privacy-policy', title: 'Changes to Privacy Policy' },
  { id: 'contact-information', title: 'Contact Information' },
];

const contactDetails = [
  '+91 9776 621 999',
  'dealinee0@gmail.com',
  'Flat GD, ISCON Residency, Patia, Bhubaneswar, 751024',
];

const businessReviewNote =
  'Business/legal review required before publication: final retention periods, specific third-party services, and exact legal commitments should be confirmed by the company before final release.';

function PrivacyPolicyPage() {
  const { hash } = useLocation();
  if (hash === '#terms-and-conditions') return <Navigate to="/terms-and-conditions" replace />;

  return (
    <PolicyLayout
      title="Privacy Policy"
      description="This page explains how Dealinee Estate collects, uses, stores, and protects personal information when you browse properties, submit enquiries, or contact our team."
      sections={policySections}
    >
      <section id="introduction" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">1. Introduction</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Dealinee Estate is a real estate platform focused on helping buyers, sellers, tenants, and investors discover suitable properties and connect with the right property professionals. This Privacy Policy outlines the principles and practices we follow when we collect, use, store, and handle personal information received through our website, property listings, enquiry forms, and direct communication channels.
          </p>
          <p>
            By using our website and related services, you agree that your information may be processed in accordance with this policy, subject to applicable law and any business procedures that may be introduced over time.
          </p>
          <p className="rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {businessReviewNote}
          </p>
        </div>
      </section>

      <section id="information-we-collect" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">2. Information We Collect</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>We may collect information that helps us provide a better property search and enquiry experience. This may include:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Contact information such as name, phone number, email address, and postal address.</li>
            <li>Property preferences, inquiry details, and information submitted through enquiry or contact forms.</li>
            <li>Account or profile information when you register or sign in to use site features.</li>
            <li>Device, browser, and technical information used to improve website functionality and security.</li>
            <li>Usage information such as pages visited, property searches, and browsing patterns.</li>
            <li>Communications and records from customer support, calls, emails, or other direct contact with our team.</li>
          </ul>
          <p>
            Some information may be provided directly by you, while other information may be generated automatically when you use the website.
          </p>
        </div>
      </section>

      <section id="how-we-use-your-information" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">3. How We Use Your Information</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>We may use information collected from you for the following purposes:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>To respond to property enquiries and provide information about listings or services.</li>
            <li>To help connect buyers, sellers, and renters with relevant properties or property professionals.</li>
            <li>To improve website design, search quality, and user experience.</li>
            <li>To manage user accounts, preferences, and communications where applicable.</li>
            <li>To maintain platform security and prevent misuse, fraud, or abuse.</li>
            <li>To comply with legal notices, regulatory obligations, or legitimate business requirements.</li>
          </ul>
          <p>
            We do not use personal data for unrelated purposes without a valid business reason and, where required, your consent or notice.
          </p>
        </div>
      </section>

      <section id="property-enquiries-and-contact-information" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">4. Property Enquiries and Contact Information</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            When you enquire about a property or contact Dealinee Estate, we may process the information you provide to respond to your request, confirm availability, arrange follow-up communication, and support the transaction process.
          </p>
          <p>
            This may include contact details, property interest information, expectations, and messages exchanged through the website or direct contact channels. We may use this information to coordinate with the relevant property owner, manager, or team member as part of the enquiry and follow-up process.
          </p>
          <div className="rounded-2xl bg-gray-900 p-5 text-white">
            <h3 className="mb-3 text-lg font-bold text-red-300">Dealinee Estate Contact Details</h3>
            <ul className="space-y-2 text-sm text-gray-200">
              {contactDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="cookies-and-browser-storage" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">5. Cookies and Browser Storage</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Our website may use cookies, local storage, or similar browser technologies to remember preferences, support secure sessions, improve site performance, and help us understand how visitors use the platform.
          </p>
          <p>
            Some cookies are necessary for website functionality, while others may help with analytics, user experience, or marketing-related measurements. You may be able to manage or disable cookies through your browser settings, subject to the impact on website functionality.
          </p>
          <p className="rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            Business confirmation required for analytics providers, cookie categories, and cookie consent configuration.
          </p>
        </div>
      </section>

      <section id="sharing-information-with-third-parties" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">6. Sharing Information With Third Parties</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            We may share information with trusted internal teams, business partners, service providers, or third parties when necessary to deliver the services requested by you, operate the website, or meet legal or business obligations.
          </p>
          <p>
            Information may also be disclosed in cases involving legal requests, fraud prevention, contract enforcement, or the protection of rights, property interests, or public safety. We do not sell personal data for marketing purposes.
          </p>
          <p className="rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            Final categories of third-party recipients and any cross-border transfer arrangements should be reviewed and confirmed by the business team before launch.
          </p>
        </div>
      </section>

      <section id="data-security" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">7. Data Security</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Dealinee Estate takes reasonable technical and organizational measures to protect personal information from unauthorized access, misuse, alteration, or loss. These measures may include secure hosting, restricted access controls, and standard security practices for website operations.
          </p>
          <p>
            However, no system can guarantee absolute security. We encourage users to use strong passwords, protect their devices, and avoid sharing sensitive information through unsecured channels.
          </p>
        </div>
      </section>

      <section id="data-retention" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">8. Data Retention</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            We retain personal information only for as long as necessary to fulfil the purpose for which it was collected, to meet legal or regulatory obligations, or to support ongoing business operations.
          </p>
          <p>
            When information is no longer required, we may delete, anonymize, or securely archive it in accordance with our internal procedures and applicable law.
          </p>
          <p className="rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            Final retention schedule and deletion procedures require internal business review before the policy is finalized.
          </p>
        </div>
      </section>

      <section id="user-rights-and-choices" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">9. User Rights and Choices</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Depending on the circumstances and applicable law, you may have the right to access, correct, update, restrict, or request deletion of your personal information. You may also choose to opt out of certain marketing or communication preferences where such communications are applicable.
          </p>
          <p>
            If you want to update your preferences, request information about your records, or raise a privacy concern, you may contact us using the details listed in this policy. We will review requests as appropriate and may ask for identity verification where necessary.
          </p>
          <p className="rounded-xl border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            Exact request workflow, response timelines, and available rights should be finalized by the business/legal team.
          </p>
        </div>
      </section>

      <section id="third-party-links" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">10. Third-Party Links</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Our website may contain links to external websites, property listings, informational resources, or partner platforms. These third-party websites are not operated by Dealinee Estate and may have their own privacy practices.
          </p>
          <p>
            We encourage users to review the privacy policy of any third-party platform before submitting personal information or engaging in transactions. We accept no responsibility for the privacy practices of external websites unless specifically stated in writing.
          </p>
        </div>
      </section>

      <section id="childrens-privacy" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">11. Children's Privacy</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Our platform is not intended for children under the age of 18 without parent or guardian involvement. We do not knowingly collect personal information from children in a way that would require formal consent under applicable law.
          </p>
          <p>
            If we become aware of any child’s personal information being collected without proper authorization, we will take appropriate steps to remove or restrict that information as soon as practicable.
          </p>
        </div>
      </section>

      <section id="changes-to-privacy-policy" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">12. Changes to Privacy Policy</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            Dealinee Estate may update this Privacy Policy from time to time to reflect operational changes, business needs, legal developments, or improvements to our platform. We may revise the policy and publish the updated version on this page.
          </p>
          <p>
            Continued use of the website after the policy is updated indicates your acceptance of the revised terms, subject to applicable law and notice requirements.
          </p>
        </div>
      </section>

      <section id="contact-information" className="scroll-mt-24 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-2xl font-black text-red-600 md:text-3xl">13. Contact Information</h2>
        <div className="space-y-4 text-base leading-8 text-gray-700">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, you may contact us using the details below:
          </p>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-gray-800">
            <p className="font-bold text-red-700">Dealinee Estate</p>
            <ul className="mt-3 space-y-2">
              <li>Phone: <a href="tel:+919776621999" className="font-medium text-red-700 hover:underline">+91 9776 621 999</a></li>
              <li>Email: <a href="mailto:dealinee0@gmail.com" className="font-medium text-red-700 hover:underline">dealinee0@gmail.com</a></li>
              <li>Address: Flat GD, ISCON Residency, Patia, Bhubaneswar, 751024</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-gradient-to-r from-gray-900 to-red-700 p-6 text-white shadow-lg md:p-8">
        <h3 className="text-xl font-black md:text-2xl">Need assistance?</h3>
        <p className="mt-2 max-w-2xl text-sm text-red-50 md:text-base">
          If you need help with a property enquiry or would like to understand how we handle your information, please reach out through the contact details above.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center rounded-xl bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50"
          >
            Contact Us
          </Link>
          <Link
            to="/properties"
            className="inline-flex items-center rounded-xl border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Explore Properties
          </Link>
        </div>
      </div>
    </PolicyLayout>
  );
}

export default PrivacyPolicyPage;
