"use client";

import React from "react";
import { X, Plus, Trash2, MapPin, Clock, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import { Customer, Branch, Installation, UsageStatus } from "@/types";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  activeTab: "general" | "branches" | "installations";
  setActiveTab: (tab: "general" | "branches" | "installations") => void;
  branchInputs: Branch[];
  setBranchInputs: (branches: Branch[]) => void;
  activeBranchIndex: number;
  setActiveBranchIndex: (index: number) => void;
  modalUsageStatus: UsageStatus;
  setModalUsageStatus: (status: UsageStatus) => void;
  pendingInstallationChanges: Record<number, string>;
  setPendingInstallationChanges: (changes: Record<number, string>) => void;
  users: any[];
  installations: Installation[];
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteBranch: (index: number, name: string) => void;
}

const CustomerModal = React.memo(function CustomerModal({
  isOpen,
  onClose,
  editingCustomer,
  activeTab,
  setActiveTab,
  branchInputs,
  setBranchInputs,
  activeBranchIndex,
  setActiveBranchIndex,
  modalUsageStatus,
  setModalUsageStatus,
  pendingInstallationChanges,
  setPendingInstallationChanges,
  users,
  installations,
  onSave,
  onDeleteBranch,
}: CustomerModalProps) {
  if (!isOpen) return null;

  const handleAddBranch = () => {
    const mainCsOwner = (document.getElementsByName('csOwner')[0] as HTMLSelectElement)?.value || editingCustomer?.csOwner || "";
    const newBranch: Branch = {
      name: "",
      isMain: false,
      status: "Pending",
      csOwner: mainCsOwner
    };
    setBranchInputs([...branchInputs, newBranch]);
    setActiveBranchIndex(branchInputs.length);
  };

  const handleBranchNameChange = (value: string) => {
    const updated = [...branchInputs];
    updated[activeBranchIndex].name = value;
    setBranchInputs(updated);
  };

  const handleBranchContractStartChange = (value: string) => {
    const updated = [...branchInputs];
    updated[activeBranchIndex].contractStart = value;
    setBranchInputs(updated);
  };

  const handleBranchCsOwnerChange = (value: string) => {
    const updated = [...branchInputs];
    updated[activeBranchIndex].csOwner = value;
    setBranchInputs(updated);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "Completed": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      case "Completed": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col relative shadow-2xl border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h2 id="customer-modal-title" className="text-xl font-bold">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            ข้อมูลทั่วไป
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'branches' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            จัดการสาขา
          </button>
          {editingCustomer && (
            <button
              type="button"
              onClick={() => setActiveTab('installations')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'installations' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              งานติดตั้ง
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1 min-h-[500px]">
          <form id="save-customer-form" onSubmit={onSave}>
            <div className="space-y-6">
              {/* General Tab */}
              <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                  ข้อมูลพื้นฐาน
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {editingCustomer && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Customer ID</label>
                      <input
                        type="text"
                        name="clientCode"
                        defaultValue={editingCustomer.clientCode || `DE${editingCustomer.id.toString().padStart(4, "0")}`}
                        className="input-field"
                        placeholder="DE0000"
                      />
                    </div>
                  )}

                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-medium text-slate-400">
                      ชื่อคลินิก/ร้าน <span className="text-rose-400">*</span>
                    </label>
                    <input
                      name="name"
                      defaultValue={editingCustomer?.name}
                      className="input-field"
                      placeholder="กรอกชื่อคลินิกหรือร้าน..."
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">
                      Subdomain / Link <span className="text-rose-400">*</span>
                    </label>
                    <input name="subdomain" defaultValue={editingCustomer?.subdomain} className="input-field" required aria-required="true" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ประเภทระบบ</label>
                    <CustomSelect name="product" defaultValue={editingCustomer?.productType || "Dr.Ease"} options={[{ value: "Dr.Ease", label: "Dr.Ease" }, { value: "EasePos", label: "EasePos" }]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">สถานะการใช้งาน</label>
                    <CustomSelect
                      name="usageStatus"
                      options={[
                        { value: "Training", label: "รอการเทรนนิ่ง" },
                        { value: "Pending", label: "รอการใช้งาน" },
                        { value: "Active", label: "ใช้งานแล้ว" },
                        { value: "Canceled", label: "ยกเลิก" },
                      ]}
                      value={modalUsageStatus}
                      onChange={(val) => setModalUsageStatus(val as UsageStatus)}
                      placeholder="เลือกสถานะ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">แพ็คเกจ</label>
                    <CustomSelect name="package" defaultValue={editingCustomer?.package || "Standard"} options={[{ value: "Starter", label: "Starter" }, { value: "Standard", label: "Standard" }, { value: "Elite", label: "Elite" }]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">CS Owner (ผู้ดูแลหลัก)</label>
                    <CustomSelect
                      name="csOwner"
                      defaultValue={editingCustomer?.csOwner || ""}
                      options={[
                        { value: "", label: "ไม่ระบุ" },
                        ...users.map(u => ({ value: u.name, label: u.name }))
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ชื่อเซลล์ (Sales Name)</label>
                    <input name="salesName" defaultValue={editingCustomer?.salesName} className="input-field" placeholder="ระบุชื่อเซลล์..." />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-medium text-slate-400">หมายเหตุ</label>
                    <textarea name="note" defaultValue={editingCustomer?.note} className="input-field min-h-[80px]" />
                  </div>
                </div>
              </div>

              {/* Branches Tab */}
              <div className={`border-t border-white/10 pt-6 ${activeTab === 'branches' ? 'block' : 'hidden'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    จัดการสาขา ({branchInputs.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all border border-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มสาขา
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 h-[320px] bg-slate-900/40 rounded-xl border border-white/5 p-4">
                  {/* Left: Branch List */}
                  <div className="w-full md:w-1/3 flex flex-col border-r border-white/5 pr-4">
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {branchInputs.map((branch, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setActiveBranchIndex(idx)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${idx === activeBranchIndex
                            ? "bg-indigo-500/10 border-indigo-500/30 shadow-sm"
                            : "bg-transparent border-transparent hover:bg-white/5"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${idx === activeBranchIndex ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                                {idx + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xs font-semibold truncate max-w-[120px] ${idx === activeBranchIndex ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}>
                                  {branch.name || "ระบุชื่อสาขา..."}
                                </span>
                                {branch.isMain && (
                                  <span className="text-[9px] text-emerald-400 font-medium">Main Branch</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`absolute right-3 top-3 w-1.5 h-1.5 rounded-full ${branch.status === "Completed" ? "bg-emerald-500" : "bg-slate-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Branch Details */}
                  <div className="flex-1 pl-2">
                    {branchInputs[activeBranchIndex] ? (
                      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                          <div>
                            <h4 className="text-sm font-semibold text-white">รายละเอียดสาขา</h4>
                            <p className="text-[10px] text-slate-500">แก้ไขข้อมูลและจัดการสถานะของสาขาที่เลือก</p>
                          </div>
                          {!branchInputs[activeBranchIndex].isMain && (
                            <button
                              type="button"
                              onClick={() => onDeleteBranch(activeBranchIndex, branchInputs[activeBranchIndex].name || "สาขาที่เลือก")}
                              className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              ลบสาขานี้
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">ชื่อสาขา (Branch Name)</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                              <input
                                type="text"
                                value={branchInputs[activeBranchIndex].name}
                                onChange={(e) => handleBranchNameChange(e.target.value)}
                                placeholder="เช่น สาขาสยามพารากอน..."
                                className="input-field pl-9 py-2 text-sm w-full"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">สถานะการติดตั้ง (Installation Status)</label>
                            <div className="h-9 flex items-center">
                              {(() => {
                                const activeBranch = branchInputs[activeBranchIndex];
                                const inst = installations.find(i =>
                                  i.customerId === editingCustomer?.id &&
                                  ((activeBranch.isMain && i.installationType === "new") ||
                                    (!activeBranch.isMain && i.installationType === "branch" && i.branchName === activeBranch.name))
                                );

                                if (inst) {
                                  return (
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusStyle(inst.status)}`}>
                                      {getStatusIcon(inst.status)}
                                      {inst.status}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-400">วันที่เริ่มสัญญา (Contract Start)</label>
                              <input
                                type="date"
                                value={branchInputs[activeBranchIndex].contractStart || ""}
                                onChange={(e) => handleBranchContractStartChange(e.target.value)}
                                className="input-field text-sm w-full h-10 px-3 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-slate-400">CS Owner (สาขา)</label>
                              <CustomSelect
                                name={`branchCsOwner-${activeBranchIndex}`}
                                defaultValue={branchInputs[activeBranchIndex].csOwner || ""}
                                onChange={(val) => handleBranchCsOwnerChange(val)}
                                options={[
                                  { value: "", label: "ใช้ตามลูกค้าหลัก" },
                                  ...users.map(u => ({ value: u.name, label: u.name }))
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <MapPin className="w-12 h-12 mb-3" />
                        <p className="text-sm">เลือกสาขาเพื่อแก้ไขรายละเอียด</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Installations Tab */}
              {editingCustomer && (
                <div className={`border-t border-white/10 pt-6 ${activeTab === 'installations' ? 'block' : 'hidden'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                      งานติดตั้ง
                    </h3>
                  </div>

                  {(() => {
                    const customerInstallations = installations.filter(i => i.customerId === editingCustomer.id);

                    if (customerInstallations.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-500">
                          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">ไม่มีงานติดตั้ง</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {customerInstallations.map((inst) => (
                          <div key={inst.id} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${inst.installationType === 'new' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                  {inst.installationType === 'new' ? 'NEW' : 'BRANCH'}
                                </span>
                                <span className="text-xs text-white font-medium truncate">
                                  {inst.installationType === 'new' ? inst.customerName : inst.branchName || '-'}
                                </span>
                              </div>
                              <CustomSelect
                                name={`inst-status-${inst.id}`}
                                value={pendingInstallationChanges[inst.id] || inst.status}
                                onChange={(newStatus) => {
                                  setPendingInstallationChanges({ ...pendingInstallationChanges, [inst.id]: newStatus });
                                }}
                                options={[
                                  { value: 'Pending', label: 'Pending' },
                                  { value: 'Completed', label: 'Completed' }
                                ]}
                                className="!w-auto !min-w-[110px]"
                              />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                              <span>แจ้งโดย: <span className="text-slate-400">{inst.requestedBy || '-'}</span> • {formatDateTime(inst.requestedAt)}</span>
                              {inst.modifiedBy && (
                                <span>แก้ไขโดย: <span className="text-slate-400">{inst.modifiedBy}</span> • {formatDateTime(inst.modifiedAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#1e293b]/50 backdrop-blur-sm shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">ยกเลิก</button>
            <button type="submit" form="save-customer-form" className="btn btn-primary flex-1">บันทึก</button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomerModal;
