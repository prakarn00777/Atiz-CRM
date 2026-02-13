"use client";

import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock, Play, Paperclip, MoreVertical } from "lucide-react";
import { Issue } from "@/types";

interface IssueRowProps {
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (id: number) => void;
  isMenuOpen: boolean;
  menuPosition: { top: number; left: number } | null;
  onToggleMenu: (issueId: number, position: { top: number; left: number }) => void;
  onCloseMenu: () => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "Critical": return "text-rose-500 bg-rose-500/10";
    case "High": return "text-orange-500 bg-orange-500/10";
    case "Medium": return "text-amber-600 bg-amber-500/10";
    case "Low": return "text-emerald-600 bg-emerald-500/10";
    default: return "text-slate-500 bg-slate-500/10";
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
    case "เสร็จสิ้น": return "text-emerald-600 bg-emerald-500/10";
    case "กำลังดำเนินการ": return "text-indigo-500 bg-indigo-500/10";
    case "แจ้งเคส": return "text-amber-600 bg-amber-500/10";
    default: return "text-slate-500 bg-slate-500/10";
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

const getTypeColor = (type: string) => {
  switch (type) {
    case "Bug Report": return "text-rose-500 bg-rose-500/10";
    case "Data Request": return "text-sky-500 bg-sky-500/10";
    case "System Modification": return "text-purple-500 bg-purple-500/10";
    default: return "text-text-muted bg-bg-hover";
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const IssueRow = React.memo(function IssueRow({
  issue,
  onEdit,
  onDelete,
  isMenuOpen,
  menuPosition,
  onToggleMenu,
  onCloseMenu,
}: IssueRowProps) {
  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onToggleMenu(issue.id, { top: rect.bottom, left: rect.right });
  }, [issue.id, onToggleMenu]);

  const handleEdit = useCallback(() => {
    onEdit(issue);
    onCloseMenu();
  }, [issue, onEdit, onCloseMenu]);

  const handleDelete = useCallback(() => {
    onDelete(issue.id);
    onCloseMenu();
  }, [issue.id, onDelete, onCloseMenu]);

  return (
    <tr className="group hover:bg-bg-hover transition-colors h-14">
      {/* Case ID */}
      <td className="px-3 py-3 text-center">
        <span className="text-xs font-mono text-text-muted">
          {issue.caseNumber}
        </span>
      </td>
      {/* Case Name + Type tag + Attachment icon */}
      <td className="px-3 py-3 text-left">
        <div className="flex items-start gap-2">
          <div className="font-normal text-text-main text-xs line-clamp-2 min-w-0" title={issue.title}>
            {issue.title}
          </div>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap flex-shrink-0 ${getTypeColor(issue.type)}`}>
            {issue.type === "Bug Report" ? "Bug" : issue.type === "Data Request" ? "Data" : issue.type === "System Modification" ? "Mod" : issue.type}
          </span>
          {issue.attachments && (typeof issue.attachments === 'string' ? issue.attachments.length > 2 : issue.attachments.length > 0) && (
            <Paperclip className="w-3 h-3 text-text-muted opacity-50 flex-shrink-0" />
          )}
        </div>
      </td>
      {/* Customer */}
      <td className="px-3 py-3 text-center">
        <div className="flex flex-col items-center max-h-[2.5rem] overflow-hidden">
          <span className="text-xs text-text-main font-medium line-clamp-1">{issue.customerName}</span>
          {issue.branchName && (
            <span className="text-[10px] text-text-muted opacity-70 italic line-clamp-1">สาขา: {issue.branchName}</span>
          )}
        </div>
      </td>
      {/* Severity */}
      <td className="px-3 py-3 text-center">
        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold ${getSeverityColor(issue.severity).split(' ')[0]}`}>
          {getSeverityIcon(issue.severity)}
          {issue.severity}
        </div>
      </td>
      {/* Status */}
      <td className="px-3 py-3 text-center">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusColor(issue.status)}`}>
          {getStatusIcon(issue.status)}
          {issue.status}
        </div>
      </td>
      {/* Assigned To */}
      <td className="px-3 py-3 text-center">
        {issue.assignedTo ? (
          <span className="text-xs font-medium text-indigo-500">{issue.assignedTo}</span>
        ) : (
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      {/* Created At */}
      <td className="px-3 py-3 text-center">
        {issue.createdAt ? (
          <div className="flex flex-col items-center">
            {issue.createdBy && <span className="text-xs font-medium text-text-main truncate max-w-[80px]">{issue.createdBy}</span>}
            <span className="text-[10px] text-text-muted opacity-60">
              {formatDate(issue.createdAt)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">-</span>
        )}
      </td>
      {/* Actions */}
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center">
          <button
            onClick={handleMenuToggle}
            aria-label="เปิดเมนูตัวเลือก"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isMenuOpen
                ? "bg-indigo-500/20 text-indigo-500 dark:text-white"
                : "hover:bg-bg-hover text-text-muted hover:text-text-main"
            }`}
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>

          {isMenuOpen &&
            menuPosition &&
            createPortal(
              <div
                role="menu"
                aria-label="ตัวเลือกการจัดการเคส"
                style={{
                  position: "fixed",
                  top: `${menuPosition.top + 8}px`,
                  left: `${menuPosition.left - 144}px`,
                  backgroundColor: 'var(--modal-bg)',
                }}
                className="z-[9999] w-44 py-2 border border-border-light rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:bg-bg-hover hover:text-text-main transition-colors"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  ดูรายละเอียด
                </button>
                <div className="my-1 border-t border-border-light" role="separator" />
                <button
                  role="menuitem"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
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
