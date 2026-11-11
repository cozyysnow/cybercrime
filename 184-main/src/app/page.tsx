import HeaderNav from '@/components/navigation/HeaderNav';
import HeroSection from '@/components/sections/HeroSection';
import ProblemSection from '@/components/sections/ProblemSection';
import SolutionSection from '@/components/sections/SolutionSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import ImpactSection from '@/components/sections/ImpactSection';
import EcosystemSection from '@/components/sections/EcosystemSection';
import TechStackSection from '@/components/sections/TechStackSection';
import DataSourcesSection from '@/components/sections/DataSourcesSection';
import ChallengesSection from '@/components/sections/ChallengesSection';
import FeedbackLoopSection from '@/components/sections/FeedbackLoopSection';
import FooterSection from '@/components/sections/FooterSection';
import LandingAuthInterceptor from '@/components/landing/LandingAuthInterceptor';
import AlertsArchitectureSection from '@/components/sections/AlertsArchitectureSection';

export default function Home() {
  return (
    <LandingAuthInterceptor>
      <main className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans">
        <HeaderNav />
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ImpactSection />
        <EcosystemSection />
        <TechStackSection />
        <AlertsArchitectureSection />
        <DataSourcesSection />
        <ChallengesSection />
        <FeedbackLoopSection />
        <FooterSection />
      </main>
    </LandingAuthInterceptor>
  );
}
