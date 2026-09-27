import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import ScamChecker from "@/components/ScamChecker";
import HowItWorks from "@/components/HowItWorks";
import ScamCategories from "@/components/ScamCategories";
import ScamDNASection from "@/components/ScamDNASection";
import CommunityPreview from "@/components/CommunityPreview";
import HotspotMap from "@/components/HotspotMap";
import SafetyTips from "@/components/SafetyTips";
import CTASection from "@/components/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <section id="checker" className="border-b border-white/5 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScamChecker />
        </div>
      </section>
      <HowItWorks />
      <ScamCategories />
      <ScamDNASection />
      <HotspotMap />
      <CommunityPreview />
      <SafetyTips />
      <CTASection />
    </>
  );
}
