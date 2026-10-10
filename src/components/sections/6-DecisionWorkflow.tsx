'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  History,
  CheckCircle2,
  XCircle,
  Edit3,
  FileCheck2,
} from 'lucide-react';
import { CANONICAL_SCENARIO, DATASET_MANIFEST } from '@/data/benchmark-dataset';

export function DecisionWorkflow() {
  const [activeDecision, setActiveDecision] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>(
    'APPROVED'
  );

  return (
    <section id="workflow" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-mint">GOVERNANCE & TRACEABILITY</span>
        <span className="font-mono text-xs text-[#979797]">HUMAN-IN-THE-LOOP CONTROL</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
            AUDITABLE WORKFLOW.
            <br />
            PLANNER SOVEREIGNTY.
          </h2>
          <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
            AI recommendations cannot alter purchase orders or dispatch freight autonomously. Every proposed action requires mathematical constraint verification, certified evidence, and human planner sign-off.
          </p>
        </div>

        <div className="bg-[#ffffff] p-4 rounded-2xl border border-[#c6c6c6]/50 font-mono text-xs text-[#444444]">
          <div>AUDIT TRAIL: <span className="font-bold text-[#000000]">IMMUTABLE HASH</span></div>
          <div>SIGN-OFF ROLE: <span className="font-bold text-[#000000]">LEAD PLANNER</span></div>
          <div>COMPLIANCE: <span className="font-bold text-[#000000]">ISO 9001 / SOC 2</span></div>
        </div>
      </div>

      {/* 3 Step Governance Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Step 1 */}
        <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
              <span className="font-mono text-xs text-[#979797]">STEP 01</span>
              <ShieldCheck className="w-4 h-4 text-[#000000]" />
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Independent Constraint Validation
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              Before a plan is presented, deterministic validators run 6 independent checks: non-negative inventory balances, supplier capacity caps, lead time physics, lane capacity, and bill-of-materials integrity.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#000000] flex justify-between font-bold">
            <span>HARD VIOLATIONS:</span>
            <span className="text-[#000000]">0 (STRICT GATE)</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
              <span className="font-mono text-xs text-[#979797]">STEP 02</span>
              <UserCheck className="w-4 h-4 text-[#000000]" />
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Planner Review & Approval
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              The authenticated supply-chain planner reviews the proposal package, checks the $48,200 incremental freight spend against budget headroom, inspects alternative vendor lead times, and executes explicit approval.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#444444] flex justify-between">
            <span>STATUS:</span>
            <span className="font-bold text-[#000000]">AUTHENTICATED SIGN-OFF</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
              <span className="font-mono text-xs text-[#979797]">STEP 03</span>
              <History className="w-4 h-4 text-[#000000]" />
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Traceable Audit Log
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              Every proposal, evidence citation, optimizer run, planner decision, and modification rationale is persisted into Neon PostgreSQL. Versioned snapshots guarantee full evaluation reproducibility.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#444444] flex justify-between">
            <span>PERSISTENCE:</span>
            <span className="font-bold text-[#000000]">NEON POSTGRESQL</span>
          </div>
        </div>
      </div>

      {/* Interactive Planner Approval Interface Mockup */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#f3f3f3] gap-4">
          <div>
            <span className="font-mono text-xs text-[#979797] uppercase">Interactive Approval Shell</span>
            <h4 className="font-display text-3xl text-[#000000] uppercase mt-1">
              Plan Recommendation: REC-2026-07D-A
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#444444]">State:</span>
            <span
              className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                activeDecision === 'APPROVED'
                  ? 'bg-[#d1ffca] text-[#000000]'
                  : activeDecision === 'REJECTED'
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'bg-[#f3f3f3] text-[#444444]'
              }`}
            >
              {activeDecision}
            </span>
          </div>
        </div>

        {/* Action Summary & Decision Buttons */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center font-mono text-xs">
          <div className="lg:col-span-8 space-y-3">
            <div className="p-4 rounded-2xl bg-[#f3f3f3] text-[#444444]">
              <div className="font-bold text-[#000000] text-sm mb-1">
                SUMMARY: Dual-Sourcing Shift to SUP-02 + 2-Day Air Freight
              </div>
              <p>
                Authorized spend: +₹40,48,800. Projected fill rate: 99.6%. Averts ₹1,26,00,000 in customer backlog penalties at Mumbai Tier-1 accounts. Zero line starvation at Hyderabad plant.
              </p>
            </div>
            <div className="text-[11px] text-[#979797]">
              DECISION HASH: 0x8f3c7e4... · TIMESTAMP: 2026-10-09T08:24:19Z · PLANNER: user_planner_ops
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-2.5">
            <button
              onClick={() => setActiveDecision('APPROVED')}
              className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                activeDecision === 'APPROVED'
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#d1ffca]" />
              <span>Approve Recovery Plan</span>
            </button>

            <button
              onClick={() => setActiveDecision('REJECTED')}
              className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                activeDecision === 'REJECTED'
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
              }`}
            >
              <XCircle className="w-4 h-4 text-[#979797]" />
              <span>Reject Plan (Require Re-run)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
