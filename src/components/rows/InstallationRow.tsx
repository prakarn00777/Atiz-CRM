"use client";

import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { Clock, CheckCircle2, User, AlertCircle, Eye, Trash2, MoreVertical, Building2, MapPin } from "lucide-react";
import { Customer, Installation } from "@/types";

interface InstallationRowProps {
  installation: Installation;
  rowNumber: number;
  customers: Customer[];
  onSelect: (installation: Installation) => void;
  onDelete: (id: number) => void;
  isMenuOpen: boolean;
  menuPosition: { top: number; left: number } | null;
  onToggleMenu: (id: number, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending": return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    case "Completed": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    default: return <AlertCircle className="w-3.5 h-3.5 text-text-muted" />;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default: return "bg-bg-hover text-text-muted border-border-light";
  }
};

const InstallationRow = React.memo(function InstallationRow({
  installation: inst,
  rowNumber,
  customers,
  onSelect,
  onDelete,
  isMenuOpen,
  menuPosition,
  onToggleMenu,
  onCloseMenu,
}: InstallationRowProps) {

  const handleToggle = useCallback((e: React.MouseEvent) => {
    onToggleMenu(inst.id, e);
  }, [inst.id, onToggleMenu]);

  const handleSelect = useCallback(() => {
    onSelect(inst);
    onCloseMenu();
  }, [inst, onSelect, onCloseMenu]);

  const handleDelete = useCallback(() => {
    onDelete(inst.id);
    onCloseMenu();
  }, [inst.id, onDelete, onCloseMenu]);

  const cust = customers.find(c => c.id === inst.customerId);
  const displayLink = cust?.subdomain || inst.customerLink;

  return (
    <tr className="group hover:bg-bg-hover transition-colors h-14">
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-text-muted opacity-60">{rowNumber}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col">
          <span className="font-semibold text-text-main text-xs truncate max-w-[180px]" title={inst.customerName}>
            {inst.customerName}
          </span>
          <span className="text-[10px] text-text-muted opacity-60 font-mono">ID: {inst.customerId}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {inst.installationType === "new" ? (
            <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          )}
          <span className="text-xs text-text-main truncate max-w-[140px]" title={inst.installationType === "new" ? "สำนักงานใหญ่" : (inst.branchName || "-")}>
            {inst.installationType === "new" ? "สำนักงานใหญ่" : (inst.branchName || "-")}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
          inst.installationType === "new"
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            : "bg-sky-500/10 text-sky-500 border border-sky-500/20"
        }`}>
          {inst.installationType === "new" ? "ลูกค้าใหม่" : "เพิ่มสาขา"}
        </span>
      </td>
      <td className="px-3 py-3">
        {displayLink ? (
          <a
            href={displayLink.startsWith('http') ? displayLink : `https://${displayLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-indigo-500 hover:text-indigo-600 hover:underline transition-colors max-w-[200px] truncate"
            title={displayLink}
          >
            {displayLink}
          </a>
        ) : (
          <span className="text-xs text-text-muted italic">-</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(inst.status)} w-[100px]`}>
          {getStatusIcon(inst.status)}
          {inst.status}
        </div>
      </td>
      <td className="px-3 py-3">
        {inst.requestedBy ? (
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-text-muted opacity-50 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-main">{inst.requestedBy}</span>
              <span className="text-[10px] text-text-muted opacity-70">
                {new Date(inst.requestedAt).toLocaleString('th-TH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-text-muted opacity-50">-</span>
        )}
      </td>
      <td className="px-3 py-3">
        {inst.modifiedBy ? (
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-text-muted opacity-50 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-main">{inst.modifiedBy}</span>
              <span className="text-[10px] text-text-muted opacity-70">
                {new Date(inst.modifiedAt!).toLocaleString('th-TH', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-text-muted opacity-50">-</span>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex justify-end relative">
          <button
            onClick={handleToggle}
            aria-label="เปิดเมนูตัวเลือก"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={`p-1.5 rounded-lg transition-colors ${
              isMenuOpen
                ? "bg-indigo-500/20 text-indigo-500"
                : "hover:bg-bg-hover text-text-muted hover:text-text-main opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>

          {isMenuOpen && menuPosition &&
            createPortal(
              <div
                role="menu"
                aria-label="ตัวเลือกการจัดการงานติดตั้ง"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 8}px`,
                  left: `${menuPosition.left - 144}px`,
                  backgroundColor: 'var(--modal-bg)',
                }}
                className="z-[9999] w-48 py-1.5 border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={handleSelect}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-main hover:bg-bg-hover transition-colors"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  ดูรายละเอียด
                </button>
                <button
                  role="menuitem"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-bg-hover transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  ลบรายการ
                </button>
              </div>,
              document.body
            )}
        </div>
      </td>
    </tr>
  );
});

export default InstallationRow;
