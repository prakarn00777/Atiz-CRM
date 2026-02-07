"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, ExternalLink, Loader2, Upload, Clock, User, CheckCircle2, Eye, UserCheck, FileText } from "lucide-react";
import CustomSelect from "../CustomSelect";
import SearchableCustomerSelect from "../SearchableCustomerSelect";
import { Customer, Issue } from "@/types";

// Attachment type supports both base64 (data) and URL
export type AttachmentFile = { name: string; type: string; size: number; data?: string; url?: string };

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingIssue: Issue | null;
  customers: Customer[];
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  selectedCustomerName: string;
  setSelectedCustomerName: (name: string) => void;
  selectedFiles: AttachmentFile[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<AttachmentFile[]>>;
  modalIssueStatus: "แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น";
  setModalIssueStatus: (status: "แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น") => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving?: boolean;
  onAssign?: (issue: Issue) => void;
  currentUser?: string;
  setToast: (toast: { message: string; type: "success" | "error" | "info" } | null) => void;
  setPreviewImage: (image: string | null) => void;
}

// Format date to Thai-friendly string
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateStr; }
};

const IssueModal = React.memo(function IssueModal({
  isOpen,
  onClose,
  editingIssue,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  selectedCustomerName,
  setSelectedCustomerName,
  selectedFiles,
  setSelectedFiles,
  modalIssueStatus,
  setModalIssueStatus,
  onSave,
  isSaving = false,
  onAssign,
  currentUser,
  setToast,
  setPreviewImage,
}: IssueModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Read-only mode: completed issues can only be viewed
  const isReadOnly = editingIssue?.status === "เสร็จสิ้น";

  // Auto-focus Subject field on open (only for new issues)
  useEffect(() => {
    if (isOpen && !editingIssue) {
      const timer = setTimeout(() => titleInputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingIssue]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const isBusy = isUploading || isSaving;
  const canAssign = !!editingIssue && editingIssue.status === "แจ้งเคส" && !editingIssue.assignedTo && !!onAssign && !!currentUser;

  // Get image source (supports both url and data)
  const getImageSrc = (file: AttachmentFile) => file.url || file.data || '';

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<AttachmentFile | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        return {
          name: result.data.name,
          type: result.data.type,
          size: result.data.size,
          url: result.data.url,
        };
      } else {
        setToast({ message: `Upload failed: ${result.error}`, type: "error" });
        return null;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setToast({ message: `Upload error: ${message}`, type: "error" });
      return null;
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) return;

    setIsUploading(true);

    // Filter valid files first
    const allowedTypes = ['image/', 'application/pdf'];
    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.some(t => file.type.startsWith(t))) {
        setToast({ message: `ไฟล์ ${file.name} รองรับเฉพาะรูปภาพและ PDF`, type: "error" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: `ไฟล์ ${file.name} ใหญ่เกิน 5MB`, type: "error" });
        return false;
      }
      return true;
    });

    // Use allSettled so one failure doesn't kill all uploads
    const results = await Promise.allSettled(validFiles.map(f => uploadFile(f)));
    const successfulUploads = results
      .filter((r): r is PromiseFulfilledResult<AttachmentFile | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((r): r is AttachmentFile => r !== null);

    if (successfulUploads.length > 0) {
      setSelectedFiles(prev => [...prev, ...successfulUploads]);
      setToast({ message: `อัปโหลดสำเร็จ ${successfulUploads.length} ไฟล์`, type: "success" });
    }

    setIsUploading(false);
  };

  // Clipboard paste handler — only intercepts images, lets text paste normally
  const handlePaste = (e: React.ClipboardEvent) => {
    if (isReadOnly || isUploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    // Only intercept if clipboard has images — text paste flows normally
    if (imageFiles.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      imageFiles.forEach(f => dt.items.add(f));
      handleFileSelect(dt.files);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isReadOnly) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!isReadOnly) handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      onPaste={handlePaste}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden="true" />
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl rounded-2xl border border-indigo-500/20 animate-in slide-in-from-bottom-3 zoom-in-95 duration-300"
        style={{ backgroundColor: 'var(--modal-bg)' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-light flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isReadOnly ? 'bg-emerald-500/15' : 'bg-indigo-500/15'}`}>
              {isReadOnly ? <Eye className="w-4 h-4 text-emerald-600" /> : <Paperclip className="w-4 h-4 text-indigo-500" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="issue-modal-title" className="text-base font-bold text-text-main">
                  {isReadOnly ? "ดูเคส" : editingIssue ? "แก้ไขเคส" : "สร้างเคสใหม่"}
                </h2>
                {editingIssue?.caseNumber && (
                  <span className="text-[11px] text-indigo-500 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {editingIssue.caseNumber}
                  </span>
                )}
              </div>
              {editingIssue && (editingIssue.createdAt || editingIssue.modifiedAt) && (
                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                  {editingIssue.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      สร้าง: {formatDate(editingIssue.createdAt)}
                      {editingIssue.createdBy && <span className="opacity-60">โดย {editingIssue.createdBy}</span>}
                    </span>
                  )}
                  {editingIssue.modifiedAt && editingIssue.modifiedAt !== editingIssue.createdAt && (
                    <span className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      แก้ไข: {formatDate(editingIssue.modifiedAt)}
                      {editingIssue.modifiedBy && <span className="opacity-60">โดย {editingIssue.modifiedBy}</span>}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isReadOnly && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                เสร็จสิ้น
              </span>
            )}
            <button onClick={onClose} aria-label="ปิดหน้าต่าง" className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-muted hover:text-text-main">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Status Indicator Bar - Only show when editing (not read-only) */}
        {editingIssue && !isReadOnly && (
          <div className="px-5 py-2.5 bg-bg-hover/30 border-b border-border-light">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status</span>

              {/* Clickable Status Flow Buttons - Forward Only */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={editingIssue.status !== "แจ้งเคส"}
                  onClick={() => setModalIssueStatus("แจ้งเคส")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    modalIssueStatus === "แจ้งเคส"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                      : editingIssue.status !== "แจ้งเคส"
                        ? "bg-bg-hover text-text-muted cursor-not-allowed border border-border-light"
                        : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  แจ้งเคส
                </button>

                <span className="text-text-muted/40 text-lg">›</span>

                <button
                  type="button"
                  disabled={editingIssue.status === "เสร็จสิ้น"}
                  onClick={() => setModalIssueStatus("กำลังดำเนินการ")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    modalIssueStatus === "กำลังดำเนินการ"
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                      : editingIssue.status === "เสร็จสิ้น"
                        ? "bg-bg-hover text-text-muted cursor-not-allowed border border-border-light"
                        : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20"
                  }`}
                >
                  กำลังดำเนินการ
                </button>

                <span className="text-text-muted/40 text-lg">›</span>

                <button
                  type="button"
                  onClick={() => setModalIssueStatus("เสร็จสิ้น")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    modalIssueStatus === "เสร็จสิ้น"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                      : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}


        <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar">
          <form id="issue-form" onSubmit={isReadOnly ? (e) => e.preventDefault() : onSave} className="space-y-5">
            {/* Customer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</label>
                {selectedCustomer?.subdomain && (
                  <a
                    href={selectedCustomer.subdomain.startsWith('http') ? selectedCustomer.subdomain : `https://${selectedCustomer.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Go to System"
                    className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">
                      {selectedCustomer.subdomain.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
              {isReadOnly ? (
                <div className="input-field flex items-center opacity-70 cursor-default">
                  {selectedCustomer ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-indigo-500">DE{selectedCustomer.id.toString().padStart(4, "0")}</span>
                      <span className="text-text-muted">-</span>
                      <span className="text-text-main/90">{selectedCustomer.name}</span>
                    </span>
                  ) : <span className="text-text-muted">-</span>}
                </div>
              ) : (
                <SearchableCustomerSelect
                  customers={customers}
                  value={selectedCustomerId}
                  onChange={(id, name) => {
                    setSelectedCustomerId(id);
                    setSelectedCustomerName(name);
                  }}
                />
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Subject {!isReadOnly && <span className="text-rose-400">*</span>}
              </label>
              <input
                ref={titleInputRef}
                name="title"
                defaultValue={editingIssue?.title}
                className="input-field"
                required={!isReadOnly}
                readOnly={isReadOnly}
                aria-required={!isReadOnly}
                tabIndex={isReadOnly ? -1 : undefined}
                style={isReadOnly ? { opacity: 0.7, cursor: 'default' } : undefined}
              />
            </div>

            {/* Type + Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Issue Type</label>
                {isReadOnly ? (
                  <div className="input-field flex items-center opacity-70 cursor-default">
                    <span className="text-text-main/90">{editingIssue?.type || '-'}</span>
                  </div>
                ) : (
                  <CustomSelect
                    name="type"
                    defaultValue={editingIssue?.type || "Bug Report"}
                    options={[
                      { value: "Bug Report", label: "Bug Report" },
                      { value: "Data Request", label: "Data Request" },
                      { value: "System Modification", label: "System Modification" },
                      { value: "New Requirement", label: "New Requirement" },
                    ]}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Severity</label>
                {isReadOnly ? (
                  <div className="input-field flex items-center opacity-70 cursor-default">
                    <span className="text-text-main/90">{editingIssue?.severity || '-'}</span>
                  </div>
                ) : (
                  <CustomSelect
                    name="severity"
                    defaultValue={editingIssue?.severity || "Low"}
                    options={[
                      { value: "Low", label: "Low" },
                      { value: "Medium", label: "Medium" },
                      { value: "High", label: "High" },
                      { value: "Critical", label: "Critical" },
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                defaultValue={editingIssue?.description}
                placeholder={isReadOnly ? undefined : "อธิบายรายละเอียดของปัญหา..."}
                className="input-field min-h-[140px] py-3 resize-y"
                readOnly={isReadOnly}
                tabIndex={isReadOnly ? -1 : undefined}
                style={isReadOnly ? { opacity: 0.7, cursor: 'default', resize: 'none' } : undefined}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Attachments</label>

              {/* Upload Zone - hide in read-only mode */}
              {!isReadOnly && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl text-center transition-colors duration-200 cursor-pointer group
                    ${selectedFiles.length > 0 ? 'p-3' : 'p-6'}
                    ${isDragOver
                      ? 'border-2 border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : 'border-2 border-dashed border-border hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]'
                    }
                    ${isUploading ? 'opacity-60 cursor-wait pointer-events-none' : ''}
                  `}
                  onClick={() => !isUploading && document.getElementById('issue-file-input')?.click()}
                >
                  <input
                    id="issue-file-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      handleFileSelect(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <div className={`flex items-center gap-3 ${selectedFiles.length > 0 ? 'flex-row justify-center' : 'flex-col'}`}>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-xs font-medium text-indigo-500">กำลังอัปโหลด...</p>
                      </>
                    ) : selectedFiles.length > 0 ? (
                      <>
                        <Upload className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs font-medium text-text-muted group-hover:text-indigo-500 transition-colors">
                          เพิ่มรูปภาพ
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors duration-200">
                          <Upload className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-main/80">
                            {isDragOver ? 'วางไฟล์ได้เลย!' : 'คลิกเพื่อเลือกไฟล์ หรือลากมาวาง'}
                          </p>
                          <p className="text-[11px] text-text-muted mt-1">รองรับ: รูปภาพ, PDF (สูงสุด 5MB) · Ctrl+V เพื่อวางรูปจาก clipboard</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* File Preview List */}
              {selectedFiles.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={file.url || file.name + idx}
                      className="flex items-center gap-3 p-3 bg-bg-hover/50 rounded-xl border border-border-light hover:border-indigo-500/20 hover:bg-bg-hover transition-colors duration-150 group/file"
                    >
                      {/* Thumbnail for images, icon for PDF/other */}
                      {file.type.startsWith('image/') ? (
                        <img
                          src={getImageSrc(file)}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border-light group-hover/file:border-indigo-500/30"
                          onClick={() => setPreviewImage(getImageSrc(file))}
                        />
                      ) : file.type === 'application/pdf' ? (
                        <a
                          href={file.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 bg-rose-500/10 rounded-lg flex items-center justify-center border border-border-light group-hover/file:border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                          title="เปิด PDF"
                        >
                          <FileText className="w-5 h-5 text-rose-500" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 bg-bg-hover rounded-lg flex items-center justify-center text-[11px] font-bold text-text-muted border border-border-light">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-main/80 truncate">{file.name}</p>
                        <p className="text-[11px] text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.url && <span className="ml-2 text-emerald-600 font-medium">Uploaded</span>}
                        </p>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label={`ลบไฟล์ ${file.name}`}
                          className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors text-rose-400/50 hover:text-rose-400"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : isReadOnly ? (
                <p className="text-xs text-text-muted/60 py-2">ไม่มีไฟล์แนบ</p>
              ) : null}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-light flex gap-3">
          {isReadOnly ? (
            <button onClick={onClose} className="btn btn-primary flex-1">
              ปิด
            </button>
          ) : (
            <>
              {canAssign && (
                <button
                  type="button"
                  onClick={() => onAssign!(editingIssue!)}
                  className="btn flex-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  รับเคส
                </button>
              )}

              <button form="issue-form" type="submit" className="btn btn-primary flex-1" disabled={isBusy}>
                {isSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังบันทึก...</>
                ) : isUploading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังอัปโหลด...</>
                ) : (
                  'บันทึก'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default IssueModal;
