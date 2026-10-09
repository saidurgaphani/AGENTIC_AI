'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  FileCode,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface UserAuditSectionProps {
  onRefreshOverview: () => void;
}

export function UserAuditSection({ onRefreshOverview }: UserAuditSectionProps) {
  const [subTab, setSubTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getAuditEvents({ eventType: eventTypeFilter || undefined }),
      ]);
      setUsers(uRes.users || []);
      setAuditEvents(aRes.events || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventTypeFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setNotification({
        type: 'success',
        message: `User permissions updated to ${newRole}. Recorded in audit trail.`,
      });
      loadData();
      onRefreshOverview();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

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

      {/* Header and SubTab Switcher */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="tag-mint mb-1">ACCESS CONTROL & GOVERNANCE</span>
          <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase mt-1">
            Role-Based Authorization & Immutable Audit Logs
          </h2>
          <p className="font-body text-xs text-[#444444] mt-1">
            Authoritative permissions enforced server-side. Every configuration change, dataset import, and planner decision is permanently audited.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
              subTab === 'users' ? 'bg-[#000000] text-white font-bold' : 'bg-[#f3f3f3] text-[#444444]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Authorized Users ({users.length})</span>
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
              subTab === 'audit' ? 'bg-[#000000] text-white font-bold' : 'bg-[#f3f3f3] text-[#444444]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditEvents.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Users Sub-Tab */}
      {subTab === 'users' && (
        <div className="space-y-6">
          <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
            <h3 className="font-display text-2xl text-[#000000] uppercase pb-2 border-b border-[#f3f3f3]">
              Active User Directory & Role Assignments
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User / Identity</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Access Capabilities</th>
                    <th className="p-3">Last Active Timestamp</th>
                    <th className="p-3 text-right">Role Modification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f3f3]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-[#000000] block">{u.name}</span>
                        <span className="text-[10px] text-[#979797]">{u.email}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-[#000000] text-white'
                              : u.role === 'PLANNER'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-[#444444]">
                        {u.role === 'ADMIN'
                          ? 'Full Control Plane, Datasets, Solver Constraints, Agent Governance'
                          : u.role === 'PLANNER'
                          ? 'Operational Simulation Execution, Multi-Agent Review & Plan Approval'
                          : 'Read-only Telemetry & Metric Auditing'}
                      </td>
                      <td className="p-3 text-[#979797] text-[10px]">
                        {new Date(u.last_active_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-[#f3f3f3] border border-[#c6c6c6] rounded p-1 text-[11px] font-mono"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="PLANNER">PLANNER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permissions Matrix Reference */}
          <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-3 font-mono text-xs">
            <h4 className="font-display text-xl text-[#000000] uppercase">
              Role Permission Matrix & Server-Side Enforcement (FR-18)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#f3f3f3] text-[#444444] uppercase">
                  <tr>
                    <th className="p-2">Operation / Route</th>
                    <th className="p-2">Admin Role</th>
                    <th className="p-2">Planner Role</th>
                    <th className="p-2">Viewer Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f3f3]">
                  <tr>
                    <td className="p-2">Dataset CSV Import & Versioning</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                  </tr>
                  <tr>
                    <td className="p-2">Solver Hard Constraint Modification</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                  </tr>
                  <tr>
                    <td className="p-2">7-Day Supplier Disruption Configuration</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                  </tr>
                  <tr>
                    <td className="p-2">Multi-Agent Simulation Run Trigger</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                  </tr>
                  <tr>
                    <td className="p-2">Recovery Plan Decision (Approve / Reject)</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-green-700 font-bold">ALLOWED</td>
                    <td className="p-2 text-red-600">RESTRICTED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Audit Trail Sub-Tab */}
      {subTab === 'audit' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Authoritative Audit Log Explorer
            </h3>

            <div className="flex items-center gap-2 font-mono text-xs">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-1.5 text-xs font-mono"
              >
                <option value="">All Event Types</option>
                <option value="DATASET_IMPORT">DATASET_IMPORT</option>
                <option value="DISRUPTION_CONFIG">DISRUPTION_CONFIG</option>
                <option value="AGENT_UPDATE">AGENT_UPDATE</option>
                <option value="CONSTRAINT_CONFIG">CONSTRAINT_CONFIG</option>
                <option value="SIMULATION_RUN">SIMULATION_RUN</option>
                <option value="PLAN_DECISION">PLAN_DECISION</option>
                <option value="ENTITY_CREATE">ENTITY_CREATE</option>
                <option value="ENTITY_UPDATE">ENTITY_UPDATE</option>
                <option value="ENTITY_DEACTIVATE">ENTITY_DEACTIVATE</option>
              </select>

              <button
                onClick={loadData}
                className="btn-ghost text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor / Process</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Details & Audit Payload</th>
                  <th className="p-3 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                    <td className="p-3 text-[#979797] text-[10px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#000000] block">{evt.actor}</span>
                      <span className="text-[10px] text-[#979797]">Role: {evt.role}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#f3f3f3] border border-[#c6c6c6]/50 text-[10px] font-bold">
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="p-3 text-[#000000]">
                      {evt.target_entity} / {evt.target_id}
                    </td>
                    <td className="p-3 text-[11px] text-[#444444] max-w-xs truncate">
                      {evt.details}
                    </td>
                    <td className="p-3 text-right">
                      {(evt.before_state || evt.after_state) && (
                        <button
                          onClick={() => setSelectedAuditRecord(evt)}
                          className="btn-ghost text-[10px] py-1 px-2"
                        >
                          View Diff
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Diff Modal */}
      {selectedAuditRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-xl w-full max-h-[80vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <div>
                <span className="font-mono text-[10px] text-[#979797] uppercase">
                  IMMUTABLE AUDIT RECORD DIFF
                </span>
                <h4 className="font-display text-xl text-[#000000] uppercase">
                  {selectedAuditRecord.event_type}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAuditRecord(null)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 font-mono text-xs pr-1">
              <p className="text-[#444444]">{selectedAuditRecord.details}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#f3f3f3] space-y-1">
                  <span className="font-bold text-xs text-[#000000] block">State Before:</span>
                  <pre className="text-[10px] text-[#444444] overflow-x-auto whitespace-pre-wrap">
                    {selectedAuditRecord.before_state
                      ? JSON.stringify(
                          typeof selectedAuditRecord.before_state === 'string'
                            ? JSON.parse(selectedAuditRecord.before_state)
                            : selectedAuditRecord.before_state,
                          null,
                          2
                        )
                      : '<INITIAL_STATE>'}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-[#d1ffca]/30 border border-[#d1ffca] space-y-1">
                  <span className="font-bold text-xs text-[#000000] block">State After:</span>
                  <pre className="text-[10px] text-[#000000] overflow-x-auto whitespace-pre-wrap">
                    {selectedAuditRecord.after_state
                      ? JSON.stringify(
                          typeof selectedAuditRecord.after_state === 'string'
                            ? JSON.parse(selectedAuditRecord.after_state)
                            : selectedAuditRecord.after_state,
                          null,
                          2
                        )
                      : '<NULL>'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f3f3f3]">
              <button
                onClick={() => setSelectedAuditRecord(null)}
                className="btn-dark text-xs py-1.5 px-4"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
