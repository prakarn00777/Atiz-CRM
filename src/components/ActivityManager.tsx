import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Edit2, Trash2, MoreVertical, LayoutList, History, ShieldCheck, Users, CheckCircle2, Play, Clock, AlertCircle, User } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { Customer, Activity, User as UserType } from "@/types";

interface ActivityManagerProps {
    activities: Activity[];
    customers: Customer[];
    users?: UserType[];
    onAdd: () => void;
    onEdit: (activity: Activity) => void;
    onDelete: (id: number) => void;
}

export default function ActivityManager({ activities, customers, users = [], onAdd, onEdit, onDelete }: ActivityManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
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

    // Get unique assignees from activities for filter options
    const assigneeOptions = useMemo(() => {
        const assignees = new Set<string>();
        activities.forEach(a => {
            if (a.assignee) assignees.add(a.assignee);
        });
        return Array.from(assignees).sort();
    }, [activities]);

    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            (activity.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.assignee || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || activity.activityType === typeFilter;
        const matchesAssignee = assigneeFilter === "all" || activity.assignee === assigneeFilter;

        return matchesSearch && matchesType && matchesAssignee;
    });

    // Sort by createdAt descending (newest first)
    const sortedActivities = [...filteredActivities].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedActivities.length / itemsPerPage);
    const paginatedActivities = sortedActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Success": return "text-emerald-400 bg-emerald-500/10";
            case "In Progress": return "text-indigo-400 bg-indigo-500/10";
            case "Pending": return "text-amber-400 bg-amber-500/10";
            default: return "text-slate-400 bg-slate-500/10";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Success": return <CheckCircle2 className="w-3.5 h-3.5" />;
            case "In Progress": return <Play className="w-3.5 h-3.5" />;
            case "Pending": return <AlertCircle className="w-3.5 h-3.5" />;
            default: return <Clock className="w-3.5 h-3.5" />;
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">CS Task Board</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหา Tasks..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกประเภท" },
                                { value: "Training", label: "Training" },
                                { value: "Onboarding", label: "Onboarding" },
                                { value: "Support", label: "Support" },
                                { value: "Call", label: "Call" },
                                { value: "Line", label: "Line" },
                                { value: "Visit", label: "Visit" },
                                { value: "Renewal", label: "Renewal" },
                                { value: "Other", label: "Other" },
                            ]}
                            value={typeFilter}
                            onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                            className="w-[160px]"
                        />
                        <CustomSelect
                            icon={<User className="w-3.5 h-3.5" />}
                            options={[
                                { value: "all", label: "ผู้รับผิดชอบทั้งหมด" },
                                ...assigneeOptions.map(a => ({ value: a, label: a }))
                            ]}
                            value={assigneeFilter}
                            onChange={(val) => { setAssigneeFilter(val); setCurrentPage(1); }}
                            className="w-[180px]"
                            placeholder="ผู้รับผิดชอบ"
                        />
                    </div>
                </div>

                <button
                    onClick={onAdd}
                    className="btn btn-primary h-9 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <div className="overflow-auto custom-scrollbar flex-1 px-2">
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-[#0f172a] shadow-sm mb-2">
                            <div className="flex bg-white/5 text-slate-400 text-xs uppercase tracking-wider rounded-lg">
                                <div className="px-4 py-3 font-semibold w-[5%] text-center">No.</div>
                                <div className="px-4 py-3 font-semibold w-[18%] text-left">Activity Info</div>
                                <div className="px-4 py-3 font-semibold w-[13%] text-center">Customer</div>
                                <div className="px-4 py-3 font-semibold w-[10%] text-center">Type</div>
                                <div className="px-4 py-3 font-semibold w-[10%] text-center">Status</div>
                                <div className="px-4 py-3 font-semibold w-[12%] text-center">Assignee</div>
                                <div className="px-4 py-3 font-semibold w-[18%] text-center">Created By</div>
                                <div className="px-4 py-3 font-semibold w-[8%] text-center">Actions</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {paginatedActivities.length > 0 ? (
                                paginatedActivities.map((activity, index) => (
                                    <div key={activity.id} className="group relative flex items-center bg-white/[0.01] hover:bg-white/[0.02] transition-all rounded-lg min-h-[56px] overflow-hidden">
                                        <div className="px-4 py-3 text-center w-[5%] relative z-10">
                                            <span className="text-xs text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </div>
                                        <div className="px-4 py-3 text-left w-[18%] relative z-10">
                                            <div className="flex flex-col gap-0.5 max-w-[280px]">
                                                <div className="font-semibold text-slate-200 text-xs truncate" title={activity.title}>
                                                    {activity.title || "Untitled Task"}
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate" title={activity.content}>
                                                    {activity.content || "-"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[13%] relative z-10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-slate-300 font-medium truncate max-w-full">{activity.customerName}</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[10%] relative z-10">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-medium whitespace-nowrap">
                                                {activity.activityType}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[10%] relative z-10">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusColor(activity.status || "Open")}`}>
                                                {getStatusIcon(activity.status || "Open")}
                                                {activity.status || "Open"}
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[12%] relative z-10">
                                            <span className="text-xs text-indigo-400 font-medium">
                                                {activity.assignee || "-"}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[18%] relative z-10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-medium text-slate-300">{activity.createdBy || "Admin"}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(activity.createdAt!).toLocaleString('th-TH', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 text-center w-[8%] relative z-10">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, activity.id!)}
                                                    className={`p-2 rounded-lg transition-colors ${activeMenu === activity.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {mounted && activeMenu === activity.id && menuPosition && createPortal(
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
                                                            onClick={() => { onEdit(activity); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไขข้อมูล
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={() => { onDelete(activity.id!); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            ลบรายการ
                                                        </button>
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <LayoutList className="w-12 h-12 text-slate-600" />
                                        <p className="text-sm text-slate-500">ไม่พบข้อมูลกิจกรรม</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-300">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <div className="h-4 w-px bg-white/10 mx-2"></div>
                                <span className="text-xs text-slate-400">
                                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredActivities.length)} จาก {filteredActivities.length} รายการ
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
