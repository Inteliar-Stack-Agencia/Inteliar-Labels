import { HeroSection } from "@/components/landing/hero-section"
import { PrintersSection } from "@/components/landing/printers-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { FeaturesSection } from "@/components/landing/features-section"
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
        <PrintersSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TestimonialsSection />
        <UseCasesSection />
        <ComparisonSection />
        <FaqSection />
        <DownloadSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}
