'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Layers, TrendingDown, ShieldAlert, ArrowRight } from 'lucide-react';
import { CANONICAL_SCENARIO } from '@/data/benchmark-dataset';
import { runSimulation } from '@/data/simulation-engine';

export function DisruptionAnalysis() {
  const { reorderBaseline } = runSimulation();
  const [selectedDay, setSelectedDay] = useState<number>(7);

  const dayData = reorderBaseline.dayByDayMetrics.find((m) => m.day === selectedDay) || reorderBaseline.dayByDayMetrics[6];

  return (
    <section id="disruption" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-voltage">INCIDENT SEV-1 · CRITICAL OUTAGE</span>
        <span className="font-mono text-xs text-[#979797]">SCENARIO SCN-2026-SHUTDOWN-07D</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
            SEVEN-DAY SHUTDOWN
            <br />
            AT CRITICAL SUPPLIER
          </h2>
          <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
            A catastrophic tooling failure halts all outbound shipments of Precision Actuator Cores (CMP-101) from AeroCore Dynamics (Sendai, Japan) from Day 4 through Day 10. Without dynamic recovery, the supply chain enters severe line starvation.
          </p>
        </div>

        <div className="font-mono text-xs text-[#444444] bg-[#ffffff] p-4 rounded-2xl border border-[#c6c6c6]/50">
          <div>IMPACTED COMPONENT: <span className="font-bold text-[#000000]">CMP-101</span></div>
          <div>SUPPLIER ID: <span className="font-bold text-[#000000]">SUP-01 (Sendai)</span></div>
          <div>PLANT BUFFER: <span className="font-bold text-[#000000]">600 units (3 Days)</span></div>
        </div>
      </div>

      {/* Disruption Cascade Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Phase 1 */}
        <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-[#979797]">PHASE 01 · DAYS 1–3</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#000000]"></span>
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Normal Depletion
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              Austin Plant Alpha consumes 200 units/day from the 600-unit on-hand buffer. Pre-disruption pipeline orders arrive normally through Day 3. Plant operates at 100% capacity.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#444444] flex justify-between">
            <span>PLANT STOCK:</span>
            <span className="font-bold text-[#000000]">600 → 400 UNITS</span>
          </div>
        </div>

        {/* Phase 2: Stockout Cliff */}
        <div className="card-standard border-2 border-[#000000] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#000000] text-[#ffffff] px-3 py-1 font-mono text-[10px] uppercase font-semibold">
            STOCKOUT CLIFF
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-[#979797]">PHASE 02 · DAY 7</span>
              <AlertTriangle className="w-4 h-4 text-[#000000]" />
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Zero Raw Buffer Exhaustion
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              Inbound shipments from Sendai drop to 0. On Day 7 at 06:00, remaining raw actuator stock reaches exactly 0 units. The robotic drive assembly line shuts down.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#000000] flex justify-between font-bold">
            <span>PLANT RAW STOCK:</span>
            <span>0 UNITS (STARVATION)</span>
          </div>
        </div>

        {/* Phase 3: Downstream Cascade */}
        <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-[#979797]">PHASE 03 · DAYS 8–14</span>
              <TrendingDown className="w-4 h-4 text-[#979797]" />
            </div>
            <h3 className="font-display text-2xl text-[#000000] uppercase mb-2">
              Downstream SLA Collapse
            </h3>
            <p className="font-body text-sm text-[#444444] leading-relaxed">
              Finished stock drops to zero. Backorders accumulate across Columbus (Tier-1 Healthcare) and Reno hubs. 1,000 unfulfilled units carry $150,000 in customer breach penalties.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#f3f3f3] font-mono text-xs text-[#444444] flex justify-between">
            <span>SLA FILL RATE:</span>
            <span className="font-bold text-[#000000]">64.3% UNMITIGATED</span>
          </div>
        </div>
      </div>

      {/* Interactive Day-by-Day Timeline Inspector */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="font-mono text-xs text-[#979797] uppercase">Interactive Horizon Inspector</span>
            <h4 className="font-display text-3xl text-[#000000] uppercase">
              Day {selectedDay} Unmitigated Trajectory
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#444444]">Select Period:</span>
            <div className="flex flex-wrap gap-1">
              {[1, 3, 5, 7, 9, 11, 14].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                    selectedDay === d
                      ? 'bg-[#000000] text-[#ffffff] font-bold'
                      : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day State Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#f3f3f3]">
          <div className="p-4 rounded-2xl bg-[#f3f3f3]">
            <span className="font-mono text-[11px] text-[#979797] block">INBOUND FROM SUP-01</span>
            <span className="font-display text-3xl text-[#000000] block mt-1">
              {dayData.inboundUnits} <span className="text-sm font-normal text-[#979797]">units</span>
            </span>
            <span className="font-mono text-[10px] text-[#444444]">
              {selectedDay >= 4 && selectedDay <= 10 ? 'Shipments Suspended' : 'Normal Transit'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f3f3f3]">
            <span className="font-mono text-[11px] text-[#979797] block">AUSTIN RAW INVENTORY</span>
            <span className={`font-display text-3xl block mt-1 ${dayData.plantRawStock === 0 ? 'text-[#000000] font-black' : 'text-[#000000]'}`}>
              {dayData.plantRawStock} <span className="text-sm font-normal text-[#979797]">units</span>
            </span>
            <span className="font-mono text-[10px] text-[#444444]">
              {dayData.plantRawStock === 0 ? 'Line starved' : 'Buffer available'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f3f3f3]">
            <span className="font-mono text-[11px] text-[#979797] block">UNMET BACKORDERS</span>
            <span className="font-display text-3xl text-[#000000] block mt-1">
              {dayData.backlog} <span className="text-sm font-normal text-[#979797]">units</span>
            </span>
            <span className="font-mono text-[10px] text-[#444444]">
              Daily Demand: {dayData.demand} units
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f3f3f3]">
            <span className="font-mono text-[11px] text-[#979797] block">CUMULATIVE SHORTAGE PENALTY</span>
            <span className="font-display text-3xl text-[#000000] block mt-1">
              ${(dayData.backlog * 150).toLocaleString()}
            </span>
            <span className="font-mono text-[10px] text-[#444444]">
              $150/unit contractual penalty
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
