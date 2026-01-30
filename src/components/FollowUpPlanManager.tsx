"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Calendar, CheckCircle2, Clock, AlertTriangle, User, ExternalLink, ChevronRight, Filter } from "lucide-react";
import { Customer, FollowUpRound, FollowUpStatus } from "@/types";

interface FollowUpPlanManagerProps {
    customers: Customer[];
    onUpdateStatus?: (roundId: number, status: FollowUpStatus) => void;
}

export default function FollowUpPlanManager({ customers, onUpdateStatus }: FollowUpPlanManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "overdue" | "all">("today");
    const [csFilter, setCsFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const csOwners = useMemo(() => {
        const owners = new Set<string>();
        customers.forEach(c => {
            if (c.csOwner) owners.add(c.csOwner);
            c.branches?.forEach(b => {
                if (b.csOwner) owners.add(b.csOwner);
            });
        });
        return Array.from(owners);
    }, [customers]);

    // Generate Follow-up rounds based on customers' contract start dates
    const followUpQueue: FollowUpRound[] = useMemo(() => {
        const queue: FollowUpRound[] = [];
        const rounds: (7 | 14 | 30 | 60 | 90)[] = [7, 14, 30, 60, 90];
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
                const branchCsOwner = branch.csOwner || customer.csOwner || "Unassigned";

                // Track rounds for this specific branch
                const branchRounds: FollowUpRound[] = [];

                rounds.forEach(roundDays => {
                    const dueDate = new Date(startDate);
                    dueDate.setDate(startDate.getDate() + roundDays);
                    dueDate.setHours(0, 0, 0, 0);

                    let status: FollowUpStatus = "Pending";
                    if (dueDate < today) {
                        status = "Overdue";
                    } else if (dueDate.getTime() === today.getTime()) {
                        status = "Calling";
                    }

                    branchRounds.push({
                        id: (customer.id * 100000) + (Math.abs(branch.name.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 1000) * 100 + roundDays, // More unique Pseudo ID
                        customerId: customer.id,
                        customerName: customer.name,
                        branchName: branch.name,
                        csOwner: branchCsOwner,
                        round: roundDays,
                        dueDate: dueDate.toISOString(),
                        status: status
                    });
                });

                // Pick the most relevant round for this branch:
                // 1. If there's an overdue/calling round, pick the earliest one.
                // 2. Otherwise, pick the next upcoming round.
                // 3. (Future: Filter out Completed rounds if we add persistence)

                const criticalRound = branchRounds.find(r => r.status === "Overdue" || r.status === "Calling");
                if (criticalRound) {
                    queue.push(criticalRound);
                } else {
                    // Find the next upcoming round (the first one that hasn't passed)
                    const nextRound = branchRounds.find(r => new Date(r.dueDate) >= today);
                    if (nextRound) {
                        queue.push(nextRound);
                    }
                }
            });
        });

        return queue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [customers]);

    const filteredQueue = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        // Reset page when filters change
        setCurrentPage(1);

        return followUpQueue.filter(item => {
            const itemDateStr = item.dueDate.split('T')[0];
            const matchesSearch = item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCs = csFilter === "all" || item.csOwner === csFilter;

            if (!matchesSearch || !matchesCs) return false;

            if (activeTab === "today") return itemDateStr === todayStr;
            if (activeTab === "overdue") return itemDateStr < todayStr && item.status !== "Completed";
            if (activeTab === "upcoming") return itemDateStr > todayStr;

            return true;
        });
    }, [followUpQueue, activeTab, searchTerm, csFilter]);

    const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
    const paginatedQueue = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredQueue.slice(start, start + itemsPerPage);
    }, [filteredQueue, currentPage, itemsPerPage]);

    const getStatusIcon = (status: FollowUpStatus) => {
        switch (status) {
            case "Completed": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case "Calling": return <Phone className="w-4 h-4 text-indigo-400 animate-pulse" />;
            case "Overdue": return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            default: return <Clock className="w-4 h-4 text-text-muted opacity-60" />;
        }
    };

    const getStatusStyle = (status: FollowUpStatus) => {
        switch (status) {
            case "Completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "Calling": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
            case "Overdue": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 text-text-main">Follow-up Plan</h1>
                    <p className="text-text-muted text-sm">แผนการโทรติดตามลูกค้า (7, 14, 30, 60, 90 วัน)</p>
                </div>

                <div className="flex items-center gap-3 bg-bg-hover border border-border-light p-1 rounded-xl">
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
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-text-muted hover:text-text-main hover:bg-bg-hover'}`}
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
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อลูกค้า..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="relative w-full md:w-48">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <select
                            value={csFilter}
                            onChange={(e) => setCsFilter(e.target.value)}
                            className="input-field pl-10 w-full appearance-none pr-8 cursor-pointer"
                        >
                            <option value="all">All CS Owners</option>
                            {csOwners.map(owner => (
                                <option key={owner} value={owner} className="bg-card-bg text-text-main">{owner}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-hover text-text-muted text-[10px] uppercase tracking-wider border-b border-border-light">
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">CS Owner</th>
                                <th className="px-6 py-4 font-semibold text-center">Round</th>
                                <th className="px-6 py-4 font-semibold">Due Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedQueue.length > 0 ? (
                                paginatedQueue.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-text-main group-hover:text-indigo-500 transition-colors">
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-xs font-medium text-text-main">{item.csOwner}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                                Day {item.round}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-text-muted opacity-50" />
                                                <span className="text-xs text-text-main">
                                                    {new Date(item.dueDate).toLocaleDateString('th-TH', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 rounded-lg bg-bg-hover text-text-muted hover:text-text-main hover:bg-bg-hover transition-all border border-border-light group/btn">
                                                    <Phone className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatus?.(item.id, "Completed")}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all border border-emerald-500/20 hover:border-emerald-500"
                                                >
                                                    Mark Done
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Calendar className="w-12 h-12 text-slate-400" />
                                            <p className="text-sm text-slate-500 font-medium">ไม่พบแผนการติดตามในหน้านี้</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredQueue.length > 0 && (
                    <div className="px-6 py-4 bg-bg-hover border-t border-border-light">
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
}
