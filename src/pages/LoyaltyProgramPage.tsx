import React from 'react';
import { ArrowLeft, Award, Crown, Gift, Mail, Phone } from 'lucide-react';

interface LoyaltyProgramPageProps {
  onNavigate: (path: string) => void;
}

interface Section {
  heading: string;
  icon?: React.ReactNode;
  paragraph?: string;
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    heading: '1. Program Membership & Eligibility',
    icon: <Award className="w-5 h-5 text-[#755b00]" />,
    bullets: [
      'Eligibility: Membership to Drishti Rewards & Club is open to all registered users of Drishti Fashions who are legal residents of India and aged 18 years or older.',
      'Free Enrolment: Joining the program is completely free of charge upon creating a verified account on our Platform.',
      'Account Association: Membership is personal, non-transferable, and limited to one account per individual. Points and rewards cannot be pooled, transferred, or combined across multiple accounts.',
    ],
  },
  {
    heading: '2. Earning Drishti Fashions Points & Cashback',
    icon: <Gift className="w-5 h-5 text-[#755b00]" />,
    bullets: [
      'How to Earn: Members earn reward points or cashback on eligible purchases made on the Drishti Fashions website or mobile app. The earning rate (e.g., points per rupee spent) is determined by your current membership tier and promotional events.',
      'Exclusions: Points are typically calculated on the final net transaction value (excluding shipping fees, platform convenience fees, taxes, and returned/cancelled items). Gift card purchases may be excluded from earning points unless specified otherwise.',
      'Crediting Timeline: Points earned on purchases are usually credited to your account after the return window (7 days post-delivery) closes successfully.',
    ],
  },
  {
    heading: '3. VIP Tiers (Including Drishti Fashions Platinum)',
    icon: <Crown className="w-5 h-5 text-[#755b00]" />,
    paragraph:
      'Our program features multi-tier membership benefits designed to reward our most loyal shoppers.',
    bullets: [
      'Tier Progression: Your membership tier is determined by your cumulative spending or purchase frequency within a rolling 12-month period.',
      'Drishti Platinum Benefits: Members who attain the Drishti Fashions Platinum tier unlock premium perks, which may include:',
      'Free delivery on all eligible orders (exceeding ₹199).',
      'Early access to seasonal sales, flash drops, and new designer collections.',
      'Dedicated priority customer support.',
      'Tier Review: Tiers are valid for a specified duration (typically 1 year) and are subject to periodic evaluation based on account activity.',
    ],
  },
  {
    heading: '4. Redeeming & Using Points / Cashbacks',
    icon: <Gift className="w-5 h-5 text-[#755b00]" />,
    bullets: [
      'Redemption: Accumulated Drishti Points or cashbacks can be redeemed as a discount against future purchases on the Platform, subject to minimum cart value requirements or maximum redemption limits per order.',
      'Non-Encashable: Points, cashbacks, and rewards hold no cash value, cannot be exchanged for cash, and are non-refundable.',
      'Expiration: Unless stated otherwise during promotional campaigns, Drishti Fashions Points remain valid for 12 months from the date of credit, after which unused points will automatically expire.',
    ],
  },
  {
    heading: '5. Program Modifications, Suspension & Termination',
    icon: <Award className="w-5 h-5 text-[#755b00]" />,
    bullets: [
      'Right to Modify: Drishti Fashions reserves the right to modify, amend, suspend, or terminate the Drishti Rewards & Club program, its tiers, earning rates, or redemption rules at any time without prior individual notice.',
      'Abuse & Fraud: We reserve the right to disqualify any member, revoke points, or terminate membership immediately in cases of suspected fraud, policy abuse, creation of duplicate accounts, or violation of our general Terms & Conditions.',
    ],
  },
];

export const LoyaltyProgramPage: React.FC<LoyaltyProgramPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="text-center space-y-3 pb-4">
        <div className="flex justify-center mb-2">
          <Crown className="w-10 h-10 text-[#755b00]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#0d1648]">Drishti Rewards & Club</h1>
        <p className="text-xs text-[#767680] font-sans max-w-2xl mx-auto leading-relaxed">
          Loyalty Program Terms & Conditions. Welcome to Drishti Rewards & Club, the exclusive loyalty and rewards
          program offered by Drishti Fashions (operated by DRISTI DHAMHI VYAPAAR PRIVATE LIMITED). By joining, earning
          points, or unlocking VIP tiers (such as Drishti Fashions Platinum), you agree to be bound by the following
          Terms and Conditions.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-[#c6c5d0]/30 space-y-8 text-xs font-sans leading-relaxed text-[#46464f]">
        {SECTIONS.map(s => (
          <section key={s.heading} className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-[#0d1648] flex items-center gap-2">
              <span className="bg-[#f4f2ff] rounded-lg p-1.5">{s.icon}</span>
              {s.heading}
            </h2>
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

        <div className="bg-[#f4f2ff] rounded-xl border border-[#c6c5d0]/40 p-6 space-y-3 mt-4">
          <h3 className="font-serif text-lg font-bold text-[#0d1648]">Contact Us</h3>
          <p className="text-[#46464f]">
            If you have any questions or require assistance regarding your Drishti Rewards membership, points balance,
            or tier status, please reach out to our support team:
          </p>
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <Award className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
              <span>
                <strong>Name:</strong> Mr. Prakash <span className="text-[#767680]">— Designation:</span> Operations Head
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
      </div>
    </div>
  );
};