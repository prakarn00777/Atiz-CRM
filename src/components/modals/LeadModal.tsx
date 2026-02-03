"use client";

import React from "react";
import { X, Plus } from "lucide-react";
import CustomSelect from "../CustomSelect";
import CustomDatePicker from "../CustomDatePicker";
import { Lead } from "@/types";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLead: Lead | null;
  modalLeadDate: string;
  setModalLeadDate: (date: string) => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
}

const LeadModal = React.memo(function LeadModal({
  isOpen,
  onClose,
  editingLead,
  modalLeadDate,
  setModalLeadDate,
  onSave,
}: LeadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl">
        <div className="p-6 border-b border-border-light flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400" aria-hidden="true">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="lead-modal-title" className="text-xl font-bold text-white">
                {editingLead ? "แก้ไขข้อมูลลีด" : "เพิ่มลีดใหม่"}
              </h2>
              <p className="text-xs text-text-muted">กรอกข้อมูลลีดให้ครบถ้วนเพื่อใช้ในการติดตาม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          <form id="lead-form" onSubmit={onSave} className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                เลขที่ลีด (Lead Number) <span className="text-rose-400">*</span>
              </label>
              <input
                name="leadNumber"
                defaultValue={editingLead?.leadNumber || `L${Date.now().toString().slice(-6)}`}
                className="input-field text-sm font-bold text-indigo-400"
                required
                aria-required="true"
                placeholder="L000000"
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Product</label>
              <CustomSelect
                name="product"
                defaultValue={editingLead?.product || "Dr.Ease"}
                options={[
                  { value: "Dr.Ease", label: "Dr.Ease" },
                  { value: "Ease POS", label: "Ease POS" },
                ]}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                ชื่อลูกค้า / คลินิก / ร้าน <span className="text-rose-400">*</span>
              </label>
              <input
                name="customerName"
                defaultValue={editingLead?.customerName}
                className="input-field text-sm font-semibold"
                required
                aria-required="true"
                placeholder="ระบุชื่อลูกค้า"
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                เบอร์โทรศัพท์ <span className="text-rose-400">*</span>
              </label>
              <input
                name="phone"
                defaultValue={editingLead?.phone}
                className="input-field text-sm font-mono"
                required
                aria-required="true"
                placeholder="08X-XXXXXXX"
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                เซลล์ผู้ดูแล (Sales)
              </label>
              <CustomSelect
                name="salesName"
                defaultValue={editingLead?.salesName || "Aoey"}
                options={[
                  { value: "Aoey", label: "Aoey" },
                  { value: "Yo", label: "Yo" },
                ]}
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                ที่มาลีด (Lead Source)
              </label>
              <CustomSelect
                name="source"
                defaultValue={editingLead?.source || "ยิงแอด"}
                options={[
                  { value: "ยิงแอด", label: "ยิงแอด" },
                  { value: "เซลล์หา", label: "เซลล์หา" },
                  { value: "พาร์ทเนอร์", label: "พาร์ทเนอร์" },
                  { value: "บริษัทหา", label: "บริษัทหา" },
                ]}
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                วันที่รับลีด (Received Date)
              </label>
              <CustomDatePicker
                value={modalLeadDate}
                onChange={setModalLeadDate}
                placeholder="เลือกวันที่รับลีด"
                className="w-full"
              />
              <input type="hidden" name="receivedDate" value={modalLeadDate} />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                ประเภทลีด (Lead Type)
              </label>
              <CustomSelect
                name="leadType"
                defaultValue={editingLead?.leadType || "LINE"}
                options={[
                  { value: "LINE", label: "LINE" },
                  { value: "Facebook", label: "Facebook" },
                  { value: "Call", label: "Call" },
                  { value: "ลีดจากสัมนา", label: "ลีดจากสัมนา" },
                  { value: "ลูกค้าเก่า ต่อสัญญา", label: "ลูกค้าเก่า ต่อสัญญา" },
                  { value: "ขบายสัญญาเพิ่ม", label: "ขบายสัญญาเพิ่ม" },
                  { value: "ลีดซ้ำ", label: "ลีดซ้ำ" },
                ]}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">หมายเหตุ (Notes)</label>
              <textarea
                name="notes"
                defaultValue={editingLead?.notes}
                className="input-field text-sm min-h-[100px] resize-none py-3"
                placeholder="เพิ่มเติม..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border-light flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn btn-ghost py-3 rounded-xl font-bold"
          >
            Cancel
          </button>
          <button
            form="lead-form"
            type="submit"
            className="flex-1 btn btn-primary py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            {editingLead ? "Save Changes" : "Create Lead"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default LeadModal;
