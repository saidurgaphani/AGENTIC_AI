'use client';

import { useState } from 'react';
import { X, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
  const [step, setStep] = useState(1);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      // Reset state for next time
      setStep(1);
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario on backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !name.trim()) {
      setError('Scenario name is required.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-2xl max-w-xl w-full p-0 flex flex-col border border-[#c6c6c6] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#c6c6c6]">
          <div>
            <h3 className="font-display text-xl uppercase text-[#000000]">
              Create Disruption Scenario
            </h3>
            <span className="font-mono text-[10px] text-[#979797]">
              STEP {step} OF 4: {['BASIC INFO', 'TARGET NODE', 'TIMELINE', 'FINANCIALS'][step - 1]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#f3f3f3] text-[#444444]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="flex h-1 w-full bg-[#f3f3f3]">
          <div 
            className="h-full bg-[#000000] transition-all duration-300 ease-in-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[300px]">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-[#fff100]/30 border border-[#c6c6c6] text-xs font-mono text-[#000000] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="font-mono text-xs h-full flex flex-col justify-between">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <label className="text-[#979797] uppercase text-[10px] block">
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10-Day Extended Bengaluru Blackout"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f3f3f3] p-3 rounded-xl border border-[#c6c6c6] text-[#000000] font-bold outline-none focus:border-[#000000]"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#979797] uppercase text-[10px] block">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Operational assumptions and purpose for this what-if rerun..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#f3f3f3] p-3 rounded-xl border border-[#c6c6c6] text-[#000000] outline-none focus:border-[#000000] resize-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <label className="text-[#979797] uppercase text-[10px] block mb-2">
                    Target Disrupted Supplier
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {suppliers.map((s) => (
                      <div 
                        key={s.id} 
                        onClick={() => setCriticalSupplierId(s.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                          criticalSupplierId === s.id 
                            ? 'bg-[#000000] border-[#000000] text-[#ffffff]' 
                            : 'bg-[#ffffff] border-[#c6c6c6] text-[#000000] hover:bg-[#f3f3f3]'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{s.name}</span>
                          <span className={`text-[10px] ${criticalSupplierId === s.id ? 'text-[#c6c6c6]' : 'text-[#979797]'}`}>
                            {s.code} • {s.location}
                          </span>
                        </div>
                        {criticalSupplierId === s.id && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#979797] uppercase text-[10px] block">
                      Disruption Start Day
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={disruptionStartDay}
                        onChange={(e) => setDisruptionStartDay(Number(e.target.value))}
                        className="w-full bg-[#f3f3f3] p-3 rounded-xl border border-[#c6c6c6] text-[#000000] text-lg outline-none focus:border-[#000000]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#979797] pointer-events-none">
                        Day
                      </span>
                    </div>
                    <p className="text-[10px] text-[#979797] mt-1">Relative to today (Day 1)</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#979797] uppercase text-[10px] block">
                      Duration
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={disruptionDurationDays}
                        onChange={(e) => setDisruptionDurationDays(Number(e.target.value))}
                        className="w-full bg-[#f3f3f3] p-3 rounded-xl border border-[#c6c6c6] text-[#000000] text-lg font-bold outline-none focus:border-[#000000]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#979797] pointer-events-none">
                        Days
                      </span>
                    </div>
                    <p className="text-[10px] text-[#979797] mt-1">Total length of outage</p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[#979797] uppercase text-[10px] block">
                      Safety Stock Coverage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={safetyStockDays}
                        onChange={(e) => setSafetyStockDays(Number(e.target.value))}
                        className="w-full bg-[#f3f3f3] p-3 rounded-xl border border-[#c6c6c6] text-[#000000] text-lg outline-none focus:border-[#000000]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#979797] pointer-events-none">
                        Days
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#979797] uppercase text-[10px] block">
                      Shortage Penalty
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444444] pointer-events-none">
                        $
                      </span>
                      <input
                        type="number"
                        min={50}
                        max={500}
                        value={shortagePenaltyPerUnit}
                        onChange={(e) => setShortagePenaltyPerUnit(Number(e.target.value))}
                        className="w-full bg-[#f3f3f3] p-3 pl-8 rounded-xl border border-[#c6c6c6] text-[#000000] text-lg outline-none focus:border-[#000000]"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#979797] pointer-events-none">
                        /Unit
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-[#f3f3f3] rounded-xl border border-[#c6c6c6]">
                  <h4 className="font-bold mb-1">Summary</h4>
                  <p className="text-[11px] text-[#444444] leading-relaxed">
                    You are simulating a <strong>{disruptionDurationDays}-day</strong> outage at <strong>{suppliers.find(s => s.id === criticalSupplierId)?.name}</strong> starting on Day {disruptionStartDay}. The simulation assumes {safetyStockDays} days of buffer inventory and a shortage penalty of ${shortagePenaltyPerUnit} per unit.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 bg-[#f9f9f9] border-t border-[#c6c6c6]">
          <button
            type="button"
            onClick={step === 1 ? onClose : prevStep}
            className="px-4 py-2.5 rounded-xl border border-[#c6c6c6] bg-[#ffffff] text-xs font-mono font-medium hover:bg-[#f3f3f3] transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Cancel' : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </>
            )}
          </button>
          
          {step < 4 ? (
            <button
              onClick={nextStep}
              className="btn-dark text-xs py-2.5 px-6 font-bold flex items-center gap-2"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="btn-dark text-xs py-2.5 px-6 font-bold flex items-center gap-2"
            >
              {isSubmitting ? 'Generating...' : 'Run Simulation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
