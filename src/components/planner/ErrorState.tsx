'use client';

import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { ApiError } from '@/lib/planner-api';

interface ErrorStateProps {
  error: Error | ApiError | null;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Unable to Load Planner Data' }: ErrorStateProps) {
  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : null;
  const endpoint = isApiError ? error.endpoint : null;
  const contractDependency = isApiError ? error.contractDependency : null;
  const detail = error?.message || 'An unexpected error occurred while communicating with the backend.';

  return (
    <div className="card-standard border border-[#000000]/20 p-8 bg-[#ffffff] space-y-5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[#fff100]/30 rounded-2xl border border-[#c6c6c6]">
          <AlertTriangle className="w-6 h-6 text-[#000000]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-xl uppercase tracking-tight text-[#000000]">
            {title}
          </h3>
          <p className="font-mono text-xs text-[#444444] leading-relaxed max-w-2xl">
            {detail}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#f3f3f3] border border-[#c6c6c6]/50 space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between text-[#444444]">
          <span className="text-[#979797] uppercase">HTTP Status:</span>
          <span className="font-semibold text-[#000000]">{status !== null ? (status === 0 ? 'Network Failure / Offline' : status) : 'Client Error'}</span>
        </div>
        {endpoint && (
          <div className="flex items-center justify-between text-[#444444]">
            <span className="text-[#979797] uppercase">Failed Endpoint:</span>
            <span className="font-semibold text-[#000000]">{endpoint}</span>
          </div>
        )}
        {contractDependency && (
          <div className="flex items-center justify-between text-[#444444]">
            <span className="text-[#979797] uppercase">Contract Dependency:</span>
            <span className="text-[#000000]">{contractDependency}</span>
          </div>
        )}
      </div>

      {onRetry && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onRetry}
            className="btn-dark inline-flex items-center gap-2 text-xs py-2 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <span className="font-mono text-[11px] text-[#979797]">
            Queries are routed through the shared database-backed API layer.
          </span>
        </div>
      )}
    </div>
  );
}

export function LoadingSkeleton({ text = 'Querying live simulation state...' }: { text?: string }) {
  return (
    <div className="card-standard border border-[#c6c6c6]/40 p-12 bg-[#ffffff] flex flex-col items-center justify-center space-y-4 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#000000] border-t-transparent animate-spin" />
      <div className="space-y-1">
        <span className="font-display text-lg uppercase text-[#000000]">{text}</span>
        <p className="font-mono text-xs text-[#979797]">
          Connecting to Neon PostgreSQL & OR-Tools Optimization Services
        </p>
      </div>
    </div>
  );
}
