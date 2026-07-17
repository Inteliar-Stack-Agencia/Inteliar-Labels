import { HeroSection } from "@/components/landing/hero-section"
import { TrustBar } from "@/components/landing/trust-bar"
import { StatsSection } from "@/components/landing/stats-section"
import { PrintersSection } from "@/components/landing/printers-section"
import { PartnersSection } from "@/components/landing/partners-section"
import { IntegrationsSection } from "@/components/landing/integrations-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { MultipointSection } from "@/components/landing/multipoint-section"
import { AiTemplateSection } from "@/components/landing/ai-template-section"
import { BeforeAfterSection } from "@/components/landing/before-after-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { SavingsCalculatorSection } from "@/components/landing/savings-calculator-section"
import { ComplianceSection } from "@/components/landing/compliance-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { UseCasesSection } from "@/components/landing/use-cases-section"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { FaqSection } from "@/components/landing/faq-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { DownloadSection } from "@/components/landing/download-section"
import { FinalCtaSection } from "@/components/landing/final-cta-section"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <IntegrationsSection />
        <HowItWorksSection />
        <AiTemplateSection />
        <MultipointSection />
        <FeaturesSection />
        <BeforeAfterSection />
        <SavingsCalculatorSection />
        <UseCasesSection />
        <ComparisonSection />
        <ComplianceSection />
        <TestimonialsSection />
        <StatsSection />
        <PrintersSection />
        <PartnersSection />
        <PricingSection />
        <FaqSection />
        <DownloadSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}
