import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { HeroIntroduction } from '@/components/sections/1-HeroIntroduction';
import { DisruptionAnalysis } from '@/components/sections/2-DisruptionAnalysis';
import { SupplyChainNetwork } from '@/components/sections/3-SupplyChainNetwork';
import { AgentIntelligence } from '@/components/sections/4-AgentIntelligence';
import { ScenarioComparison } from '@/components/sections/5-ScenarioComparison';
import { DecisionWorkflow } from '@/components/sections/6-DecisionWorkflow';
import { WorkspaceEntry } from '@/components/sections/7-WorkspaceEntry';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000] flex flex-col justify-between selection:bg-[#d1ffca] selection:text-[#000000]">
      {/* 8rem Height Header Navigation with Centered Floating Pill */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navigation />
      </div>

      {/* Main Connected Narrative Flow */}
      <main className="flex-1 w-full flex flex-col">
        {/* Section 1: Introduction */}
        <HeroIntroduction />

        {/* Section 2: Disruption Dynamics */}
        <DisruptionAnalysis />

        {/* Section 3: Three-Echelon Supply Network */}
        <SupplyChainNetwork />

        {/* Section 4: Multi-Agent Intelligence */}
        <AgentIntelligence />

        {/* Section 5: Scenario Comparison & Calculations */}
        <ScenarioComparison />

        {/* Section 6: Decision Workflow & Traceability */}
        <DecisionWorkflow />

        {/* Section 7: Operational Workspace Entry */}
        <WorkspaceEntry />
      </main>

      {/* Compact Dark Band Footer */}
      <Footer />
    </div>
  );
}
