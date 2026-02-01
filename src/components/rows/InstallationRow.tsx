"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Clock, CheckCircle2, User, AlertCircle, Edit2, MoreVertical } from "lucide-react";
import { Customer, Installation } from "@/types";

interface InstallationRowProps {
  installation: Installation;
  rowNumber: number;
  customers: Customer[];
  onSelect: (installation: Installation) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending": return <Clock className="w-4 h-4 text-amber-400" />;
    case "Completed": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

const InstallationRow = React.memo(function InstallationRow({
  installation: inst,
  rowNumber,
  customers,
  onSelect,
}: InstallationRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = () => setIsMenuOpen(false);
    const handleScroll = () => setIsMenuOpen(false);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ top: rect.bottom, left: rect.left });
    }
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(inst);
    setIsMenuOpen(false);
  }, [inst, onSelect]);

  const cust = customers.find(c => c.id === inst.customerId);
  const displayLink = cust?.subdomain || inst.customerLink;

  return (
    <tr className="group hover:bg-bg-hover transition-colors h-14">
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-text-muted opacity-60">{rowNumber}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-semibold text-text-main text-xs truncate max-w-[180px]" title={inst.customerName}>
            {inst.customerName}
          </span>
          <span className="text-[10px] text-text-muted opacity-60 font-mono">ID: {inst.customerId}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
          inst.installationType === "new"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
        }`}>
          {inst.installationType === "new" ? "ลูกค้าใหม่" : "เพิ่มสาขา"}
        </span>
      </td>
      <td className="px-4 py-3">
        {displayLink ? (
          <a
            href={displayLink.startsWith('http') ? displayLink : `https://${displayLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors max-w-[200px] truncate"
            title={displayLink}
          >
            {displayLink}
          </a>
        ) : (
          <span className="text-xs text-slate-500 italic">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(inst.status)} w-[100px]`}>
          {getStatusIcon(inst.status)}
          {inst.status}
        </div>
      </td>
      <td className="px-4 py-3">
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
      <td className="px-4 py-3">
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
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2 relative">
          <button
            onClick={handleMenuToggle}
            aria-label="เปิดเมนูตัวเลือก"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={`p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isMenuOpen
                ? "bg-indigo-500/20 text-indigo-500 dark:text-white"
                : "hover:bg-bg-hover text-text-muted hover:text-text-main"
            }`}
          >
            <MoreVertical className="w-5 h-5" aria-hidden="true" />
          </button>

          {mounted &&
            isMenuOpen &&
            menuPosition &&
            createPortal(
              <div
                role="menu"
                aria-label="ตัวเลือกการจัดการงานติดตั้ง"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 8}px`,
                  left: `${menuPosition.left - 144}px`,
                }}
                className="z-[9999] w-48 py-2 bg-card-bg border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={handleSelect}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-main hover:bg-bg-hover transition-colors"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  แก้ไขรายละเอียด
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
