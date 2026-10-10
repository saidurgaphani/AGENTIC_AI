'use client';

import { useState } from 'react';
import { Truck, Factory, Warehouse, Plane, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  SUPPLIERS,
  PLANTS,
  DISTRIBUTION_CENTERS,
  TRANSPORT_LANES,
  PRODUCTS,
} from '@/data/benchmark-dataset';

export function SupplyChainNetwork() {
  const [activeTab, setActiveTab] = useState<'ECHELONS' | 'LANES' | 'BOM'>('ECHELONS');

  return (
    <section id="network" className="w-full py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-t border-[#c6c6c6]">
      <div className="flex items-center gap-3 mb-4">
        <span className="tag-mint">NETWORK TOPOLOGY · 3 ECHELONS</span>
        <span className="font-mono text-xs text-[#979797]">DETERMINISTIC GRAPH REPRESENTATION</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#000000] leading-none uppercase">
            THE THREE-ECHELON
            <br />
            MANUFACTURING NETWORK
          </h2>
          <p className="font-body text-base sm:text-lg text-[#444444] max-w-2xl mt-4">
            Explicitly modeled dependencies from Tier-1 component suppliers across intermodal freight corridors to centralized robotic assembly and regional fulfillment nodes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[#ffffff] p-1.5 rounded-xl border border-[#c6c6c6]/50">
          {(['ECHELONS', 'LANES', 'BOM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[#000000] text-[#ffffff]'
                  : 'text-[#444444] hover:text-[#000000] hover:bg-[#f3f3f3]'
              }`}
            >
              {tab === 'ECHELONS' && 'Three Echelons'}
              {tab === 'LANES' && 'Transport Corridors'}
              {tab === 'BOM' && 'Bill of Materials'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Visualizer */}
      {activeTab === 'ECHELONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Echelon 1: Suppliers */}
          <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
                <span className="font-mono text-xs text-[#979797]">ECHELON 01</span>
                <span className="font-mono text-xs font-bold text-[#000000]">3 SUPPLIERS</span>
              </div>
              <h3 className="font-display text-3xl text-[#000000] uppercase mb-4">
                Tier-1 Component Suppliers
              </h3>

              <div className="space-y-3">
                {SUPPLIERS.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border text-xs font-mono ${
                      s.disrupted
                        ? 'border-[#000000] bg-[#f3f3f3]'
                        : 'border-[#c6c6c6]/40 bg-[#ffffff]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#000000]">{s.code} · {s.name}</span>
                      {s.disrupted ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#ffffff] text-[10px]">
                          SHUTDOWN 7D
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#d1ffca] text-[#000000] text-[10px] font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[#979797] text-[11px]">{s.location}</div>
                    <div className="mt-2 text-[#444444] pt-2 border-t border-[#f3f3f3] flex justify-between">
                      <span>CRITICALITY:</span>
                      <span className="font-semibold text-[#000000]">{s.criticality}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f3f3f3] text-xs font-mono text-[#979797]">
              SUP-02 qualified with 250 units/day spare capacity.
            </div>
          </div>

          {/* Echelon 2: Manufacturing */}
          <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
                <span className="font-mono text-xs text-[#979797]">ECHELON 02</span>
                <Factory className="w-4 h-4 text-[#000000]" />
              </div>
              <h3 className="font-display text-3xl text-[#000000] uppercase mb-4">
                Assembly & Fabrication
              </h3>

              {PLANTS.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#f3f3f3] border border-[#c6c6c6]/40 mb-4">
                  <div className="font-bold text-sm text-[#000000]">{p.name}</div>
                  <div className="font-mono text-xs text-[#979797] mt-0.5">{p.location}</div>

                  <div className="mt-4 pt-3 border-t border-[#c6c6c6]/30 space-y-2 font-mono text-xs text-[#444444]">
                    <div className="flex justify-between">
                      <span>PRODUCT PRODUCED:</span>
                      <span className="font-bold text-[#000000]">SKU-900 (Robotic Drive)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DAILY CAPACITY:</span>
                      <span className="font-bold text-[#000000]">{p.dailyCapacity} units / day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OPERATING COST:</span>
                      <span className="font-bold text-[#000000]">${p.dailyOperatingCost.toLocaleString()} / day</span>
                    </div>
                    <div className="flex justify-between">
                      <span>INITIAL RAW STOCK:</span>
                      <span className="font-bold text-[#000000]">600 units (3-day buffer)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#f3f3f3] text-xs font-mono text-[#979797]">
              Requires 1x CMP-101 + 1x CMP-102 per finished unit.
            </div>
          </div>

          {/* Echelon 3: Distribution */}
          <div className="card-standard border border-[#c6c6c6]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f3f3f3] mb-4">
                <span className="font-mono text-xs text-[#979797]">ECHELON 03</span>
                <Warehouse className="w-4 h-4 text-[#000000]" />
              </div>
              <h3 className="font-display text-3xl text-[#000000] uppercase mb-4">
                Regional Distribution Hubs
              </h3>

              <div className="space-y-3">
                {DISTRIBUTION_CENTERS.map((dc) => (
                  <div key={dc.id} className="p-3.5 rounded-2xl bg-[#ffffff] border border-[#c6c6c6]/40 text-xs font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#000000]">{dc.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        dc.serviceTier === 'TIER_1_CRITICAL'
                          ? 'bg-[#000000] text-[#ffffff]'
                          : 'bg-[#f3f3f3] text-[#444444]'
                      }`}>
                        {dc.serviceTier === 'TIER_1_CRITICAL' ? 'TIER 1 (HEALTHCARE)' : 'TIER 2 (COMMERCIAL)'}
                      </span>
                    </div>
                    <div className="text-[#979797] text-[11px]">{dc.name}</div>
                    <div className="mt-3 pt-2 border-t border-[#f3f3f3] flex justify-between text-[#444444]">
                      <span>TARGET SLA:</span>
                      <span className="font-bold text-[#000000]">{dc.targetSlaPercent}% ON-TIME</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#f3f3f3] text-xs font-mono text-[#979797]">
              Total downstream demand rate: 200 units/day (2,800 units over 14d).
            </div>
          </div>
        </div>
      )}

      {/* Lanes Tab */}
      {activeTab === 'LANES' && (
        <div className="card-standard border border-[#c6c6c6]/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#c6c6c6] text-[#979797] bg-[#f3f3f3]">
                  <th className="py-3 px-4">LANE ID</th>
                  <th className="py-3 px-4">ORIGIN</th>
                  <th className="py-3 px-4">DESTINATION</th>
                  <th className="py-3 px-4">MODE</th>
                  <th className="py-3 px-4">NORMAL TRANSIT</th>
                  <th className="py-3 px-4">EXPEDITED TRANSIT</th>
                  <th className="py-3 px-4">COST / UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {TRANSPORT_LANES.map((lane) => (
                  <tr key={lane.id} className="hover:bg-[#f3f3f3]/50">
                    <td className="py-3 px-4 font-bold text-[#000000]">{lane.id}</td>
                    <td className="py-3 px-4">{lane.originId.toUpperCase()}</td>
                    <td className="py-3 px-4">{lane.destinationId.toUpperCase()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#f3f3f3] text-[11px]">
                        {lane.mode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">{lane.transitDays} Days</td>
                    <td className="py-3 px-4 font-semibold text-[#000000]">
                      {lane.expeditedTransitDays ? `${lane.expeditedTransitDays} Days (Air)` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      ${lane.costPerUnit}
                      {lane.expeditedCostPerUnit && (
                        <span className="text-[#979797] ml-1">(${lane.expeditedCostPerUnit} exp.)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOM Tab */}
      {activeTab === 'BOM' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6">
          <h3 className="font-display text-2xl text-[#000000] uppercase mb-4">
            Component Architecture for SKU-900
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-[#f3f3f3] border border-[#c6c6c6]/40">
              <span className="tag-voltage mb-2">CRITICAL COMPONENT</span>
              <div className="font-bold text-sm text-[#000000] mt-1">CMP-101: Precision Harmonic Actuator Core</div>
              <p className="text-[#444444] mt-2">
                Manufactured to sub-micron tolerances. Dual-sourced between SUP-01 (Bengaluru) and SUP-02 (Pune). 1 unit required per finished drive.
              </p>
              <div className="mt-4 pt-3 border-t border-[#c6c6c6]/30 flex justify-between">
                <span>STANDARD UNIT COST:</span>
                <span className="font-bold text-[#000000]">$140.00</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#c6c6c6]/40">
              <span className="tag-mint mb-2">STRUCTURAL COMPONENT</span>
              <div className="font-bold text-sm text-[#000000] mt-1">CMP-102: Machined Titanium Frame Housing</div>
              <p className="text-[#444444] mt-2">
                Cast structural enclosure sourced from SUP-03 (Chennai). 2-day surface transit, highly stable inventory levels.
              </p>
              <div className="mt-4 pt-3 border-t border-[#c6c6c6]/30 flex justify-between">
                <span>STANDARD UNIT COST:</span>
                <span className="font-bold text-[#000000]">$85.00</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
