import RefractiveHero from './components/RefractiveHero';
import Concept from './components/Concept';
import HowItWorks from './components/HowItWorks';
import Security from './components/Security';
import DuressMode from './components/DuressMode';
import DemoPreview from './components/DemoPreview';
import CTA from './components/CTA';
import Navbar from './components/Navbar';
import ParallaxSection from './components/ParallaxSection';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
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

export default App;
