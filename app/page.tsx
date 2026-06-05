import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ProductDemoSection } from "@/components/landing/product-demo-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { UseCasesSection } from "@/components/landing/use-cases-section"
import { ComparisonSection } from "@/components/landing/comparison-section"
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
        <HowItWorksSection />
        <ProductDemoSection />
        <FeaturesSection />
        <UseCasesSection />
        <ComparisonSection />
        <DownloadSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}
