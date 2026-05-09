import RefractiveHero from '../components/landing/RefractiveHero';
import Concept from '../components/landing/Concept';
import HowItWorks from '../components/landing/HowItWorks';
import Security from '../components/landing/Security';
import DuressMode from '../components/landing/DuressMode';
import DemoPreview from '../components/landing/DemoPreview';
import CTA from '../components/landing/CTA';
import Navbar from '../components/landing/Navbar';
import ParallaxSection from '../components/landing/ParallaxSection';
import ErrorBoundary from '../components/landing/ErrorBoundary';

function Landing() {
  return (
    <ErrorBoundary>
      <main className="w-full min-h-screen bg-white text-black font-sans overflow-hidden">
        <Navbar />
        <RefractiveHero />
        <ParallaxSection />
        <Concept />
        <HowItWorks />
        <Security />
        <DuressMode />
        <DemoPreview />
        <CTA />
      </main>
    </ErrorBoundary>
  );
}

export default Landing;
