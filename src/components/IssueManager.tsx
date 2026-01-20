"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Edit2, Trash2, Plus, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock, Play, Paperclip, MoreVertical, Filter } from "lucide-react";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { Customer, Issue } from "@/types";

interface IssueManagerProps {
    issues: Issue[];
    customers: Customer[];
    onAdd: () => void;
    onEdit: (issue: Issue) => void;
    onDelete: (id: number) => void;
}

export default function IssueManager({ issues, customers, onAdd, onEdit, onDelete }: IssueManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClose = () => {
            setActiveMenu(null);
            setMenuPosition(null);
        };

        if (activeMenu !== null) {
            window.addEventListener('click', handleClose);
            window.addEventListener('scroll', handleClose, true);
        }

        return () => {
            window.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, true);
        };
    }, [activeMenu]);

    const handleMenuToggle = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        if (activeMenu === id) {
            setActiveMenu(null);
            setMenuPosition(null);
        } else {
            setActiveMenu(id);
            setMenuPosition({ top: rect.bottom, left: rect.right });
        }
    };

    const filteredIssues = issues.filter(issue => {
        const matchesSearch =
            issue.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
        const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;

        // Date Range Filter logic
        let matchesDate = true;
        if (dateRange.start && issue.createdAt) {
            matchesDate = matchesDate && issue.createdAt >= dateRange.start;
        }
        if (dateRange.end && issue.createdAt) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(issue.createdAt) <= endDate;
        }

        return matchesSearch && matchesStatus && matchesSeverity && matchesDate;
    });

    // Sort by createdAt descending (newest first)
    const sortedIssues = [...filteredIssues].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
    const paginatedIssues = sortedIssues.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Issue Reporting</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <CustomSelect
                            options={[
                                { value: "all", label: "สถานะทั้งหมด" },
                                { value: "แจ้งเคส", label: "แจ้งเคส" },
                                { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
                                { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                            className="w-[160px]"
                        />
                        <CustomSelect
                            options={[
                                { value: "all", label: "All Severity" },
                                { value: "Low", label: "Low" },
                                { value: "Medium", label: "Medium" },
                                { value: "High", label: "High" },
                                { value: "Critical", label: "Critical" },
                            ]}
                            value={severityFilter}
                            onChange={(val) => { setSeverityFilter(val); setCurrentPage(1); }}
                            className="w-[160px]"
                        />

                        <div className="flex items-center bg-black/20 border border-white/10 rounded-xl h-10 px-1 shrink-0">
                            <CustomDatePicker
                                placeholder="วันเริ่มต้น"
                                value={dateRange.start}
                                max={dateRange.end}
                                onChange={(val) => { setDateRange({ ...dateRange, start: val }); setCurrentPage(1); }}
                                className="w-[140px] !border-none !bg-transparent !h-full !py-0 shadow-none focus:ring-0"
                            />
                            <span className="text-slate-500 text-xs">-</span>
                            <CustomDatePicker
                                placeholder="วันสิ้นสุด"
                                value={dateRange.end}
                                min={dateRange.start}
                                onChange={(val) => { setDateRange({ ...dateRange, end: val }); setCurrentPage(1); }}
                                className="w-[140px] !border-none !bg-transparent !h-full !py-0 shadow-none focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={onAdd}
                    className="btn btn-primary h-9 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    New Case
                </button>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-4 py-3 font-semibold w-[5%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Case Id</th>
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Case Name</th>
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Customer</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Severity</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Type</th>
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Reported By</th>
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedIssues.length > 0 ? (
                                paginatedIssues.map((issue, index) => (
                                    <tr key={issue.id} className="group hover:bg-white/[0.02] transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-mono text-slate-400">
                                                {issue.caseNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="font-semibold text-slate-200 text-xs truncate" title={issue.title}>
                                                    {issue.title}
                                                </div>
                                                {issue.attachments && issue.attachments.length > 2 && ( // Check for empty JSON string or similar
                                                    <Paperclip className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-slate-300 font-medium">{issue.customerName}</span>
                                                {issue.branchName && (
                                                    <span className="text-[10px] text-slate-500 italic">สาขา: {issue.branchName}</span>
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
                                            <span className="text-xs text-slate-400 whitespace-nowrap">{issue.type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {issue.createdBy ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-medium text-slate-300">{issue.createdBy}</span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(issue.createdAt!).toLocaleString('th-TH', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {issue.modifiedBy ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-medium text-slate-300">{issue.modifiedBy}</span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(issue.modifiedAt!).toLocaleString('th-TH', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, issue.id)}
                                                    className={`p-2 rounded-lg transition-colors ${activeMenu === issue.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {mounted && activeMenu === issue.id && menuPosition && createPortal(
                                                    <div
                                                        style={{
                                                            position: 'fixed',
                                                            top: `${menuPosition.top + 8}px`,
                                                            left: `${menuPosition.left - 144}px`,
                                                        }}
                                                        className="z-[9999] w-36 py-1.5 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => { onEdit(issue); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไขข้อมูล
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={() => { onDelete(issue.id); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            ลบรายการ
                                                        </button>
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="w-12 h-12 text-slate-600" />
                                            <p className="text-sm text-slate-500">ไม่พบข้อมูลเคส</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-slate-300">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <div className="h-4 w-px bg-white/10 mx-2"></div>
                                <span className="text-xs text-slate-400">
                                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredIssues.length)} จาก {filteredIssues.length} รายการ
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-300 group"
                                    title="หน้าแรก"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-300 text-xs font-medium group"
                                >
                                    <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    ก่อนหน้า
                                </button>

                                <div className="flex gap-1">
                                    {(() => {
                                        const pageNumbers = [];
                                        const maxVisible = 5;

                                        if (totalPages <= maxVisible) {
                                            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                for (let i = 1; i <= 4; i++) pageNumbers.push(i);
                                                pageNumbers.push('...');
                                                pageNumbers.push(totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumbers.push(1);
                                                pageNumbers.push('...');
                                                for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
                                            } else {
                                                pageNumbers.push(1);
                                                pageNumbers.push('...');
                                                for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
                                                pageNumbers.push('...');
                                                pageNumbers.push(totalPages);
                                            }
                                        }

                                        return pageNumbers.map((page, idx) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-500 text-xs">•••</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                                                        : "hover:bg-white/5 text-slate-400 hover:text-white hover:scale-105"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ));
                                    })()}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-300 text-xs font-medium group"
                                >
                                    ถัดไป
                                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-300 group"
                                    title="หน้าสุดท้าย"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
