import React from 'react';
import { ArrowLeft, Mail, Phone, ShieldCheck, User } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

interface Section {
  heading: string;
  paragraph?: string;
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    heading: '1. Who We Are',
    paragraph:
      'DRISTI DHIMAHI VYAPAAR PRIVATE LIMITED operates Drishti Fashions to market, sell, and retail apparel and fashion wear. When we collect and manage your personal data, we act as a Data Controller, ensuring it is handled securely and responsibly.',
  },
  {
    heading: '2. Personal Information We Gather',
    paragraph:
      'To provide you with a seamless shopping experience, register your account, process payments, and send updates, we collect various types of information:',
    bullets: [
      'Information You Give Us: Details provided during account creation, order placement, customer support queries, or promotional interactions.',
      'Information We May Collect: Technical data such as your IP address, browser type, device details, location information, and interaction history via cookies and SDKs.',
      'Information from Third Parties: Updated delivery and address details from our logistics partners to ensure smooth fulfilment.',
      'Categories of Data Collected — Demographic & Identity: Name, email address, phone number, shipping address, country, date of birth, and profile picture.',
      'Categories of Data Collected — Financial Details: Transaction amounts, bank details (only in case of refund of an order if the customer asks for the same), card types, and payment identifiers.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    paragraph:
      'Your information helps us operate, improve, and personalize your experience. Key purposes include:',
    bullets: [
      'Processing orders, handling secure payments, and coordinating doorstep deliveries.',
      'Troubleshooting platform errors, analyzing site performance, and improving usability.',
      'Offering personalized product recommendations and tailored advertisements.',
      'Communicating with you regarding order updates, customer support, and promotional offers.',
    ],
  },
  {
    heading: '4. Cookies and Tracking Technologies',
    paragraph:
      'We use cookies, pixel tags, log files, and third-party SDKs (such as analytics and payment gateways like Cashfree) to make our Platform function smoothly.',
    bullets: [
      'Strictly Necessary Cookies: Required for basic site navigation, security, and account logins. Disabling these may impact platform functionality.',
      'Functional & Performance Cookies: Help remember your preferences (like region or font size) and analyse traffic to improve our services.',
      'Note on Do Not Track: Our systems do not currently respond to browser "Do Not Track" signals.',
    ],
  },
  {
    heading: '5. Data Sharing & Disclosure',
    paragraph:
      'We do not sell your personal data. However, we may share information with trusted third parties under strict contractual safeguards for:',
    bullets: [
      'Order Fulfilment & Logistics: Partnering with delivery couriers to ship your purchases.',
      'Secure Payment Processing: Facilitating secure financial transactions via verified payment gateways.',
      'Customer Support & Analytics: Resolving queries quickly and analysing user behaviour to enhance our collections.',
      'Legal Compliance: Disclosing information when required by law enforcement, government authorities, or courts to prevent fraud or protect legal rights.',
    ],
  },
  {
    heading: '6. Data Security & Retention',
    paragraph:
      'Security: We implement robust physical, technical, and managerial safeguards to protect your data from unauthorized access, alteration, or deletion. Retention: We retain your personal data only as long as necessary to fulfil the purposes outlined in this policy or to comply with legal/regulatory obligations. Once obsolete, data is securely deleted or permanently de-identified.',
  },
  {
    heading: '7. Your Customer Rights',
    paragraph:
      'Under applicable privacy regulations, you have rights over your personal data, including the right to access, correct errors, or request the deletion of your account and associated data. To exercise any of these rights, please contact our privacy team at info@drishtifashions.com.',
  },
  {
    heading: '8. Customer Grievance Redressal Policy',
    paragraph:
      'Customer satisfaction is at the heart of Drishti Fashions. If you have any concerns or complaints regarding your data privacy or orders, our dedicated support channels are here to help. How to reach customer support:',
    bullets: [
      'Email Support: info@drishtifashions.com',
      'Customer Care Hotline: Monday to Saturday, 8:00 AM to 10:00 PM; Sundays, 10:00 AM to 7:00 PM.',
      'Live Chat: Available directly on the Drishti Fashions App — Monday to Saturday, 10:00 AM to 10:00 PM; Sundays, 10:00 AM to 7:00 PM.',
    ],
  },
];

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="text-center space-y-3 pb-4">
        <div className="flex justify-center mb-2">
          <ShieldCheck className="w-10 h-10 text-[#755b00]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#0d1648]">Privacy Policy & Grievance Redressal Guide</h1>
        <p className="text-xs text-[#767680] font-sans max-w-2xl mx-auto leading-relaxed">
          Welcome to Drishti Fashions, a brand owned and operated by DRISTI DHAMHI VYAPAAR PRIVATE LIMITED. We value
          your trust and are committed to protecting your personal information. By accessing our Platform or sharing
          your information with us, you agree to be bound by this Privacy Policy and governed by the laws of India.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-[#c6c5d0]/30 space-y-8 text-xs font-sans leading-relaxed text-[#46464f]">
        {SECTIONS.map(s => (
          <section key={s.heading} className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-[#0d1648]">{s.heading}</h2>
            {s.paragraph && <p>{s.paragraph}</p>}
            {s.bullets && (
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {s.bullets.map(b => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Grievance Officer card */}
        <div className="bg-[#f4f2ff] rounded-xl border border-[#c6c5d0]/40 p-6 space-y-4 mt-4">
          <h3 className="font-serif text-lg font-bold text-[#0d1648]">Grievance Officer</h3>
          <p className="text-[#46464f]">
            If your concern is not resolved satisfactorily through regular support channels, you may reach out to our
            designated Grievance Officer in accordance with the Information Technology Act, 2000.
          </p>
          <div className="space-y-2 text-[#181a2d]">
            <p className="flex items-start gap-2">
              <User className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
              <span>
                <strong>Name:</strong> Mr. Prakash <span className="text-[#767680]">— Designation:</span> Operations Head
              </span>
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
              <span>
                <strong>Address:</strong> 212, Girish Ghosh Rd, Belur Bazar, Howrah-711202
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
              <span>
                <strong>Email:</strong>{' '}
                <a href="mailto:info@drishtifashions.com" className="text-[#755b00] hover:underline">
                  info@drishtifashions.com
                </a>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Phone className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
              <span>
                <strong>Phone:</strong> +91 6290486090 (Monday to Saturday, 10:00 AM to 7:00 PM)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-[#181a2d] rounded-xl p-5 text-[#f4f2ff]">
          <p className="font-semibold mb-1">Important Security Reminder</p>
          <p>
            Drishti Fashions never asks for confidential information like OTPs, CVVs, PINs, or bank account details over
            phone calls or messages. Please stay vigilant against phishing scams and report any fraudulent calls to our
            Grievance Officer immediately.
          </p>
        </div>
      </div>
    </div>
  );
};