export interface DemoExample {
  id: string;
  titleEn: string;
  titleBn: string;
  inputType: "shop" | "social" | "message" | "url" | "phone";
  value: string;
  description: string;
  communityReportCount: number;
}

// Preloaded, clearly-labeled demo examples used for hackathon presentation.
// These run through the exact same analysis pipeline as real user input.
export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: "demo-1",
    titleEn: "Suspicious Facebook Shop",
    titleBn: "সন্দেহজনক ফেসবুক শপ",
    inputType: "shop",
    value: "Dhaka Fashion Hub BD",
    description:
      "Page created 2 weeks ago, offers 80% discount, asks customers to send bkash payment personal number before delivery, urgent limited time offer today only.",
    communityReportCount: 4,
  },
  {
    id: "demo-2",
    titleEn: "Fake Job Offer",
    titleBn: "ভুয়া চাকরির অফার",
    inputType: "message",
    value: "Work from home job offer",
    description:
      "Ghore bose kaj, no experience needed, high salary 40000 taka per month, part time job, but first send a 1500 taka registration fee to confirm your seat, act now limited seats.",
    communityReportCount: 2,
  },
  {
    id: "demo-3",
    titleEn: "Phishing URL",
    titleBn: "ফিশিং ইউআরএল",
    inputType: "url",
    value: "http://bkash-verify-account.xyz/login-secure",
    description: "bkash-verify-account.xyz/login-secure claims your account will be suspended, confirm your account immediately, click this link.",
    communityReportCount: 6,
  },
  {
    id: "demo-4",
    titleEn: "Investment Scam Message",
    titleBn: "বিনিয়োগ স্ক্যাম মেসেজ",
    inputType: "message",
    value: "Daily profit investment scheme",
    description:
      "Guaranteed profit, double your money in 7 days, no risk, daily income 500 taka just by sending 5000 taka investment via nagad personal number today, urgent limited slots.",
    communityReportCount: 5,
  },
  {
    id: "demo-5",
    titleEn: "Suspicious Phone Number",
    titleBn: "সন্দেহজনক ফোন নাম্বার",
    inputType: "phone",
    value: "01710000000",
    description:
      "Caller claims to be bank officer from bangladesh bank, says your account is blocked, urgently asks for OTP and pin code to verify account right now.",
    communityReportCount: 3,
  },
];
