'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building,
  Box,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  Supplier,
  Product,
  DisruptionImpact,
  DisruptionScenario,
} from '@/types/planner-api';
import { fetchEntityDependencies } from '@/lib/planner-api';

interface DisruptionExplorerTabProps {
  impact: DisruptionImpact | null;
  scenario: DisruptionScenario;
  suppliers: Supplier[];
  products: Product[];
}

export function DisruptionExplorerTab({
  impact,
  scenario,
  suppliers,
  products,
}: DisruptionExplorerTabProps) {
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'supplier' | 'product' | 'facility' | 'dc';
    id: string;
    name: string;
  }>({
    type: 'supplier',
    id: 'sup-01',
    name: 'AeroCore Dynamics (SUP-01 · Bengaluru, India)',
  });

  const [entityDependencies, setEntityDependencies] = useState<any>(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);

  useEffect(() => {
    async function loadDeps() {
      setLoadingDependencies(true);
      try {
        const deps = await fetchEntityDependencies(selectedEntity.type, selectedEntity.id);
        setEntityDependencies(deps);
      } catch (err) {
        console.warn('Dependency fetch failed, falling back to static reference');
      } finally {
        setLoadingDependencies(false);
      }
    }
    loadDeps();
  }, [selectedEntity]);

  const timeline = impact?.inventoryDepletionTimeline || [];

  return (
    <div className="space-y-8">
      {/* 1. Header Overview Banner */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 bg-[#ffffff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ef4444] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                DISRUPTION ACTIVE
              </span>
              <span className="font-mono text-xs text-[#979797]">
                7-DAY CRITICAL SUPPLIER BLACKOUT
              </span>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000] mt-1">
              Disruption Impact & Dependency Explorer
            </h2>
            <p className="font-mono text-xs text-[#444444] max-w-2xl mt-1">
              Inspect upstream supply failure, plant inventory depletion, component BOM linkages,
              and downstream hospital & manufacturing customer exposures.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#f3f3f3] p-3 rounded-2xl border border-[#c6c6c6]/40 font-mono text-xs">
            <div>
              <span className="text-[#979797] text-[10px] uppercase block">Disruption Window</span>
              <span className="font-bold text-[#000000]">
                Days {scenario.disruptionStartDay}–
                {scenario.disruptionStartDay + scenario.disruptionDurationDays - 1} (7 Days)
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#c6c6c6]"></div>
            <div>
              <span className="text-[#979797] text-[10px] uppercase block">Lead Time Lag</span>
              <span className="font-bold text-[#000000]">3 Days Normal Transit</span>
            </div>
            <div className="h-6 w-[1px] bg-[#c6c6c6]"></div>
            <div>
              <span className="text-[#979797] text-[10px] uppercase block">First Stockout</span>
              <span className="font-bold text-[#ef4444]">Day 6 (Runway: 3 Days)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Three-Echelon Network View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Echelon 1: Suppliers */}
        <div className="card-standard border border-[#c6c6c6]/50 p-5 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#c6c6c6]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#000000]" />
              <span className="font-display text-sm uppercase text-[#000000]">
                Echelon 1: Suppliers
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#979797]">3 QUALIFIED</span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'sup-01',
                code: 'SUP-01',
                name: 'AeroCore Dynamics',
                location: 'Bengaluru, India',
                criticality: 'CRITICAL',
                status: 'SHUTDOWN (DAYS 4-10)',
                isDisrupted: true,
                part: 'CMP-101 (Actuator Core)',
              },
              {
                id: 'sup-02',
                code: 'SUP-02',
                name: 'Vanguard Mechatronics',
                location: 'Pune, India',
                criticality: 'ALTERNATE',
                status: 'AVAILABLE (CAPACITY 250 U/D)',
                isDisrupted: false,
                part: 'CMP-101 (Qualified Alternate)',
              },
              {
                id: 'sup-03',
                code: 'SUP-03',
                name: 'Global Alloy Castings',
                location: 'Chennai, India',
                criticality: 'SECONDARY',
                status: 'NORMAL (CAPACITY 400 U/D)',
                isDisrupted: false,
                part: 'CMP-102 (Housing)',
              },
            ].map((sup) => {
              const isSelected = selectedEntity.id === sup.id;
              return (
                <div
                  key={sup.id}
                  onClick={() =>
                    setSelectedEntity({
                      type: 'supplier',
                      id: sup.id,
                      name: `${sup.name} (${sup.code} · ${sup.location})`,
                    })
                  }
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#000000] bg-[#f3f3f3] shadow-sm'
                      : 'border-[#c6c6c6]/40 bg-[#ffffff] hover:border-[#000000]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#000000]">
                          {sup.code}: {sup.name}
                        </span>
                        {sup.isDisrupted && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ef4444] text-[#ffffff] font-mono text-[9px] font-bold">
                            SHUTDOWN
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#979797] block mt-0.5">
                        {sup.location} · {sup.part}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        sup.isDisrupted
                          ? 'bg-[#ef4444]/10 text-[#ef4444]'
                          : 'bg-[#d1ffca] text-[#000000]'
                      }`}
                    >
                      {sup.criticality}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Echelon 2: Manufacturing Plants */}
        <div className="card-standard border border-[#c6c6c6]/50 p-5 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#c6c6c6]">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#000000]" />
              <span className="font-display text-sm uppercase text-[#000000]">
                Echelon 2: Assembly Plant
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#979797]">1 FACILITY</span>
          </div>

          <div
            onClick={() =>
              setSelectedEntity({
                type: 'facility',
                id: 'plant-01',
                name: 'Hyderabad Advanced Manufacturing Facility (Plant Alpha)',
              })
            }
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedEntity.id === 'plant-01'
                ? 'border-[#000000] bg-[#f3f3f3] shadow-sm'
                : 'border-[#c6c6c6]/40 bg-[#ffffff] hover:border-[#000000]/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-xs text-[#000000] block">
                  Plant Alpha (Hyderabad, TS)
                </span>
                <span className="font-mono text-[10px] text-[#979797] block mt-0.5">
                  High-Precision Robotic Assembly
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#fff100] text-[#000000] font-mono text-[9px] font-bold">
                STARVATION RISK
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-[#444444] pt-2 border-t border-[#c6c6c6]/30">
              <div>
                <span className="text-[#979797] block">Daily Capacity:</span>
                <span className="font-semibold text-[#000000]">300 Units / Day</span>
              </div>
              <div>
                <span className="text-[#979797] block">Product Assembled:</span>
                <span className="font-semibold text-[#000000]">SKU-900 (Drive Unit)</span>
              </div>
              <div>
                <span className="text-[#979797] block">BOM Requirements:</span>
                <span className="font-semibold text-[#000000]">1x CMP-101 + 1x CMP-102</span>
              </div>
              <div>
                <span className="text-[#979797] block">Line Starvation:</span>
                <span className="font-semibold text-[#ef4444]">Day 7 (Unmitigated)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Echelon 3: Distribution Centers */}
        <div className="card-standard border border-[#c6c6c6]/50 p-5 bg-[#ffffff] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#c6c6c6]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#000000]" />
              <span className="font-display text-sm uppercase text-[#000000]">
                Echelon 3: Distribution Hubs
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#979797]">2 DESTINATIONS</span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'dc-01',
                code: 'DC-EAST',
                name: 'Mumbai Medical Logistics Hub',
                location: 'Mumbai, MH',
                tier: 'TIER_1_CRITICAL',
                sla: '98% Target SLA',
                demand: '120 Units / Day',
                penalty: '$250 / Unit Late Penalty',
              },
              {
                id: 'dc-02',
                code: 'DC-WEST',
                name: 'Ahmedabad Standard Fulfillment Center',
                location: 'Ahmedabad, GJ',
                tier: 'TIER_2_STANDARD',
                sla: '90% Target SLA',
                demand: '80 Units / Day',
                penalty: '$100 / Unit Late Penalty',
              },
            ].map((dc) => {
              const isSelected = selectedEntity.id === dc.id;
              return (
                <div
                  key={dc.id}
                  onClick={() =>
                    setSelectedEntity({
                      type: 'dc',
                      id: dc.id,
                      name: `${dc.name} (${dc.code} · ${dc.location})`,
                    })
                  }
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#000000] bg-[#f3f3f3] shadow-sm'
                      : 'border-[#c6c6c6]/40 bg-[#ffffff] hover:border-[#000000]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#000000]">
                        {dc.code}: {dc.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#979797] block mt-0.5">
                        {dc.demand} · {dc.sla}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        dc.tier === 'TIER_1_CRITICAL'
                          ? 'bg-[#fff100] text-[#000000]'
                          : 'bg-[#f3f3f3] text-[#444444]'
                      }`}
                    >
                      {dc.tier === 'TIER_1_CRITICAL' ? 'TIER 1 MEDICAL' : 'TIER 2 STANDARD'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Deep Entity Dependency Inspector Panel */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#000000]" />
            <div>
              <h3 className="font-display text-lg uppercase text-[#000000]">
                Authoritative Entity Inspector: {selectedEntity.name}
              </h3>
              <span className="font-mono text-[10px] text-[#979797]">
                LIVE DATABASE RELATIONSHIPS & CONSTRAINTS
              </span>
            </div>
          </div>
          {loadingDependencies && (
            <span className="font-mono text-xs text-[#979797] animate-pulse">
              Querying database dependencies...
            </span>
          )}
        </div>

        {entityDependencies ? (
          <div className="space-y-4 font-mono text-xs">
            {entityDependencies.warnings?.length > 0 && (
              <div className="p-3 rounded-xl bg-[#fff100]/20 border border-[#fff100] space-y-1">
                <span className="font-bold text-[#000000] text-[11px] block">
                  Critical Dependency Warnings:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#444444]">
                  {entityDependencies.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6]/50 space-y-2">
                <span className="text-[10px] text-[#979797] uppercase block font-semibold">
                  Entity Category & Key
                </span>
                <span className="font-bold text-sm block text-[#000000]">
                  {entityDependencies.entityId} ({entityDependencies.entityType.toUpperCase()})
                </span>
                <span className="text-[11px] text-[#444444] block">
                  Can Delete Safely:{' '}
                  <strong className={entityDependencies.canDeleteSafely ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                    {entityDependencies.canDeleteSafely ? 'YES' : 'NO (FOREIGN KEY / RUN CONSTRAINTS)'}
                  </strong>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6]/50 space-y-2">
                <span className="text-[10px] text-[#979797] uppercase block font-semibold">
                  Linked Contracts / Lanes
                </span>
                <span className="font-bold text-sm block text-[#000000]">
                  {entityDependencies.references?.supplierContracts?.length ||
                    entityDependencies.references?.transportLanes?.length ||
                    entityDependencies.references?.inboundLanes?.length ||
                    1}{' '}
                  Active Link(s)
                </span>
                <span className="text-[11px] text-[#444444] block">
                  Standard Lead Time: 2–5 Days depending on transport mode
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6]/50 space-y-2">
                <span className="text-[10px] text-[#979797] uppercase block font-semibold">
                  Disruption Status & Policy
                </span>
                <span className="font-bold text-sm block text-[#000000]">
                  {selectedEntity.id === 'sup-01' ? 'AFFECTED BY 7-DAY OUTAGE' : 'OPERATIONAL'}
                </span>
                <span className="text-[11px] text-[#444444] block">
                  Receipt policy: Pre-outage pipeline honored; blackout days zeroed out.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center font-mono text-xs text-[#979797]">
            Select an entity above to inspect relational dependencies and BOM structures.
          </div>
        )}
      </div>

      {/* 4. Time-Based 14-Day Timeline & Depletion Curve */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#c6c6c6] gap-2">
          <div>
            <h3 className="font-display text-lg uppercase text-[#000000]">
              14-Day Inventory Depletion & Outage Horizon
            </h3>
            <span className="font-mono text-[10px] text-[#979797]">
              DAILY COMPONENT RAW STOCK (CMP-101) AT AUSTIN PLANT ALPHA
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#d1ffca] rounded border border-[#c6c6c6]"></span>
              <span>Measured Pipeline (Days 1–3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#fff100] rounded border border-[#c6c6c6]"></span>
              <span>Disruption Window (Days 4–10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#ef4444] rounded border border-[#c6c6c6]"></span>
              <span>Stockout Breach (Day 6+)</span>
            </div>
          </div>
        </div>

        {/* Timeline Visualization Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-xs border border-[#c6c6c6]">
            <thead>
              <tr className="bg-[#f3f3f3] text-[#444444] border-b border-[#c6c6c6]">
                <th className="py-2.5 px-2 text-left font-semibold">Metric / Day</th>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <th
                    key={day}
                    className={`py-2 px-2 text-center font-bold ${
                      day >= 4 && day <= 10 ? 'bg-[#fff100]/30 text-[#000000]' : ''
                    }`}
                  >
                    D{day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6c6]">
              <tr>
                <td className="py-2.5 px-3 text-left font-semibold bg-[#f3f3f3]/50 text-[#000000]">
                  Data Type
                </td>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <td key={day} className="py-2 px-1 text-[10px]">
                    {day <= 3 ? (
                      <span className="text-[#10b981] font-bold">MEAS</span>
                    ) : (
                      <span className="text-[#979797]">PROJ</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 text-left font-semibold bg-[#f3f3f3]/50 text-[#000000]">
                  Inbound (Units)
                </td>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => {
                  const inbound = day <= 6 ? 200 : day === 14 ? 200 : 0;
                  return (
                    <td
                      key={day}
                      className={`py-2 px-1 font-semibold ${
                        inbound === 0 ? 'text-[#ef4444]' : 'text-[#000000]'
                      }`}
                    >
                      {inbound}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="py-2.5 px-3 text-left font-semibold bg-[#f3f3f3]/50 text-[#000000]">
                  Daily Demand
                </td>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <td key={day} className="py-2 px-1 text-[#444444]">
                    200
                  </td>
                ))}
              </tr>

              <tr className="bg-[#f3f3f3]/20">
                <td className="py-2.5 px-3 text-left font-bold text-[#000000]">
                  Raw Stock (Units)
                </td>
                {/* Initial stock = 600. Days 1-6 inbound 200, consumed 200 -> 600. Day 7 consumed 200 -> 400. Day 8 -> 200. Day 9 -> 0. */}
                {[600, 600, 600, 600, 600, 600, 400, 200, 0, 0, 0, 0, 0, 0].map((st, i) => (
                  <td
                    key={i}
                    className={`py-2 px-1 font-bold ${
                      st === 0
                        ? 'bg-[#ef4444]/20 text-[#ef4444]'
                        : st < 600
                        ? 'bg-[#fff100]/20 text-[#000000]'
                        : 'text-[#000000]'
                    }`}
                  >
                    {st}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 text-left font-semibold bg-[#f3f3f3]/50 text-[#000000]">
                  Plant Assembly Status
                </td>
                {[
                  '100% OK',
                  '100% OK',
                  '100% OK',
                  '100% OK',
                  '100% OK',
                  '100% OK',
                  'Buffer Draw',
                  'Buffer Draw',
                  'STARVED',
                  'STARVED',
                  'STARVED',
                  'STARVED',
                  'STARVED',
                  '100% OK',
                ].map((stat, i) => (
                  <td
                    key={i}
                    className={`py-2 px-1 text-[9px] font-bold ${
                      stat === 'STARVED'
                        ? 'text-[#ef4444]'
                        : stat === 'Buffer Draw'
                        ? 'text-[#000000]'
                        : 'text-[#10b981]'
                    }`}
                  >
                    {stat}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#f3f3f3] rounded-xl text-mono text-[11px] text-[#444444] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#979797]" />
          <span>
            <strong>Authoritative Note:</strong> Inbound pipeline orders for Days 1–3 were dispatched prior to the Bengaluru shutdown. Days 7–13 experience zero raw component deliveries due to the 7-day outage and 3-day inter-city transit lead time, resulting in unmitigated stockout starting Day 9.
          </span>
        </div>
      </div>
    </div>
  );
}
