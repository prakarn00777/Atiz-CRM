"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock, Play, Paperclip, MoreVertical } from "lucide-react";
import { Issue } from "@/types";

interface IssueRowProps {
  issue: Issue;
  rowNumber: number;
  onEdit: (issue: Issue) => void;
  onDelete: (id: number) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Critical": return "text-rose-400 bg-rose-500/10";
    case "High": return "text-orange-400 bg-orange-500/10";
    case "Medium": return "text-amber-400 bg-amber-500/10";
    case "Low": return "text-emerald-400 bg-emerald-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "Critical": return <AlertCircle className="w-3.5 h-3.5" />;
    case "High": return <AlertTriangle className="w-3.5 h-3.5" />;
    case "Medium": return <AlertTriangle className="w-3.5 h-3.5" />;
    case "Low": return <Info className="w-3.5 h-3.5" />;
    default: return <Info className="w-3.5 h-3.5" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "เสร็จสิ้น": return "text-emerald-400 bg-emerald-500/10";
    case "กำลังดำเนินการ": return "text-indigo-400 bg-indigo-500/10";
    case "แจ้งเคส": return "text-amber-400 bg-amber-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "เสร็จสิ้น": return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "กำลังดำเนินการ": return <Play className="w-3.5 h-3.5" />;
    case "แจ้งเคส": return <Clock className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

const IssueRow = React.memo(function IssueRow({
  issue,
  rowNumber,
  onEdit,
  onDelete,
}: IssueRowProps) {
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
    onEdit(issue);
    setIsMenuOpen(false);
  }, [issue, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(issue.id);
    setIsMenuOpen(false);
  }, [issue.id, onDelete]);

  return (
    <tr className="group hover:bg-bg-hover transition-colors h-14">
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-text-muted opacity-60">{rowNumber}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-mono text-text-muted">
          {issue.caseNumber}
        </span>
      </td>
      <td className="px-4 py-3 text-left">
        <div className="flex items-center justify-start gap-2">
          <div className="font-normal text-text-main text-xs truncate max-w-[450px]" title={issue.title}>
            {issue.title}
          </div>
          {issue.attachments && (typeof issue.attachments === 'string' ? issue.attachments.length > 2 : issue.attachments.length > 0) && (
            <Paperclip className="w-3 h-3 text-text-muted opacity-50 flex-shrink-0" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center max-h-[2.5rem] overflow-hidden">
          <span className="text-xs text-text-main font-medium line-clamp-1">{issue.customerName}</span>
          {issue.branchName && (
            <span className="text-[10px] text-text-muted opacity-70 italic line-clamp-1">สาขา: {issue.branchName}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${getSeverityColor(issue.severity)}`}>
          {getSeverityIcon(issue.severity)}
          {issue.severity}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusColor(issue.status)}`}>
          {getStatusIcon(issue.status)}
          {issue.status}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-text-muted whitespace-nowrap">{issue.type}</span>
      </td>
      <td className="px-4 py-3 text-center">
        {issue.assignedTo ? (
          <span className="text-xs font-medium text-indigo-400">{issue.assignedTo}</span>
        ) : (
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {issue.modifiedBy ? (
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-text-main">{issue.modifiedBy}</span>
            <span className="text-[10px] text-text-muted opacity-60">
              {new Date(issue.modifiedAt!).toLocaleString('th-TH', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex justify-center">
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
                aria-label="ตัวเลือกการจัดการเคส"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 8}px`,
                  left: `${menuPosition.left - 144}px`,
                }}
                className="z-[9999] w-44 py-2 bg-card-bg border border-border-light rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:bg-bg-hover hover:text-text-main transition-colors"
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

export default IssueRow;
