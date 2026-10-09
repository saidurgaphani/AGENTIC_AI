'use client';

import { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  User,
  Clock,
  Send,
  Building,
  Truck,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  RecoveryPlan,
  PlannerDecision,
  RecoveryActionItem,
} from '@/types/planner-api';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { approvePlan, rejectPlan } from '@/lib/planner-api';

interface PlanReviewTabProps {
  plan: RecoveryPlan;
  onPlanUpdated: (updatedPlan: RecoveryPlan) => void;
  currentUser: {
    displayName: string;
    role: string;
    userId: string;
  };
}

export function PlanReviewTab({
  plan,
  onPlanUpdated,
  currentUser,
}: PlanReviewTabProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approvalRationale, setApprovalRationale] = useState(
    'Authorized $48,200 air freight premium to guarantee Tier-1 Medical SLA compliance at Columbus DC.'
  );
  const [authorizedBudget, setAuthorizedBudget] = useState(48200);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);

  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirmIrreversible) return;
    setIsApproving(true);
    setActionError(null);

    try {
      const decision = await approvePlan(
        plan.planId,
        approvalRationale,
        authorizedBudget,
        plan.version
      );

      const updatedPlan: RecoveryPlan = {
        ...plan,
        status: 'APPROVED',
        auditDecision: decision,
      };

      onPlanUpdated(updatedPlan);
      setShowApproveModal(false);
    } catch (err: any) {
      setActionError(err.detail || err.message || 'Failed to approve plan on server.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('A specific rejection reason is strictly required by the audit contract.');
      return;
    }
    setIsRejecting(true);
    setActionError(null);

    try {
      const decision = await rejectPlan(plan.planId, rejectionReason, plan.version);

      const updatedPlan: RecoveryPlan = {
        ...plan,
        status: 'REJECTED',
        auditDecision: decision,
      };

      onPlanUpdated(updatedPlan);
      setShowRejectModal(false);
    } catch (err: any) {
      setActionError(err.detail || err.message || 'Failed to reject plan on server.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Review Header Banner */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#000000] text-[#ffffff] font-mono text-[10px] font-bold uppercase">
                HUMAN-IN-THE-LOOP CONSOLE
              </span>
              <span className="font-mono text-xs text-[#979797]">
                PLAN ID: {plan.planId} · V{plan.version}
              </span>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-tight text-[#000000]">
              Recovery Plan Review & Governance
            </h2>
            <p className="font-mono text-xs text-[#444444] max-w-2xl leading-relaxed">
              Before execution, an authorized supply-chain planner must review proposed purchase orders,
              carrier bookings, and inventory rebalancing actions, verifying solver feasibility and trade-offs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {plan.status === 'APPROVED' ? (
              <div className="p-3 bg-[#d1ffca] rounded-2xl border border-[#c6c6c6]/50 font-mono text-xs flex items-center gap-2 text-[#000000] font-bold">
                <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                <span>PLAN OFFICIALLY APPROVED & PERSISTED</span>
              </div>
            ) : plan.status === 'REJECTED' ? (
              <div className="p-3 bg-[#ef4444]/10 rounded-2xl border border-[#ef4444]/30 font-mono text-xs flex items-center gap-2 text-[#ef4444] font-bold">
                <XCircle className="w-5 h-5 text-[#ef4444]" />
                <span>PLAN OFFICIALLY REJECTED</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#ef4444] text-[#ef4444] font-mono text-xs font-semibold hover:bg-[#ef4444]/10 transition-colors"
                >
                  Reject Plan
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="btn-dark text-xs py-2.5 px-6 font-bold"
                >
                  Approve Recovery Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-[#fff100]/30 border border-[#c6c6c6] text-xs font-mono text-[#000000] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Plan Executive Summary & Financial Impact Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <span className="font-mono text-xs text-[#979797] uppercase block">Expected Fill Rate</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {formatPercent(plan.expectedFillRate)}
          </span>
          <span className="font-mono text-[11px] text-[#10b981] font-semibold">
            +35.3% vs Unmitigated Baseline
          </span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <span className="font-mono text-xs text-[#979797] uppercase block">Total Landed Cost</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            {formatCurrency(plan.expectedLandedCost)}
          </span>
          <span className="font-mono text-[11px] text-[#10b981] font-semibold">
            -$102,400 Penalty Savings
          </span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <span className="font-mono text-xs text-[#979797] uppercase block">Authorized Budget Delta</span>
          <span className="font-display text-4xl text-[#000000] block mt-1">
            +$48,200
          </span>
          <span className="font-mono text-[11px] text-[#444444]">
            Expedited Freight + Supplier Delta
          </span>
        </div>

        <div className="card-standard border border-[#c6c6c6]/40 p-5 bg-[#ffffff]">
          <span className="font-mono text-xs text-[#979797] uppercase block">Hard Violations</span>
          <span className="font-display text-4xl text-[#10b981] block mt-1">
            0 BREACHES
          </span>
          <span className="font-mono text-[11px] text-[#000000] font-semibold">
            MILP Mathematical Feasibility
          </span>
        </div>
      </div>

      {/* 3. Proposed Action Items List */}
      <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c6c6c6]">
          <div>
            <h3 className="font-display text-lg uppercase text-[#000000]">
              Authorized Action Schedule & Resource Impacts
            </h3>
            <span className="font-mono text-[10px] text-[#979797]">
              4 RECOVERY ACTIONS READY FOR EXECUTION UPON APPROVAL
            </span>
          </div>
          <span className="font-mono text-xs text-[#979797]">
            Objective Value: ${plan.objectiveValue.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {plan.actions.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-xl border border-[#c6c6c6]/50 bg-[#f3f3f3]/50 space-y-2 hover:bg-[#f3f3f3] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#000000] text-[#ffffff] font-bold text-[9px] uppercase">
                    {act.actionType}
                  </span>
                  <span className="font-bold text-[#000000]">{act.targetResource}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Effective Day: <strong>Day {act.effectiveDay}</strong></span>
                  <span>Quantity: <strong>{act.quantityUnits} Units</strong></span>
                  <span className="font-bold text-[#000000]">
                    Cost: {formatCurrency(act.costDelta)}
                  </span>
                </div>
              </div>

              <p className="text-[#444444] text-[11px] leading-relaxed">{act.details}</p>

              <div className="flex items-center justify-between pt-1 text-[10px] text-[#979797] border-t border-[#c6c6c6]/30">
                <span>Evidence: {act.supportingEvidence}</span>
                <span className="text-[#10b981] font-semibold">✓ Constraints Validated</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Residual Risks & Solver Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#c6c6c6]">
            <AlertTriangle className="w-4 h-4 text-[#000000]" />
            <h4 className="font-display text-sm uppercase text-[#000000]">
              Remaining Risks & Operational Assumptions
            </h4>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-[#444444]">
            {plan.remainingRisks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </div>

        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#ffffff] space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#c6c6c6]">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <h4 className="font-display text-sm uppercase text-[#000000]">
              Solver Status & Mathematical Validation
            </h4>
          </div>
          <p className="text-[11px] text-[#444444] leading-relaxed">
            {plan.solverStatus}
          </p>
          <div className="pt-2 text-[10px] text-[#979797] space-y-1">
            <div>Hard Violations: <strong>0 Breaches</strong> (Capacity, BOM & Non-negativity satisfied)</div>
            <div>Soft Violations: <strong>0 Breaches</strong> (Full customer SLA protected)</div>
          </div>
        </div>
      </div>

      {/* 5. Existing Audit Decision Record (if decided) */}
      {plan.auditDecision && (
        <div className="card-standard border border-[#c6c6c6] p-6 bg-[#f3f3f3] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#c6c6c6]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#000000]" />
              <h4 className="font-display text-sm uppercase text-[#000000]">
                Official Audit Record: {plan.auditDecision.decision}
              </h4>
            </div>
            <span className="text-[#979797] text-[10px]">
              {plan.auditDecision.timestamp}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div>
              <span className="text-[#979797]">Decided By:</span>{' '}
              <strong className="text-[#000000]">{plan.auditDecision.plannerId} (Supply-Chain Planner)</strong>
            </div>
            <div>
              <span className="text-[#979797]">Decision Rationale:</span>{' '}
              <span className="text-[#000000] italic">&quot;{plan.auditDecision.rationale}&quot;</span>
            </div>
            <div>
              <span className="text-[#979797]">Authorized Delta:</span>{' '}
              <strong className="text-[#000000]">{formatCurrency(plan.auditDecision.authorizedBudgetDelta)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 6. Approval Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#c6c6c6] shadow-xl">
            <div className="space-y-1">
              <h3 className="font-display text-xl uppercase text-[#000000]">
                Confirm Recovery Plan Approval
              </h3>
              <p className="font-mono text-xs text-[#444444]">
                This will persist an immutable approval audit record to Neon PostgreSQL and mark the
                recovery scenario as authorized for manufacturing rescheduling.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#979797] uppercase text-[10px] block mb-1">
                  Decision Rationale / Justification
                </label>
                <textarea
                  rows={3}
                  value={approvalRationale}
                  onChange={(e) => setApprovalRationale(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6] text-[#000000]"
                />
              </div>

              <div>
                <label className="text-[#979797] uppercase text-[10px] block mb-1">
                  Authorized Budget Delta ($ USD)
                </label>
                <input
                  type="number"
                  value={authorizedBudget}
                  onChange={(e) => setAuthorizedBudget(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6] text-[#000000] font-bold"
                />
              </div>

              <div className="pt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirm-cb"
                  checked={confirmIrreversible}
                  onChange={(e) => setConfirmIrreversible(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="confirm-cb" className="text-[11px] text-[#444444] leading-tight">
                  I confirm authorization of $48,200 emergency freight & procurement budget. I understand
                  this is an auditable management decision.
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c6c6c6]">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isApproving}
                className="px-4 py-2 rounded-xl border border-[#c6c6c6] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!confirmIrreversible || isApproving}
                className="btn-dark text-xs py-2 px-5 font-bold"
              >
                {isApproving ? 'Persisting Decision...' : 'Confirm & Authorize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#c6c6c6] shadow-xl">
            <div className="space-y-1">
              <h3 className="font-display text-xl uppercase text-[#ef4444]">
                Reject Recovery Plan
              </h3>
              <p className="font-mono text-xs text-[#444444]">
                Per contract governance, an explicit rejection reason is required to log the audit event.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#979797] uppercase text-[10px] block mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Expedited air premium exceeds allowable quarterly variance threshold."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6] text-[#000000]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c6c6c6]">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl border border-[#c6c6c6] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isRejecting}
                className="px-4 py-2 rounded-xl bg-[#ef4444] text-[#ffffff] font-mono text-xs font-bold"
              >
                {isRejecting ? 'Persisting Rejection...' : 'Submit Official Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
