import Navbar from "./sections/Navbar";
import Hero from "./sections/Hero";
import ProductShowcase from "./sections/ProductShowcase";
import LogoMarquee from "./sections/LogoMarquee";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import Pricing from "./sections/Pricing";
import Testimonials from "./sections/Testimonials";
import CTASection from "./sections/CTASection";
import Footer from "./sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProductShowcase />
      <LogoMarquee />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}