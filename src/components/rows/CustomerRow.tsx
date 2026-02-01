"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, MapPin, Clock, MoreVertical } from "lucide-react";
import { Customer } from "@/types";

interface CustomerRowProps {
  customer: Customer;
  rowNumber: number;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
}

const CustomerRow = React.memo(function CustomerRow({
  customer: c,
  rowNumber,
  onEdit,
  onDelete,
}: CustomerRowProps) {
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
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom, left: rect.right });
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(c);
    setIsMenuOpen(false);
  }, [c, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(c.id);
    setIsMenuOpen(false);
  }, [c.id, onDelete]);

  return (
    <tr className="group hover:bg-bg-hover transition-colors h-14">
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-text-muted opacity-60">{rowNumber}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-mono text-text-muted">
          {c.clientCode || `DE${c.id.toString().padStart(4, "0")}`}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <div className="font-semibold text-text-main text-xs truncate max-w-[150px]" title={c.name}>
            {c.name}
          </div>
          <span
            className={`text-[10px] w-fit px-1.5 rounded mt-1 font-medium ${
              c.productType === "EasePos"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            }`}
          >
            {c.productType || "Dr.Ease"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {c.subdomain ? (
          <a
            href={c.subdomain.startsWith("http") ? c.subdomain : `https://${c.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors max-w-[200px] truncate"
            title={c.subdomain}
          >
            {c.subdomain}
          </a>
        ) : (
          <span className="text-xs text-slate-600">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-text-main font-medium">{c.package}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
              c.usageStatus === "Active"
                ? "bg-emerald-500/10 text-emerald-400"
                : c.usageStatus === "Pending"
                ? "bg-amber-500/10 text-amber-400"
                : c.usageStatus === "Training"
                ? "bg-indigo-500/10 text-indigo-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {c.usageStatus === "Active"
              ? "ใช้งานแล้ว"
              : c.usageStatus === "Pending"
              ? "รอการใช้งาน"
              : c.usageStatus === "Training"
              ? "รอการเทรนนิ่ง"
              : "ยกเลิก"}
          </span>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
              c.installationStatus === "Completed"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-purple-500/10 text-purple-400"
            }`}
          >
            {c.installationStatus}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-hover border border-border-light group-hover:border-indigo-500/30 transition-colors">
          <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-medium text-text-main">
            {1 + (c.branches?.filter((b) => !b.isMain).length || 0)}{" "}
            <span className="text-text-muted text-[10px] ml-0.5">สาขา</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {c.modifiedBy ? (
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-text-muted opacity-50 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-main">{c.modifiedBy}</span>
              <span className="text-[10px] text-text-muted opacity-70">
                {new Date(c.modifiedAt!).toLocaleString("th-TH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-600">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end">
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
                aria-label="ตัวเลือกการจัดการลูกค้า"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 8}px`,
                  left: `${menuPosition.left - 144}px`,
                }}
                className="z-[9999] w-44 py-2 bg-card-bg border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-main hover:bg-bg-hover transition-colors"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  แก้ไขข้อมูล
                </button>
                <div className="my-1 border-t border-border-light" role="separator" />
                <button
                  role="menuitem"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
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

export default CustomerRow;
