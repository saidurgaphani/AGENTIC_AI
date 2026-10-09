'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Boxes,
  Truck,
  Factory,
  Layers,
  Activity,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { adminApi, NetworkSummaryResponse } from '@/lib/admin-api';

interface NetworkSectionProps {
  onRefreshOverview: () => void;
}

type NetworkSubTab = 'suppliers' | 'products' | 'facilities' | 'dcs' | 'lanes' | 'inventory';

export function NetworkSection({ onRefreshOverview }: NetworkSectionProps) {
  const [subTab, setSubTab] = useState<NetworkSubTab>('suppliers');
  const [data, setData] = useState<NetworkSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    code: '',
    name: '',
    location: '',
    criticality: 'SECONDARY',
  });

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    type: 'COMPONENT',
    standard_cost: 100,
    uom: 'units',
  });

  // Dependency warning modal
  const [dependencyModal, setDependencyModal] = useState<{
    open: boolean;
    entityType: string;
    entityId: string;
    entityName: string;
    data: any;
    loading: boolean;
  }>({
    open: false,
    entityType: '',
    entityId: '',
    entityName: '',
    data: null,
    loading: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getNetworkSummary();
      setData(res);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Add Supplier Handler
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createSupplier(newSupplier);
      setIsAddSupplierOpen(false);
      setNewSupplier({ code: '', name: '', location: '', criticality: 'SECONDARY' });
      showNotification('success', `Supplier ${newSupplier.code} successfully registered in database.`);
      loadData();
      onRefreshOverview();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Add Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createProduct(newProduct);
      setIsAddProductOpen(false);
      setNewProduct({ sku: '', name: '', type: 'COMPONENT', standard_cost: 100, uom: 'units' });
      showNotification('success', `Product SKU ${newProduct.sku} created.`);
      loadData();
      onRefreshOverview();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Safe Deactivation check
  const handleCheckDeactivate = async (entityType: string, entityId: string, entityName: string) => {
    setDependencyModal({
      open: true,
      entityType,
      entityId,
      entityName,
      data: null,
      loading: true,
    });

    try {
      const depData = await adminApi.checkDependencies(entityType, entityId);
      setDependencyModal((prev) => ({
        ...prev,
        data: depData,
        loading: false,
      }));
    } catch (err: any) {
      setDependencyModal((prev) => ({ ...prev, loading: false }));
      showNotification('error', 'Failed to inspect dependencies');
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      if (dependencyModal.entityType === 'supplier') {
        await adminApi.deleteSupplier(dependencyModal.entityId, false);
      } else if (dependencyModal.entityType === 'product') {
        await adminApi.deleteProduct(dependencyModal.entityId);
      }
      setDependencyModal({ open: false, entityType: '', entityId: '', entityName: '', data: null, loading: false });
      showNotification('success', `${dependencyModal.entityName} safely deactivated. Historical references preserved.`);
      loadData();
      onRefreshOverview();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="card-standard border border-[#c6c6c6]/50 p-12 text-center">
        <div className="w-8 h-8 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="font-mono text-xs text-[#444444]">Loading network entities from Neon PostgreSQL...</span>
      </div>
    );
  }

  const suppliers = (data?.suppliers || []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const products = (data?.products || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notifications */}
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

      {/* Network Navigation & Search Header */}
      <div className="card-standard border border-[#c6c6c6]/50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Sub-tab pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'suppliers', label: `Suppliers (${data?.suppliers.length || 0})`, icon: Truck },
            { id: 'products', label: `Products & BOM (${data?.products.length || 0})`, icon: Boxes },
            { id: 'facilities', label: `Plants (${data?.facilities.length || 0})`, icon: Factory },
            { id: 'dcs', label: `Fulfillment DCs (${data?.distributionCenters.length || 0})`, icon: Layers },
            { id: 'lanes', label: `Lanes (${data?.transportLanes.length || 0})`, icon: ArrowRight },
            { id: 'inventory', label: `Inventory & Demand`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as NetworkSubTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#000000] text-[#ffffff] font-semibold'
                    : 'bg-[#f3f3f3] text-[#444444] hover:bg-[#e5e5e5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Action Bar */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#979797]" />
            <input
              type="text"
              placeholder="Filter by SKU, code, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f3f3f3] border border-[#c6c6c6]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-[#000000] focus:outline-none focus:border-[#000000]"
            />
          </div>

          {subTab === 'suppliers' && (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="btn-dark inline-flex items-center gap-1 text-xs py-1.5 px-3 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          )}

          {subTab === 'products' && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="btn-dark inline-flex items-center gap-1 text-xs py-1.5 px-3 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Suppliers Table View */}
      {subTab === 'suppliers' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Qualified Suppliers & Sourcing Nodes
            </h3>
            <span className="font-mono text-xs text-[#979797]">
              {suppliers.length} records matching in database
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Code / ID</th>
                  <th className="p-3">Supplier Name & Region</th>
                  <th className="p-3">Criticality</th>
                  <th className="p-3">Disruption Status</th>
                  <th className="p-3">Active State</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                    <td className="p-3 font-bold text-[#000000]">{s.code}</td>
                    <td className="p-3">
                      <span className="font-bold text-[#000000] block">{s.name}</span>
                      <span className="text-[10px] text-[#979797]">{s.location}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.criticality === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : s.criticality === 'ALTERNATE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {s.criticality}
                      </span>
                    </td>
                    <td className="p-3">
                      {s.disrupted ? (
                        <span className="tag-voltage text-[10px] py-0.5 px-2">OUTAGE ACTIVE</span>
                      ) : (
                        <span className="text-green-700 font-semibold text-[11px]">Normal Delivery</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          s.active ? 'bg-[#d1ffca] text-[#000000] font-bold' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {s.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {s.active && (
                        <button
                          onClick={() => handleCheckDeactivate('supplier', s.id, `${s.code} (${s.name})`)}
                          className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-[11px] font-bold p-1 hover:bg-red-50 rounded"
                          title="Safe deactivation with dependency check"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
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

      {/* 2. Products & BOM Table View */}
      {subTab === 'products' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Product Master & Bill of Materials
            </h3>
            <span className="font-mono text-xs text-[#979797]">
              {products.length} registered SKUs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Standard Cost</th>
                  <th className="p-3">BOM Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {products.map((p) => {
                  const isFinished = p.type === 'FINISHED_GOOD';
                  return (
                    <tr key={p.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                      <td className="p-3 font-bold text-[#000000]">{p.sku}</td>
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFinished ? 'bg-amber-100 text-amber-900' : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">${Number(p.standard_cost).toFixed(2)}</td>
                      <td className="p-3 text-[11px] text-[#444444]">
                        {isFinished
                          ? 'Parent SKU (Assembly: 1x CMP-101 + 1x CMP-102)'
                          : 'Child Component'}
                      </td>
                      <td className="p-3 text-right">
                        {p.active && (
                          <button
                            onClick={() => handleCheckDeactivate('product', p.id, `${p.sku} (${p.name})`)}
                            className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-[11px] font-bold p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Facilities Table View */}
      {subTab === 'facilities' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Assembly Facilities & Manufacturing Plants
            </h3>
            <span className="font-mono text-xs text-[#979797]">
              {data?.facilities.length || 0} production sites
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {(data?.facilities || []).map((f) => (
              <div key={f.id} className="p-5 rounded-2xl bg-[#f3f3f3] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-[#000000] block">{f.name}</span>
                    <span className="text-[10px] text-[#979797]">{f.location}</span>
                  </div>
                  <span className="tag-mint text-[10px]">ACTIVE PLANT</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#c6c6c6]/30">
                  <div>
                    <span className="text-[#979797] block">Assembled SKU:</span>
                    <span className="font-bold text-[#000000]">{f.produced_sku}</span>
                  </div>
                  <div>
                    <span className="text-[#979797] block">Daily Capacity:</span>
                    <span className="font-bold text-[#000000]">{f.daily_capacity} units/day</span>
                  </div>
                  <div>
                    <span className="text-[#979797] block">Daily Operating Cost:</span>
                    <span className="font-bold text-[#000000]">
                      ${Number(f.daily_operating_cost).toLocaleString()}/day
                    </span>
                  </div>
                  <div>
                    <span className="text-[#979797] block">Shift Flexibility:</span>
                    <span className="font-bold text-[#000000]">Single-Shift Line</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Distribution Centers Table View */}
      {subTab === 'dcs' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Regional Fulfillment Hubs & Target SLAs
            </h3>
            <span className="font-mono text-xs text-[#979797]">
              {data?.distributionCenters.length || 0} gateways
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {(data?.distributionCenters || []).map((dc) => (
              <div key={dc.id} className="p-5 rounded-2xl bg-[#f3f3f3] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-[#000000] block">{dc.name}</span>
                    <span className="text-[10px] text-[#979797]">{dc.location}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dc.service_tier === 'TIER_1_CRITICAL'
                        ? 'bg-red-100 text-red-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {dc.service_tier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#c6c6c6]/30">
                  <div>
                    <span className="text-[#979797] block">Hub Code:</span>
                    <span className="font-bold text-[#000000]">{dc.code}</span>
                  </div>
                  <div>
                    <span className="text-[#979797] block">Contractual SLA:</span>
                    <span className="font-bold text-green-700">{dc.target_sla_percent}% Fill Rate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Transport Lanes Table View */}
      {subTab === 'lanes' && (
        <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f3f3f3]">
            <h3 className="font-display text-2xl text-[#000000] uppercase">
              Logistics Transport Lanes & Lead Times
            </h3>
            <span className="font-mono text-xs text-[#979797]">
              {data?.transportLanes.length || 0} active lanes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#f3f3f3] text-[#444444] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Lane ID</th>
                  <th className="p-3">Origin Node</th>
                  <th className="p-3">Destination Node</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Standard Transit</th>
                  <th className="p-3">Standard Cost</th>
                  <th className="p-3">Expedited Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f3f3]">
                {(data?.transportLanes || []).map((l) => (
                  <tr key={l.id} className="hover:bg-[#f3f3f3]/50 transition-colors">
                    <td className="p-3 font-bold text-[#000000]">{l.id}</td>
                    <td className="p-3 text-[#000000]">{l.origin_id}</td>
                    <td className="p-3 text-[#000000]">{l.destination_id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#ffffff] border border-[#c6c6c6]/50 text-[10px]">
                        {l.mode}
                      </span>
                    </td>
                    <td className="p-3">{l.transit_days} days</td>
                    <td className="p-3 font-semibold">${Number(l.cost_per_unit).toFixed(2)}/u</td>
                    <td className="p-3 text-[11px]">
                      {l.expedited_transit_days ? (
                        <span className="text-amber-800 font-bold">
                          {l.expedited_transit_days}d (${Number(l.expedited_cost_per_unit).toFixed(2)}/u)
                        </span>
                      ) : (
                        <span className="text-[#979797]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Inventory & Demand View */}
      {subTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
            <h3 className="font-display text-xl text-[#000000] uppercase pb-2 border-b border-[#f3f3f3]">
              Current Inventory Balances
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {(data?.inventory || []).map((inv) => (
                <div key={inv.id} className="p-3 rounded-xl bg-[#f3f3f3] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#000000] block">
                      {inv.item_sku} @ {inv.node_id}
                    </span>
                    <span className="text-[10px] text-[#979797]">
                      Reserved: {inv.reserved_units}u · Safety Target: {inv.safety_stock_target}u
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl text-[#000000] block">
                      {inv.on_hand_units} u
                    </span>
                    <span className="text-[10px] text-green-700 font-bold">Verified In-Stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-standard border border-[#c6c6c6]/40 p-6 space-y-4">
            <h3 className="font-display text-xl text-[#000000] uppercase pb-2 border-b border-[#f3f3f3]">
              Daily Customer Demand Records
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {(data?.demand || []).map((dem) => (
                <div key={dem.id} className="p-3 rounded-xl bg-[#f3f3f3] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#000000] block">
                      {dem.product_sku} → {dem.destination_id}
                    </span>
                    <span className="text-[10px] text-[#979797]">
                      Period Day {dem.period_day} · Priority: {dem.service_priority}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl text-[#000000] block">
                      {dem.quantity} u/day
                    </span>
                    <span className="text-[10px] text-[#444444]">Daily Commitment</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <h4 className="font-display text-xl text-[#000000] uppercase">Register New Supplier</h4>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#444444] mb-1">Supplier Code (e.g., SUP-04)</label>
                <input
                  type="text"
                  required
                  placeholder="SUP-04"
                  value={newSupplier.code}
                  onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Precision Machining"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Location & Facility Spec</label>
                <input
                  type="text"
                  required
                  placeholder="Kyoto, Japan"
                  value={newSupplier.location}
                  onChange={(e) => setNewSupplier({ ...newSupplier, location: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Criticality Tier</label>
                <select
                  value={newSupplier.criticality}
                  onChange={(e) => setNewSupplier({ ...newSupplier, criticality: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                >
                  <option value="CRITICAL">CRITICAL (Sole-source key component)</option>
                  <option value="SECONDARY">SECONDARY (Qualified standard)</option>
                  <option value="ALTERNATE">ALTERNATE (Backup standby)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-dark text-xs py-1.5 px-4">
                  Save to Neon DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#f3f3f3]">
              <h4 className="font-display text-xl text-[#000000] uppercase">Register New Product SKU</h4>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-xs font-mono text-[#979797] hover:text-[#000000]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#444444] mb-1">Product SKU (e.g., CMP-103)</label>
                <input
                  type="text"
                  required
                  placeholder="CMP-103"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="High-Speed Encoder Wheel"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Product Type</label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                >
                  <option value="COMPONENT">COMPONENT (Raw input component)</option>
                  <option value="FINISHED_GOOD">FINISHED_GOOD (Assembled final unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#444444] mb-1">Standard Cost ($ USD)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newProduct.standard_cost}
                  onChange={(e) => setNewProduct({ ...newProduct, standard_cost: parseFloat(e.target.value) })}
                  className="w-full bg-[#f3f3f3] border border-[#c6c6c6] rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-dark text-xs py-1.5 px-4">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dependency Warning & Safe Deactivation Modal */}
      {dependencyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl border border-[#c6c6c6] p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f3f3f3] text-amber-700">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-display text-xl uppercase">
                Dependency Impact Analysis: {dependencyModal.entityName}
              </h4>
            </div>

            {dependencyModal.loading ? (
              <div className="p-8 text-center font-mono text-xs text-[#979797]">
                Tracing network dependencies in Neon PostgreSQL...
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                <p className="text-[#444444]">
                  Before deactivating this entity, our relational integrity engine evaluated downstream dependencies:
                </p>

                {dependencyModal.data?.warnings?.length > 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-900 block">Identified Active Relationships:</span>
                    <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-0.5">
                      {dependencyModal.data.warnings.map((w: string, idx: number) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#d1ffca] text-[#000000]">
                    Zero active downstream scenario dependencies. Safe to proceed with deactivation.
                  </div>
                )}

                <p className="text-[#444444] text-[11px]">
                  <strong>Consequences:</strong> The record will be marked as inactive. Existing historical simulation runs, metrics, and audit logs will remain intact to guarantee full audit reproducibility.
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#f3f3f3]">
                  <button
                    onClick={() =>
                      setDependencyModal({ open: false, entityType: '', entityId: '', entityName: '', data: null, loading: false })
                    }
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeactivate}
                    className="btn-dark bg-red-700 hover:bg-red-800 text-white text-xs py-1.5 px-4"
                  >
                    Confirm Safe Deactivation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
