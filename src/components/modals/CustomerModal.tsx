"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, MapPin, Clock, CheckCircle2, AlertCircle, Layers, History, Loader2, Edit2, Check } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import CustomDatePicker from "@/components/CustomDatePicker";
import { Customer, Branch, Installation, UsageStatus, FollowUpLog } from "@/types";
import { getFollowUpLogs, updateFollowUpLog, deleteFollowUpLog } from "@/app/actions";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  activeTab: "general" | "branches" | "installations" | "followup-history";
  setActiveTab: (tab: "general" | "branches" | "installations" | "followup-history") => void;
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
  // Follow-up history state
  const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingFeedback, setEditingFeedback] = useState("");
  // Pending changes - will be applied when user clicks "บันทึก"
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const [pendingEdits, setPendingEdits] = useState<Map<number, string>>(new Map());

  // Fetch follow-up history when tab changes or customer changes
  useEffect(() => {
    if (activeTab === "followup-history" && editingCustomer) {
      fetchFollowUpHistory();
    }
  }, [activeTab, editingCustomer?.id]);

  const fetchFollowUpHistory = async () => {
    if (!editingCustomer) return;
    setIsLoadingHistory(true);
    try {
      const logs = await getFollowUpLogs(editingCustomer.id);
      setFollowUpLogs(logs);
    } catch (error) {
      console.error("Error fetching follow-up history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleEditLog = (log: FollowUpLog) => {
    setEditingLogId(log.id);
    // Use pending edit if exists, otherwise use original
    setEditingFeedback(pendingEdits.get(log.id) ?? log.feedback ?? "");
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setEditingFeedback("");
  };

  const handleSaveLogEdit = (logId: number) => {
    // Save to pending edits (will be applied when modal saves)
    setPendingEdits(prev => new Map(prev).set(logId, editingFeedback));
    setEditingLogId(null);
    setEditingFeedback("");
  };

  const handleMarkDeleteLog = (logId: number) => {
    // Mark for deletion (will be applied when modal saves)
    setPendingDeleteIds(prev => new Set(prev).add(logId));
  };

  const handleUndoDelete = (logId: number) => {
    setPendingDeleteIds(prev => {
      const next = new Set(prev);
      next.delete(logId);
      return next;
    });
  };

  // Reset pending changes when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPendingDeleteIds(new Set());
      setPendingEdits(new Map());
      setEditingLogId(null);
      setEditingFeedback("");
    }
  }, [isOpen]);

  // Apply pending changes when form is saved
  const handleFormSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Apply pending deletes
      for (const id of pendingDeleteIds) {
        await deleteFollowUpLog(id);
      }

      // Apply pending edits
      for (const [id, feedback] of pendingEdits) {
        if (!pendingDeleteIds.has(id)) {
          await updateFollowUpLog(id, { feedback });
        }
      }

      // Clear pending changes
      setPendingDeleteIds(new Set());
      setPendingEdits(new Map());
    } catch (error) {
      console.error("Error saving follow-up changes:", error);
    }

    // Call original onSave
    onSave(e);
  };

  if (!isOpen) return null;

  const handleAddBranch = () => {
    const newBranch: Branch = {
      name: "",
      isMain: false,
      status: "Pending",
      csOwner: ""
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
      default: return <AlertCircle className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
      case "Completed": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/15 text-text-muted border-slate-500/20";
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
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col relative shadow-2xl border-border">
        {/* Header */}
        <div className="p-6 border-b border-border-light flex items-center justify-between shrink-0">
          <h2 id="customer-modal-title" className="text-xl font-bold">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="text-text-muted hover:text-text-main transition-colors p-2 hover:bg-bg-hover rounded-lg"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-border-light">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-white' : 'border-transparent text-text-muted hover:text-slate-200'}`}
          >
            ข้อมูลทั่วไป
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'branches' ? 'border-indigo-500 text-white' : 'border-transparent text-text-muted hover:text-slate-200'}`}
          >
            จัดการสาขา
          </button>
          {editingCustomer && (
            <button
              type="button"
              onClick={() => setActiveTab('installations')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'installations' ? 'border-indigo-500 text-white' : 'border-transparent text-text-muted hover:text-slate-200'}`}
            >
              งานติดตั้ง
            </button>
          )}
          {editingCustomer && (
            <button
              type="button"
              onClick={() => setActiveTab('followup-history')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'followup-history' ? 'border-purple-500 text-purple-400' : 'border-transparent text-text-muted hover:text-slate-200'}`}
            >
              <History className="w-3.5 h-3.5" />
              ประวัติการติดตาม
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1 min-h-[500px]">
          <form id="save-customer-form" onSubmit={handleFormSave}>
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
                      <label className="text-xs font-medium text-text-muted">Customer ID</label>
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
                    <label className="text-xs font-medium text-text-muted">
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
                    <label className="text-xs font-medium text-text-muted">
                      Subdomain / Link <span className="text-rose-400">*</span>
                    </label>
                    <input name="subdomain" defaultValue={editingCustomer?.subdomain} className="input-field" required aria-required="true" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted">ประเภทระบบ</label>
                    <CustomSelect name="product" defaultValue={editingCustomer?.productType || "Dr.Ease"} options={[{ value: "Dr.Ease", label: "Dr.Ease" }, { value: "EasePos", label: "EasePos" }]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted">สถานะการใช้งาน</label>
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
                    <label className="text-xs font-medium text-text-muted">แพ็คเกจ</label>
                    <CustomSelect name="package" defaultValue={editingCustomer?.package || "Standard"} options={[{ value: "Starter", label: "Starter" }, { value: "Standard", label: "Standard" }, { value: "Elite", label: "Elite" }]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted">ชื่อเซลล์ (Sales Name)</label>
                    <input name="salesName" defaultValue={editingCustomer?.salesName} className="input-field" placeholder="ระบุชื่อเซลล์..." />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-medium text-text-muted">หมายเหตุ</label>
                    <textarea name="note" defaultValue={editingCustomer?.note} className="input-field min-h-[80px]" />
                  </div>
                </div>
              </div>

              {/* Branches Tab */}
              <div className={`border-t border-border pt-6 ${activeTab === 'branches' ? 'block' : 'hidden'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    จัดการสาขา ({branchInputs.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-text-main text-xs font-bold transition-all border border-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มสาขา
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 h-[320px] bg-slate-900/40 rounded-xl border border-border-light p-4">
                  {/* Left: Branch List */}
                  <div className="w-full md:w-1/3 flex flex-col border-r border-border-light pr-4">
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {branchInputs.map((branch, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setActiveBranchIndex(idx)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${idx === activeBranchIndex
                            ? "bg-indigo-500/10 border-indigo-500/30 shadow-sm"
                            : "bg-transparent border-transparent hover:bg-bg-hover"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${idx === activeBranchIndex ? "bg-indigo-500 text-white" : "bg-slate-700 text-text-muted"}`}>
                                {idx + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xs font-semibold truncate max-w-[120px] ${idx === activeBranchIndex ? "text-white" : "text-text-muted group-hover:text-slate-200"}`}>
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
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-light">
                          <div>
                            <h4 className="text-sm font-semibold text-white">รายละเอียดสาขา</h4>
                            <p className="text-[10px] text-text-muted">แก้ไขข้อมูลและจัดการสถานะของสาขาที่เลือก</p>
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
                            <label className="text-xs font-medium text-text-muted">ชื่อสาขา (Branch Name)</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
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
                            <label className="text-xs font-medium text-text-muted">สถานะการติดตั้ง (Installation Status)</label>
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
                              <label className="text-xs font-medium text-text-muted">วันที่เริ่มสัญญา (Contract Start)</label>
                              <CustomDatePicker
                                value={branchInputs[activeBranchIndex].contractStart || ""}
                                onChange={handleBranchContractStartChange}
                                placeholder="เลือกวันที่..."
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-text-muted">CS Owner</label>
                              <CustomSelect
                                name={`branchCsOwner-${activeBranchIndex}`}
                                defaultValue={branchInputs[activeBranchIndex].csOwner || ""}
                                onChange={(val) => handleBranchCsOwnerChange(val)}
                                options={[
                                  { value: "", label: "ไม่ระบุ" },
                                  ...users.map(u => ({ value: u.name, label: u.name }))
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                        <MapPin className="w-12 h-12 mb-3" />
                        <p className="text-sm">เลือกสาขาเพื่อแก้ไขรายละเอียด</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Installations Tab */}
              {editingCustomer && (
                <div className={`border-t border-border pt-6 ${activeTab === 'installations' ? 'block' : 'hidden'}`}>
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
                        <div className="text-center py-8 text-text-muted">
                          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">ไม่มีงานติดตั้ง</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {customerInstallations.map((inst) => (
                          <div key={inst.id} className="bg-bg-hover rounded-xl p-3 border border-border-light hover:border-border transition-colors">
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
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text-muted">
                              <span>แจ้งโดย: <span className="text-text-muted">{inst.requestedBy || '-'}</span> • {formatDateTime(inst.requestedAt)}</span>
                              {inst.modifiedBy && (
                                <span>แก้ไขโดย: <span className="text-text-muted">{inst.modifiedBy}</span> • {formatDateTime(inst.modifiedAt)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Follow-up History Tab */}
              {editingCustomer && (
                <div className={`border-t border-border pt-6 ${activeTab === 'followup-history' ? 'block' : 'hidden'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      ประวัติการติดตาม
                    </h3>
                  </div>

                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                    </div>
                  ) : followUpLogs.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">ยังไม่มีประวัติการติดตาม</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {followUpLogs.filter(log => !pendingDeleteIds.has(log.id)).map((log) => {
                        const displayFeedback = pendingEdits.has(log.id) ? pendingEdits.get(log.id) : log.feedback;
                        return (
                        <div key={log.id} className="bg-bg-hover rounded-xl p-3 border border-border-light hover:border-purple-500/30 transition-colors">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-400">
                                Day {log.round}
                              </span>
                              {log.branchName && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-text-muted">
                                  {log.branchName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-muted">
                                {(() => {
                                  const d = new Date(log.completedAt);
                                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                })()}
                              </span>
                              {editingLogId !== log.id && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditLog(log)}
                                    className="p-1 rounded hover:bg-purple-500/20 text-text-muted hover:text-purple-400 transition-colors"
                                    title="แก้ไข feedback"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkDeleteLog(log.id)}
                                    className="p-1 rounded hover:bg-rose-500/20 text-text-muted hover:text-rose-400 transition-colors"
                                    title="ลบรายการ"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {editingLogId === log.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingFeedback}
                                onChange={(e) => setEditingFeedback(e.target.value)}
                                className="input-field w-full text-xs min-h-[60px] resize-none"
                                placeholder="กรอก feedback..."
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 text-[10px] rounded bg-slate-600/50 text-text-muted hover:bg-slate-600 transition-colors"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveLogEdit(log.id)}
                                  className="px-2 py-1 text-[10px] rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  ตกลง
                                </button>
                              </div>
                            </div>
                          ) : displayFeedback ? (
                            <p className="text-xs text-text-muted leading-relaxed">{displayFeedback}</p>
                          ) : (
                            <p className="text-xs text-text-muted opacity-40 italic">ไม่มี feedback</p>
                          )}
                          {log.csOwner && (
                            <div className="mt-2 pt-2 border-t border-border-light">
                              <span className="text-[10px] text-text-muted">โดย: <span className="text-purple-400">{log.csOwner}</span></span>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-light bg-[#1e293b]/50 backdrop-blur-sm shrink-0">
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
