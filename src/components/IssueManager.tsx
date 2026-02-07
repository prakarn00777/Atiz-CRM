"use client";

import React, { useState, useMemo } from "react";
import { Search, AlertCircle } from "lucide-react";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { Customer, Issue } from "@/types";
import IssueRow from "./rows/IssueRow";

interface IssueManagerProps {
    issues: Issue[];
    customers: Customer[];
    onAdd: () => void;
    onEdit: (issue: Issue) => void;
    onDelete: (id: number) => void;
    filterByAssignee?: string;
    title?: string;
}

const IssueManager = React.memo(function IssueManager({ issues, customers: _customers, onAdd, onEdit, onDelete, filterByAssignee, title }: IssueManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [currentPage, setCurrentPage] = useState(1);

    const baseIssues = useMemo(() =>
        filterByAssignee ? issues.filter(i => i.assignedTo === filterByAssignee) : issues
    , [issues, filterByAssignee]);

    const sortedIssues = useMemo(() => {
        const filtered = baseIssues.filter(issue => {
            const matchesSearch =
                issue.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.customerName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
            const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;

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

        return [...filtered].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [baseIssues, searchTerm, statusFilter, severityFilter, dateRange]);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
    const paginatedIssues = sortedIssues.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4 text-text-main">{title || "Issue Reporting"}</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
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

                        <div className="w-[160px]">
                            <CustomDatePicker
                                placeholder="วันที่เริ่มต้น"
                                value={dateRange.start}
                                max={dateRange.end}
                                onChange={(val) => { setDateRange({ ...dateRange, start: val }); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="w-[160px]">
                            <CustomDatePicker
                                placeholder="วันที่สิ้นสุด"
                                value={dateRange.end}
                                min={dateRange.start}
                                onChange={(val) => { setDateRange({ ...dateRange, end: val }); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                            <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                <th className="px-4 py-3 font-semibold w-[4%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[7%] text-center">Id</th>
                                <th className="px-4 py-3 font-semibold w-[30%] text-center">Case Name</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Customer</th>
                                <th className="px-4 py-3 font-semibold w-[7%] text-center">Severity</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[7%] text-center">Type</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Assigned To</th>
                                <th className="px-4 py-3 font-semibold w-[9%] text-center">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[6%] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedIssues.length > 0 ? (
                                paginatedIssues.map((issue, index) => (
                                    <IssueRow
                                        key={issue.id || issue.caseNumber}
                                        issue={issue}
                                        rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
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
                    <div className="px-6 py-4 border-t border-border-light bg-gradient-to-r from-bg-hover to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-text-main">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <div className="h-4 w-px bg-border-light mx-2"></div>
                                <span className="text-xs text-text-muted">
                                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, sortedIssues.length)} จาก {sortedIssues.length} รายการ
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group"
                                    title="หน้าแรก"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main text-xs font-medium group"
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
                                                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-xs">•••</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                                                        : "hover:bg-bg-hover text-text-muted hover:text-text-main hover:scale-105"
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
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main text-xs font-medium group"
                                >
                                    ถัดไป
                                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group"
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
});

export default IssueManager;
