'use client';

import { useState } from 'react';
import { X, PlusCircle, AlertTriangle } from 'lucide-react';
import { DisruptionScenario, Supplier } from '@/types/planner-api';

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (scenario: Partial<DisruptionScenario>) => Promise<void>;
  suppliers: Supplier[];
}

export function NewScenarioModal({
  isOpen,
  onClose,
  onCreate,
  suppliers,
}: NewScenarioModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criticalSupplierId, setCriticalSupplierId] = useState('sup-01');
  const [disruptionStartDay, setDisruptionStartDay] = useState(4);
  const [disruptionDurationDays, setDisruptionDurationDays] = useState(7);
  const [safetyStockDays, setSafetyStockDays] = useState(3);
  const [dailyDemandUnits, setDailyDemandUnits] = useState(200);
  const [shortagePenaltyPerUnit, setShortagePenaltyPerUnit] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Scenario name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name,
        description,
        criticalSupplierId,
        disruptionStartDay,
        disruptionDurationDays,
        safetyStockDays,
        dailyDemandUnits,
        shortagePenaltyPerUnit,
        evaluationHorizonDays: 14,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario on backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-2xl max-w-xl w-full p-6 space-y-5 border border-[#c6c6c6] shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
          <div>
            <h3 className="font-display text-xl uppercase text-[#000000]">
              Create What-If Disruption Scenario
            </h3>
            <span className="font-mono text-[10px] text-[#979797]">
              CONFIGURES NEW EXPERIMENTAL PARAMETER SET PERSISTED IN DATABASE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#f3f3f3] text-[#444444]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#fff100]/30 border border-[#c6c6c6] text-xs font-mono text-[#000000] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-[#979797] uppercase text-[10px] block">
              Scenario Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10-Day Extended Sendai Blackout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000] font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#979797] uppercase text-[10px] block">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              placeholder="Operational assumptions and purpose for this what-if rerun..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#979797] uppercase text-[10px] block">
                Target Disrupted Supplier
              </label>
              <select
                value={criticalSupplierId}
                onChange={(e) => setCriticalSupplierId(e.target.value)}
                className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000]"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#979797] uppercase text-[10px] block">
                Disruption Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={disruptionDurationDays}
                onChange={(e) => setDisruptionDurationDays(Number(e.target.value))}
                className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[#979797] uppercase text-[10px] block">
                Disruption Start Day
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={disruptionStartDay}
                onChange={(e) => setDisruptionStartDay(Number(e.target.value))}
                className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#979797] uppercase text-[10px] block">
                Safety Stock (Days)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={safetyStockDays}
                onChange={(e) => setSafetyStockDays(Number(e.target.value))}
                className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#979797] uppercase text-[10px] block">
                Shortage Penalty ($/u)
              </label>
              <input
                type="number"
                min={50}
                max={500}
                value={shortagePenaltyPerUnit}
                onChange={(e) => setShortagePenaltyPerUnit(Number(e.target.value))}
                className="w-full bg-[#f3f3f3] p-2.5 rounded-xl border border-[#c6c6c6] text-[#000000]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c6c6c6]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#c6c6c6] text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-dark text-xs py-2 px-5 font-bold"
            >
              {isSubmitting ? 'Creating Scenario...' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
