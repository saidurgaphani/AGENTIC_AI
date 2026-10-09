'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { adminApi, CsvValidationResponse } from '@/lib/admin-api';

interface DatasetSectionProps {
  onRefreshOverview: () => void;
}

export function DatasetSection({ onRefreshOverview }: DatasetSectionProps) {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Import workflow state
  const [importEntity, setImportEntity] = useState<'products' | 'suppliers'>('products');
  const [csvContent, setCsvContent] = useState<string>(
    'sku,name,type,standard_cost\nCMP-104,Micro-Gearbox Assembly,COMPONENT,115.50\nCMP-105,Heat Dissipation Sink,COMPONENT,45.00'
  );
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CsvValidationResponse | null>(null);

  // Commit modal state
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [versionTag, setVersionTag] = useState('1.1.0-custom');
  const [importDescription, setImportDescription] = useState('Added high-speed gearbox and heat sink components');
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDatasets();
      setDatasets(res.versions || []);
      setActiveVersion(res.activeVersion || null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleTemplateSelect = (type: 'products' | 'suppliers') => {
    setImportEntity(type);
    setValidationResult(null);
    if (type === 'products') {
      setCsvContent(
        'sku,name,type,standard_cost\nCMP-104,Micro-Gearbox Assembly,COMPONENT,115.50\nCMP-105,Heat Dissipation Sink,COMPONENT,45.00'
      );
    } else {
      setCsvContent(
        'code,name,location,criticality\nSUP-04,Apex Micro-Machining,Kyoto Japan,SECONDARY\nSUP-05,Nokia Mechatronics,Espoo Finland,ALTERNATE'
      );
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      setValidationResult(null);
      setCommitMessage(null);
      const res = await adminApi.validateCsvImport(importEntity, csvContent);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        rowCount: 0,
        errors: [{ row: 0, column: 'system', value: '', message: err.message }],
        message: err.message,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCommit = async () => {
    try {
      setCommitting(true);
      const res = await adminApi.commitCsvImport(
        importEntity,
        csvContent,
        versionTag,
        importDescription
      );
      setIsCommitModalOpen(false);
      setCommitMessage(res.message);
      setValidationResult(null);
      loadDatasets();
      onRefreshOverview();
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  const handleExport = () => {
    window.open('/api/v1/datasets/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {commitMessage && (
        <div className="p-4 rounded-2xl bg-[#d1ffca] text-[#000000] font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{commitMessage}</span>
          </div>
          <button onClick={() => setCommitMessage(null)} className="font-bold underline text-[10px]">
            DISMISS
          </button>
        </div>
      )}

      {/* Top Card: Active Dataset Governance Status */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="tag-mint">ACTIVE MASTER DATASET</span>
            <span className="font-mono text-xs text-[#979797]">
              SEED: {activeVersion?.seed || 'SEED_2026_SCM_V1'}
            </span>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-[#000000] uppercase">
            {activeVersion?.name || 'SCM Echo 2026 Canonical Benchmark'}
          </h2>
          <p className="font-body text-xs text-[#444444]">
            Authoritative source of truth stored in Neon PostgreSQL. Relational constraints and referential integrity enforced.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="btn-ghost inline-flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export Master Dataset (JSON)</span>
        </button>
      </div>

      {/* CSV Master-Data Import Studio */}
      <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-[#f3f3f3]">
          <div>
            <span className="tag-voltage mb-1">CSV MASTER-DATA INGESTION</span>
            <h3 className="font-display text-2xl text-[#000000] uppercase mt-1">
              Transactional Data Import & Pre-Validation Engine
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#979797]">Template:</span>
            <button
              onClick={() => handleTemplateSelect('products')}
              className={`px-3 py-1 rounded-lg ${
                importEntity === 'products'
                  ? 'bg-[#000000] text-white font-bold'
                  : 'bg-[#f3f3f3] text-[#444444]'
              }`}
            >
              Products (SKU)
            </button>
            <button
              onClick={() => handleTemplateSelect('suppliers')}
              className={`px-3 py-1 rounded-lg ${
                importEntity === 'suppliers'
                  ? 'bg-[#000000] text-white font-bold'
                  : 'bg-[#f3f3f3] text-[#444444]'
              }`}
            >
              Suppliers (Nodes)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs text-[#444444] block">
            CSV Input (Headers + Comma-Separated Data Rows):
          </label>
          <textarea
            rows={5}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setValidationResult(null);
            }}
            className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-xl p-3 font-mono text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#979797]">
            Validates schema, data types, duplicate PKs, and foreign keys prior to write.
          </span>
          <button
            onClick={handleValidate}
            disabled={validating}
            className="btn-dark inline-flex items-center gap-2 text-xs py-2 px-4"
          >
            <Upload className={`w-3.5 h-3.5 ${validating ? 'animate-bounce' : ''}`} />
            <span>{validating ? 'Running Validation Suite...' : 'Step 1: Validate CSV File'}</span>
          </button>
        </div>

        {/* Validation Results Display */}
        {validationResult && (
          <div className="p-5 rounded-2xl bg-[#f3f3f3] space-y-4 font-mono text-xs border border-[#c6c6c6]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validationResult.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-[#000000]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-bold text-sm text-[#000000]">
                  {validationResult.valid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}
                </span>
              </div>
              <span className="text-[11px] text-[#979797]">
                {validationResult.rowCount} rows evaluated
              </span>
            </div>

            <p className="text-[#444444] text-[11px]">{validationResult.message}</p>

            {/* Error table if errors exist */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-red-800 text-xs block">Actionable Row Errors:</span>
                <div className="overflow-x-auto bg-white rounded-xl border border-red-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-red-50 text-red-900 uppercase">
                      <tr>
                        <th className="p-2">Row #</th>
                        <th className="p-2">Column</th>
                        <th className="p-2">Offending Value</th>
                        <th className="p-2">Validation Rule Breached</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {validationResult.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-red-50/50">
                          <td className="p-2 font-bold text-red-900">{err.row}</td>
                          <td className="p-2">{err.column}</td>
                          <td className="p-2 text-red-800 font-mono">
                            {err.value ? String(err.value) : '<empty>'}
                          </td>
                          <td className="p-2 text-red-700">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* If valid, show preview and commit button */}
            {validationResult.valid && (
              <div className="pt-2 flex items-center justify-between border-t border-[#c6c6c6]/30">
                <span className="text-[11px] text-green-800 font-bold">
                  All rows comply with schema constraints. Ready for explicit confirmation.
                </span>
                <button
                  onClick={() => setIsCommitModalOpen(true)}
                  className="btn-mint inline-flex items-center gap-1.5 text-xs py-2 px-4 font-bold"
                >
                  <span>Step 2: Review & Commit Version</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dataset Version History */}
      <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
          <h3 className="font-display text-2xl text-[#000000] uppercase">
            Dataset Version Audit Trail
          </h3>
          <span className="font-mono text-xs text-[#979797]">
            {datasets.length} version snapshots recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
              <tr>
                <th className="p-3">Version Tag</th>
                <th className="p-3">Description / Name</th>
                <th className="p-3">Seed Identifier</th>
                <th className="p-3">Import Timestamp</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f3f3]">
              {datasets.map((v) => (
                <tr key={v.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                  <td className="p-3 font-bold text-[#000000]">{v.version}</td>
                  <td className="p-3">{v.name}</td>
                  <td className="p-3 text-[10px] text-[#979797]">{v.seed}</td>
                  <td className="p-3 text-[11px] text-[#444444]">
                    {new Date(v.imported_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'ACTIVE'
                          ? 'bg-[#d1ffca] text-[#000000]'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commit Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <h4 className="font-display text-xl text-[#000000] uppercase">
                Confirm Transactional Commit
              </h4>
              <button
                onClick={() => setIsCommitModalOpen(false)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-[#444444]">
                You are about to commit validated master data records directly to Neon PostgreSQL. A new immutable version tag will be generated.
              </p>

              <div>
                <label className="block text-[#444444] mb-1">New Version Tag:</label>
                <input
                  type="text"
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Audit Description:</label>
                <textarea
                  rows={2}
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f3f3f3]">
                <button
                  onClick={() => setIsCommitModalOpen(false)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={committing}
                  className="btn-dark text-xs py-1.5 px-4"
                >
                  {committing ? 'Committing...' : 'Commit to Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
