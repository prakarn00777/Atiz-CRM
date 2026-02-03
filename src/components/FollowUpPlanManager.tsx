"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Customer, FollowUpStatus } from "@/types";

// Extended FollowUpRound with contractStart
interface FollowUpRound {
    id: number;
    customerId: number;
    customerName: string;
    branchName: string;
    round: 7 | 14 | 30 | 60 | 90;
    dueDate: string;
    contractStart: string;
    csOwner: string;
    status: FollowUpStatus;
}

interface FollowUpPlanManagerProps {
    customers: Customer[];
    onUpdateStatus?: (roundId: number, status: FollowUpStatus) => void;
}

const FollowUpPlanManager = React.memo(function FollowUpPlanManager({ customers, onUpdateStatus }: FollowUpPlanManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "overdue" | "all">("today");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Helper to determine round based on days used
    const getRoundFromDaysUsed = (daysUsed: number): 7 | 14 | 30 | 60 | 90 => {
        if (daysUsed >= 90) return 90;
        if (daysUsed >= 60) return 60;
        if (daysUsed >= 30) return 30;
        if (daysUsed >= 14) return 14;
        return 7;
    };

    // Helper to calculate days used from contract start
    const getDaysUsed = (contractStart: string) => {
        const start = new Date(contractStart);
        const today = new Date();
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Generate Follow-up rounds based on customers' contract start dates
    const followUpQueue: FollowUpRound[] = useMemo(() => {
        const queue: FollowUpRound[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        customers.forEach(customer => {
            if (customer.usageStatus === "Canceled") return;

            // Iterate through branches (if no branches, treat customer as one virtual branch)
            const branchList = customer.branches && customer.branches.length > 0
                ? customer.branches
                : [{ name: "สำนักงานใหญ่", isMain: true }];

            branchList.forEach(branch => {
                const branchContractStart = branch.contractStart || customer.contractStart;
                if (!branchContractStart) return;

                const startDate = new Date(branchContractStart);
                startDate.setHours(0, 0, 0, 0);

                // Calculate days used
                const diffTime = today.getTime() - startDate.getTime();
                const daysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // Determine current round based on days used
                const currentRound = getRoundFromDaysUsed(daysUsed);

                // Calculate due date for this round
                const dueDate = new Date(startDate);
                dueDate.setDate(startDate.getDate() + currentRound);
                dueDate.setHours(0, 0, 0, 0);

                // Determine status
                let status: FollowUpStatus = "Pending";
                if (daysUsed >= currentRound) {
                    // Already passed the round day
                    if (daysUsed === currentRound) {
                        status = "Calling"; // Exactly on the round day
                    } else {
                        status = "Overdue"; // Passed the round day
                    }
                } else if (dueDate.getTime() === today.getTime()) {
                    status = "Calling";
                }

                queue.push({
                    id: (customer.id * 100000) + (Math.abs(branch.name.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 1000) * 100 + currentRound,
                    customerId: customer.id,
                    customerName: customer.name,
                    branchName: branch.name,
                    round: currentRound,
                    dueDate: dueDate.toISOString(),
                    contractStart: branchContractStart,
                    csOwner: branch.csOwner || customer.csOwner || "",
                    status: status
                });
            });
        });

        return queue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [customers]);

    const filteredQueue = useMemo(() => {
        const milestones = [7, 14, 30, 60, 90];

        // Reset page when filters change
        setCurrentPage(1);

        const filtered = followUpQueue.filter(item => {
            const daysUsed = getDaysUsed(item.contractStart);
            const matchesSearch = item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.branchName.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            // Today: ลูกค้าที่ใช้งานครบพอดี 7, 14, 30, 60, 90 วัน
            if (activeTab === "today") return milestones.includes(daysUsed);
            // Overdue: ผ่าน milestone แล้วแต่ยังไม่ครบ milestone ถัดไป
            if (activeTab === "overdue") {
                const currentMilestone = milestones.find(m => daysUsed < m) || 90;
                const prevMilestone = milestones[milestones.indexOf(currentMilestone) - 1] || 7;
                return daysUsed > prevMilestone && !milestones.includes(daysUsed);
            }
            // Upcoming: ยังไม่ถึง milestone แรก (day 7)
            if (activeTab === "upcoming") return daysUsed < 7 && daysUsed >= 0;

            return true;
        });

        // Sort by days used (ascending - lowest first)
        return filtered.sort((a, b) => {
            const daysA = getDaysUsed(a.contractStart);
            const daysB = getDaysUsed(b.contractStart);
            return daysA - daysB;
        });
    }, [followUpQueue, activeTab, searchTerm]);

    const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
    const paginatedQueue = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredQueue.slice(start, start + itemsPerPage);
    }, [filteredQueue, currentPage, itemsPerPage]);

    const getStatusIcon = (status: FollowUpStatus) => {
        switch (status) {
            case "Completed": return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300/70" />;
            case "Calling": return <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-300/70 animate-pulse" />;
            case "Overdue": return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-300/70" />;
            default: return <Clock className="w-4 h-4 text-text-muted opacity-60" />;
        }
    };

    const getStatusStyle = (status: FollowUpStatus) => {
        switch (status) {
            case "Completed": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300/70 border-emerald-500/20";
            case "Calling": return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300/70 border-indigo-500/20";
            case "Overdue": return "bg-rose-500/10 text-rose-600 dark:text-rose-300/70 border-rose-500/20";
            default: return "bg-slate-500/10 text-slate-600 dark:text-slate-300/70 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 pr-0 md:pr-48">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 text-text-main">Follow-up Plan</h1>
                    <p className="text-text-muted text-sm">แผนการโทรติดตามลูกค้า (7, 14, 30, 60, 90 วัน)</p>
                </div>

                <div className="flex items-center gap-3 bg-bg-hover border border-border-light p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("today")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setActiveTab("overdue")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'overdue' ? 'bg-rose-500 text-white shadow-lg' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}
                    >
                        Overdue
                    </button>
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-bg-hover border border-border text-text-main shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}
                    >
                        All Plan
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อลูกค้าหรือสาขา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                </div>
                <div className="text-xs text-text-muted bg-bg-hover px-3 py-1.5 rounded-lg border border-border-light">
                    📅 วันที่ติดตาม = วันเริ่มสัญญา + จำนวนวัน (7, 14, 30, 60, 90)
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                            <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                <th className="px-3 py-3 font-semibold w-[4%] text-center">No.</th>
                                <th className="px-3 py-3 font-semibold">Customer</th>
                                <th className="px-3 py-3 font-semibold">Owner</th>
                                <th className="px-3 py-3 font-semibold">วันเริ่มสัญญา</th>
                                <th className="px-3 py-3 font-semibold text-center">ใช้งานแล้ว</th>
                                <th className="px-3 py-3 font-semibold text-center">Round</th>
                                <th className="px-3 py-3 font-semibold">วันที่ต้องติดตาม</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                                <th className="px-3 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedQueue.length > 0 ? (
                                paginatedQueue.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-bg-hover transition-colors h-14">
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs text-text-muted opacity-60">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-text-main group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate max-w-[140px]" title={item.customerName}>
                                                        {item.customerName}
                                                    </span>
                                                    {item.branchName && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted border border-border-light">
                                                            {item.branchName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-text-muted">
                                                {item.csOwner || "-"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-text-main">
                                                {(() => {
                                                    const d = new Date(item.contractStart);
                                                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                })()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {(() => {
                                                const daysUsed = getDaysUsed(item.contractStart);
                                                return (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        daysUsed < 0
                                                            ? "text-slate-500 dark:text-slate-300/70"
                                                            : daysUsed <= 30
                                                                ? "text-emerald-600 dark:text-emerald-300/70"
                                                                : daysUsed <= 90
                                                                    ? "text-amber-600 dark:text-amber-300/70"
                                                                    : "text-indigo-600 dark:text-indigo-300/70"
                                                    }`}>
                                                        {daysUsed < 0 ? `อีก ${Math.abs(daysUsed)} วัน` : `${daysUsed} วัน`}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300/70">
                                                Day {item.round}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-text-main">
                                                {(() => {
                                                    const d = new Date(item.dueDate);
                                                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                })()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${getStatusStyle(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                onClick={() => onUpdateStatus?.(item.id, "Completed")}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300/70 hover:bg-emerald-500 hover:text-white text-xs font-medium transition-all border border-emerald-500/20 hover:border-emerald-500"
                                            >
                                                Mark Done
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-3 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Calendar className="w-10 h-10 text-text-muted" />
                                            <p className="text-xs text-text-muted">ไม่พบแผนการติดตามในหน้านี้</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredQueue.length > 0 && (
                    <div className="px-3 py-3 bg-bg-hover border-t border-border-light">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-text-muted">
                                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredQueue.length)} จาก {filteredQueue.length} รายการ
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group"
                                    title="หน้าแรก"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>

                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main text-xs font-medium group"
                                >
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
                                                        ? "bg-indigo-600 text-white shadow-lg"
                                                        : "hover:bg-bg-hover text-text-muted hover:text-text-main"
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
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group"
                                    title="หน้าสุดท้าย"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default FollowUpPlanManager;
