'use client';

import { useState } from 'react';
import { Cpu, CheckCircle2, Shield, AlertCircle, FileText, ArrowRight, Zap } from 'lucide-react';
import { CANONICAL_AGENT_PROPOSALS } from '@/data/benchmark-dataset';
import { AgentProposal } from '@/types/supply-chain';

export function AgentIntelligence() {
  const [selectedProposal, setSelectedProposal] = useState<AgentProposal>(
    CANONICAL_AGENT_PROPOSALS[0]
  );

  return (
    <section id="agents" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-mint">ADK MULTI-AGENT ARCHITECTURE</span>
        <span className="font-mono text-xs text-[#979797]">ADVISORY REASONING + DETERMINISTIC VALIDATION</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
            SPECIALIZED AGENTS.
            <br />
            ZERO HALLUCINATED FACTS.
          </h2>
          <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
            AI agents act exclusively as specialized advisors. They query read-only deterministic tools, generate typed proposals with citation evidence, and submit candidates to a deterministic coordinator.
          </p>
        </div>

        <div className="bg-[#ffffff] p-4 rounded-2xl border border-[#c6c6c6]/50 font-mono text-xs text-[#444444]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#d1ffca]"></span>
            <span className="font-bold text-[#000000]">GOOGLE ADK RUNTIME</span>
          </div>
          <div>GEMINI 2.5 FLASH INFERENCE</div>
          <div>TYPED PYDANTIC PROPOSAL SCHEMAS</div>
        </div>
      </div>

      {/* 4 Agent Roles Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CANONICAL_AGENT_PROPOSALS.map((prop) => {
          const isSelected = selectedProposal.proposalId === prop.proposalId;
          return (
            <button
              key={prop.proposalId}
              onClick={() => setSelectedProposal(prop)}
              className={`text-left p-5 rounded-3xl transition-all border ${
                isSelected
                  ? 'bg-[#000000] text-[#ffffff] border-[#000000]'
                  : 'bg-[#ffffff] text-[#000000] border-[#c6c6c6]/40 hover:border-[#000000]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-[#2f2f2f] text-[#d1ffca]' : 'bg-[#f3f3f3] text-[#444444]'
                  }`}
                >
                  {prop.agentType} AGENT
                </span>
                <CheckCircle2
                  className={`w-4 h-4 ${isSelected ? 'text-[#d1ffca]' : 'text-[#979797]'}`}
                />
              </div>

              <h4 className="font-display text-xl uppercase mb-2 leading-tight">
                {prop.actionType.replace('_', ' ')}
              </h4>

              <p
                className={`font-body text-xs line-clamp-2 leading-relaxed ${
                  isSelected ? 'text-[#c6c6c6]' : 'text-[#444444]'
                }`}
              >
                {prop.actionSummary}
              </p>

              <div className="mt-4 pt-3 border-t border-current/20 flex justify-between items-center font-mono text-[10px]">
                <span>CONFIDENCE:</span>
                <span className="font-bold">{(prop.confidence.score * 100).toFixed(0)}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Proposal Deep Dive Card */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 lg:p-8 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#f3f3f3] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="tag-mint">{selectedProposal.proposalId}</span>
              <span className="font-mono text-xs text-[#979797]">
                VALIDATION: {selectedProposal.validationStatus}
              </span>
            </div>
            <h3 className="font-display text-3xl text-[#000000] uppercase">
              {selectedProposal.actionSummary}
            </h3>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-[#979797] block">EXPECTED COST DELTA</span>
            <span className="font-display text-2xl text-[#000000] block">
              {selectedProposal.expectedCostDelta >= 0 ? '+' : ''}$
              {Math.abs(selectedProposal.expectedCostDelta).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Evidence & Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 font-mono text-xs">
          <div>
            <span className="text-[#979797] uppercase block mb-2 font-semibold">
              Grounding Citations & Evidence
            </span>
            <div className="space-y-2">
              {selectedProposal.evidenceRefs.map((ref, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f3f3f3] text-[#000000] flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#979797] shrink-0 mt-0.5" />
                  <span>{ref}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[#979797] uppercase block mb-2 font-semibold">
              Operational Assumptions & Risk Constraints
            </span>
            <div className="space-y-2 mb-4">
              {selectedProposal.assumptions.map((assump, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f3f3f3] text-[#444444]">
                  <span className="font-bold text-[#000000]">ASSUMPTION:</span> {assump}
                </div>
              ))}
              {selectedProposal.risks.map((risk, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f3f3f3] text-[#444444]">
                  <span className="font-bold text-[#000000]">RISK BOUNDARY:</span> {risk}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#d1ffca]/30 border border-[#d1ffca] text-[#000000]">
              <span className="font-bold">CONFIDENCE METRIC:</span>{' '}
              {selectedProposal.confidence.definition}
            </div>
          </div>
        </div>
      </div>

      {/* Inverted Callout: The Deterministic Coordinator */}
      <div className="card-inverted p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <span className="tag-mint mb-3">DETERMINISTIC COORDINATOR</span>
          <h3 className="font-display text-4xl text-[#ffffff] uppercase leading-none mb-3">
            Why LLMs Never Solve Equations
          </h3>
          <p className="font-body text-sm sm:text-base text-[#c6c6c6] leading-relaxed">
            LLMs do not perform arithmetic or guarantee physical balance. The Deterministic Coordinator checks inventory conservation, supplier capacity caps, and lead time arrival horizons before passing candidate proposals to Google OR-Tools for mixed-integer linear programming.
          </p>
        </div>

        <div className="shrink-0 font-mono text-xs text-[#d1ffca] bg-[#2f2f2f] px-6 py-4 rounded-2xl border border-[#444444]">
          <div className="font-bold text-[#ffffff] mb-1">COORDINATOR PIPELINE:</div>
          <div>1. Pydantic Type Check → PASS</div>
          <div>2. Non-Negative Inventory → PASS</div>
          <div>3. Capacity Feasibility → PASS</div>
          <div>4. Solver Formulation → OPTIMAL</div>
        </div>
      </div>
    </section>
  );
}
