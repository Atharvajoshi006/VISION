import PageLoader from "@/components/page-loader";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero/hero-section";
import FeaturesSection from "@/components/features-section";
import CtaStrip from "@/components/cta-strip";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <PageLoader />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CtaStrip />
      <Footer />
    </>
  );
}
