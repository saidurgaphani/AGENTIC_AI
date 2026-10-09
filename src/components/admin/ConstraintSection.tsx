'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldAlert,
  Info,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface ConstraintSectionProps {
  onRefreshOverview: () => void;
}

export function ConstraintSection({ onRefreshOverview }: ConstraintSectionProps) {
  const [constraints, setConstraints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit constraint modal
  const [editingConstraint, setEditingConstraint] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    value: 0,
    hard_constraint: true,
    description: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const loadConstraints = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getConstraints();
      setConstraints(res.constraints || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConstraints();
  }, []);

  const handleOpenEdit = (c: any) => {
    setEditingConstraint(c);
    setEditForm({
      value: parseFloat(c.value) || 0,
      hard_constraint: c.hard_constraint,
      description: c.description || '',
      reason: '',
    });
  };

  const handleSaveConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConstraint) return;
    try {
      setSaving(true);
      await adminApi.updateConstraint(editingConstraint.id, editForm);
      setEditingConstraint(null);
      setNotification({
        type: 'success',
        message: `Constraint parameter "${editingConstraint.name}" updated in Neon PostgreSQL.`,
      });
      loadConstraints();
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredConstraints =
    categoryFilter === 'ALL'
      ? constraints
      : constraints.filter((c) => c.category === categoryFilter);

  if (loading && constraints.length === 0) {
    return (
      <div className="card-standard border border-[#c6c6c6]/50 p-12 text-center font-mono text-xs">
        Loading solver constraints from database...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl font-mono text-xs flex items-center justify-between ${
            notification.type === 'success' ? 'bg-[#d1ffca] text-[#000000]' : 'bg-red-100 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#000000]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-800" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold underline text-[10px]">
            DISMISS
          </button>
        </div>
      )}

      {/* Header and Filter */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="tag-mint mb-1">OR-TOOLS SOLVER FORMULATION (PRD SECTION 9)</span>
          <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase mt-1">
            Mathematical Optimization & Constraint Rules
          </h2>
          <p className="font-body text-xs text-[#444444] mt-1">
            Hard physical conservation laws cannot be violated by any solver run.
            Soft preferences specify objective trade-off weights (expedited air freight vs service backorder penalty).
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto">
          {['ALL', 'INVENTORY', 'CAPACITY', 'SOURCING', 'SERVICE', 'TRANSPORT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#000000] text-white font-bold'
                  : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Constraints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConstraints.map((c) => {
          const isHard = c.hard_constraint;
          return (
            <div
              key={c.id}
              className="card-standard border border-[#c6c6c6]/40 p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#979797] uppercase">
                    CATEGORY: {c.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      isHard ? 'bg-[#000000] text-white' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {isHard ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    <span>{isHard ? 'HARD CONSTRAINT' : 'OBJECTIVE WEIGHT'}</span>
                  </span>
                </div>

                <h4 className="font-display text-lg text-[#000000] uppercase leading-tight">
                  {c.name}
                </h4>

                <div className="p-3 rounded-xl bg-[#f3f3f3] flex items-baseline justify-between font-mono">
                  <span className="text-[11px] text-[#979797]">Threshold Value:</span>
                  <div className="text-right">
                    <span className="font-display text-2xl text-[#000000]">
                      {Number(c.value).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#444444] ml-1">{c.unit}</span>
                  </div>
                </div>

                <p className="font-mono text-xs text-[#444444] text-[11px] leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#f3f3f3] flex justify-between items-center font-mono text-[11px]">
                <span className="text-[#979797] text-[10px]">
                  Updated {new Date(c.updated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="btn-ghost text-xs py-1 px-2.5"
                >
                  Edit Rule
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Constraint Modal */}
      {editingConstraint && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <div>
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  CONSTRAINT GOVERNANCE
                </span>
                <h4 className="font-display text-xl text-[#000000] uppercase">
                  {editingConstraint.name}
                </h4>
              </div>
              <button
                onClick={() => setEditingConstraint(null)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConstraint} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#444444] mb-1">
                  Threshold / Weight ({editingConstraint.unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editForm.value}
                  onChange={(e) =>
                    setEditForm({ ...editForm, value: parseFloat(e.target.value) })
                  }
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Enforcement Classification:</label>
                <select
                  value={editForm.hard_constraint ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hard_constraint: e.target.value === 'true' })
                  }
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2.5 text-xs font-mono"
                >
                  <option value="true">HARD CONSTRAINT (Strict Infeasibility on Breach)</option>
                  <option value="false">SOFT OBJECTIVE (Penalized Objective Preference)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-2 text-xs"
                />
              </div>

              {/* Justification required if modifying hard constraint */}
              {editingConstraint.hard_constraint && !editForm.hard_constraint && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px]">
                    Administrative Justification Required:
                  </span>
                  <p className="text-amber-800 text-[10px]">
                    Downgrading a hard physical constraint requires an audited operational explanation.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authorized emergency overtime shift expansion"
                    value={editForm.reason}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs text-black"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f3f3f3]">
                <button
                  type="button"
                  onClick={() => setEditingConstraint(null)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-dark text-xs py-1.5 px-4"
                >
                  {saving ? 'Saving...' : 'Persist Constraint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
