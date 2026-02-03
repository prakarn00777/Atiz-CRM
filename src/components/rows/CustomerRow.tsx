"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, Clock, MoreVertical } from "lucide-react";
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
      {/* No. */}
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-text-muted opacity-60">{rowNumber}</span>
      </td>
      {/* ID */}
      <td className="px-3 py-3 text-center">
        <span className="text-xs font-mono text-text-muted">
          {c.clientCode || `DE${c.id.toString().padStart(4, "0")}`}
        </span>
      </td>
      {/* Name */}
      <td className="px-3 py-3">
        <div className="text-text-main text-xs truncate max-w-[140px]" title={c.name}>
          {c.name}
        </div>
      </td>
      {/* Subdomain */}
      <td className="px-3 py-3">
        {c.subdomain ? (
          <a
            href={c.subdomain.startsWith("http") ? c.subdomain : `https://${c.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors max-w-[220px] truncate"
            title={c.subdomain}
          >
            {c.subdomain}
          </a>
        ) : (
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      {/* Product Type */}
      <td className="px-3 py-3 text-center">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            c.productType === "EasePos"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-indigo-500/10 text-indigo-400"
          }`}
        >
          {c.productType || "Dr.Ease"}
        </span>
      </td>
      {/* Package */}
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-text-main font-medium">{c.package}</span>
      </td>
      {/* Usage Status */}
      <td className="px-3 py-3 text-center">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
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
            ? "รอใช้งาน"
            : c.usageStatus === "Training"
            ? "เทรนนิ่ง"
            : "ยกเลิก"}
        </span>
      </td>
      {/* Installation Status */}
      <td className="px-3 py-3 text-center">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            c.installationStatus === "Completed"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {c.installationStatus === "Completed" ? "Completed" : "Pending"}
        </span>
      </td>
      {/* Modified By */}
      <td className="px-3 py-3">
        {c.modifiedBy ? (
          <div className="flex items-start gap-1.5">
            <Clock className="w-3 h-3 text-text-muted opacity-50 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-text-main truncate max-w-[80px]">{c.modifiedBy}</span>
              <span className="text-[9px] text-text-muted opacity-70">
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
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      {/* Actions */}
      <td className="px-3 py-3 text-right">
        <div className="flex justify-end">
          <button
            onClick={handleMenuToggle}
            aria-label="เปิดเมนูตัวเลือก"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={`p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-main hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  แก้ไขข้อมูล
                </button>
                <div className="my-1 border-t border-border-light" role="separator" />
                <button
                  role="menuitem"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
