"use client";

import React, { useState } from "react";
import { X, Paperclip, ExternalLink, Loader2 } from "lucide-react";
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
  setToast: (toast: { message: string; type: "success" | "error" | "info" } | null) => void;
  setPreviewImage: (image: string | null) => void;
}

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
  setToast,
  setPreviewImage,
}: IssueModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

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
    } catch (error: any) {
      setToast({ message: `Upload error: ${error.message}`, type: "error" });
      return null;
    }
  };

  // Handle file selection and upload
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises: Promise<AttachmentFile | null>[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `ไฟล์ ${file.name} ต้องเป็นรูปภาพเท่านั้น`, type: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: `ไฟล์ ${file.name} ใหญ่เกิน 5MB`, type: "error" });
        return;
      }
      uploadPromises.push(uploadFile(file));
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r): r is AttachmentFile => r !== null);

    if (successfulUploads.length > 0) {
      setSelectedFiles(prev => [...prev, ...successfulUploads]);
      setToast({ message: `อัปโหลดสำเร็จ ${successfulUploads.length} ไฟล์`, type: "success" });
    }

    setIsUploading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl border-indigo-500/20">
        <div className="p-6 border-b border-border-light flex justify-between items-center">
          <h2 id="issue-modal-title" className="text-xl font-bold text-white">
            {editingIssue ? "Edit Issue" : "New Issue"}
          </h2>
          <button onClick={onClose} aria-label="ปิดหน้าต่าง" className="p-2 hover:bg-bg-hover rounded-lg transition-colors">
            <X aria-hidden="true" />
          </button>
        </div>

        {/* Status Indicator Bar - Only show when editing */}
        {editingIssue && (
          <div className="px-6 py-4 bg-bg-hover/50 border-b border-border-light">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Status:</span>

              {/* Clickable Status Flow Buttons - Forward Only */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={editingIssue.status !== "แจ้งเคส"}
                  onClick={() => setModalIssueStatus("แจ้งเคส")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    modalIssueStatus === "แจ้งเคส"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                      : editingIssue.status !== "แจ้งเคส"
                        ? "bg-slate-700/50 text-text-muted cursor-not-allowed border border-slate-600/20"
                        : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  แจ้งเคส
                </button>

                <span className="text-text-muted/70">→</span>

                <button
                  type="button"
                  disabled={editingIssue.status === "เสร็จสิ้น"}
                  onClick={() => setModalIssueStatus("กำลังดำเนินการ")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    modalIssueStatus === "กำลังดำเนินการ"
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                      : editingIssue.status === "เสร็จสิ้น"
                        ? "bg-slate-700/50 text-text-muted cursor-not-allowed border border-slate-600/20"
                        : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                  }`}
                >
                  กำลังดำเนินการ
                </button>

                <span className="text-text-muted/70">→</span>

                <button
                  type="button"
                  onClick={() => setModalIssueStatus("เสร็จสิ้น")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    modalIssueStatus === "เสร็จสิ้น"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <form id="issue-form" onSubmit={onSave} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-muted">Customer</label>
                {selectedCustomer?.subdomain && (
                  <a
                    href={selectedCustomer.subdomain.startsWith('http') ? selectedCustomer.subdomain : `https://${selectedCustomer.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Go to System"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">
                      {selectedCustomer.subdomain.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
              <SearchableCustomerSelect
                customers={customers}
                value={selectedCustomerId}
                onChange={(id, name) => {
                  setSelectedCustomerId(id);
                  setSelectedCustomerName(name);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">
                Subject <span className="text-rose-400">*</span>
              </label>
              <input
                name="title"
                defaultValue={editingIssue?.title}
                className="input-field"
                required
                aria-required="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted">Issue Type</label>
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
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted">Severity</label>
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
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Description</label>
              <textarea
                name="description"
                defaultValue={editingIssue?.description}
                className="input-field min-h-[100px] text-xs py-3 resize-none"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted">Attachments</label>

              {/* Upload Zone */}
              <div
                className={`border-2 border-dashed border-border rounded-xl p-4 text-center transition-all ${isUploading ? 'opacity-50 cursor-wait' : 'hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer'}`}
                onClick={() => !isUploading && document.getElementById('issue-file-input')?.click()}
              >
                <input
                  id="issue-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-col items-center gap-2">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-xs text-indigo-400">กำลังอัปโหลด...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-text-main/80">คลิกเพื่อเลือกรูปภาพหรือลากไฟล์มาวาง</p>
                        <p className="text-[10px] text-text-muted mt-1">รองรับ: รูปภาพเท่านั้น (สูงสุด 5MB ต่อไฟล์)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Preview List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-bg-hover rounded-lg border border-border"
                    >
                      {/* Thumbnail for images */}
                      {file.type.startsWith('image/') ? (
                        <img
                          src={getImageSrc(file)}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-border"
                          onClick={() => setPreviewImage(getImageSrc(file))}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-text-muted">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-main/80 truncate">{file.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.url && <span className="ml-2 text-emerald-400">Uploaded</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`ลบไฟล์ ${file.name}`}
                        className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-rose-400" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border-light flex gap-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button form="issue-form" type="submit" className="btn btn-primary flex-1" disabled={isUploading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
});

export default IssueModal;
