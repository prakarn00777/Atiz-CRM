"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Clock, CheckCircle2, Play, User, MessageSquare, AlertCircle, X, Edit2, ExternalLink, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import SearchableCustomerSelect from "./SearchableCustomerSelect";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { Customer, Installation } from "@/types";

interface InstallationManagerProps {
    installations: Installation[];
    customers: Customer[];
    onAddInstallation: (installation: any) => void;
    onUpdateStatus: (id: number, status: Installation["status"]) => void;
}

export default function InstallationManager({
    installations,
    customers,
    onAddInstallation,
    onUpdateStatus
}: InstallationManagerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
    const [isModalOpen, setModalOpen] = useState(false);
    const [customerType, setCustomerType] = useState<"new" | "existing">("new");
    const [newInst, setNewInst] = useState({
        customerId: 0,
        customerName: "",
        notes: "",
        newCustomerName: "",
        newCustomerLink: "",
        newCustomerProduct: "Dr.Ease" as any,
        newCustomerPackage: "Standard",
        branchName: "",
        branchAddress: ""

    });

    // Action Menu States
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    // Initial mount for portal
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMenuToggle = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({
                top: rect.bottom,
                left: rect.left
            });
        }
        setActiveMenu(activeMenu === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        if (activeMenu !== null) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const resetModal = () => {
        setCustomerType("new");
        setNewInst({
            customerId: 0,
            customerName: "",
            notes: "",
            newCustomerName: "",
            newCustomerLink: "",
            newCustomerProduct: "Dr.Ease",
            newCustomerPackage: "Standard",
            branchName: "",
            branchAddress: ""
        });
    };

    const filteredInstallations = installations.filter(inst => {
        const matchesSearch = inst.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || inst.status === statusFilter;

        // Date Range Filter logic
        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && inst.requestedAt >= dateRange.start;
        }
        if (dateRange.end) {
            // Add time to end date to include the entire day
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(inst.requestedAt) <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const sortedInstallations = [...filteredInstallations].sort((a, b) => b.id - a.id);

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(sortedInstallations.length / itemsPerPage);
    const paginatedInstallations = sortedInstallations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Pending": return <Clock className="w-4 h-4 text-amber-400" />;
            case "Installing": return <Play className="w-4 h-4 text-indigo-400 animate-pulse" />;
            case "Completed": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "Installing": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
            case "Completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    const [selectedInst, setSelectedInst] = useState<Installation | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Installations</h1>
                    <p className="text-slate-400 text-sm">Track and manage the installation process for new customers</p>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full md:w-64 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="ค้นหา (ชื่อลูกค้า)..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="input-field pl-9 py-1.5 text-xs h-9"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full">
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
                            <div className="relative shrink-0">
                                <CustomSelect
                                    options={[
                                        { value: "all", label: "All Status" },
                                        { value: "Pending", label: "Pending" },
                                        { value: "Installing", label: "Installing" },
                                        { value: "Completed", label: "Completed" },
                                    ]}
                                    value={statusFilter}
                                    onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                                    className="w-[140px]"
                                    placeholder="สถานะ"
                                    icon={<Filter className="w-3.5 h-3.5" />}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { resetModal(); setModalOpen(true); }}
                        className="btn btn-primary px-4 py-2 h-9 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>แจ้งติดตั้ง</span>
                    </button>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-4 py-3 font-semibold w-[4%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Customer</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Type</th>
                                <th className="px-4 py-3 font-semibold w-[18%]">Subdomain</th>
                                <th className="px-4 py-3 font-semibold w-[9%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[13%]">Request By</th>
                                <th className="px-4 py-3 font-semibold w-[13%]">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedInstallations.length > 0 ? (
                                paginatedInstallations.map((inst, index) => (
                                    <tr key={inst.id} className="group hover:bg-white/[0.02] transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-200 text-xs truncate max-w-[180px]" title={inst.customerName}>
                                                    {inst.customerName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">ID: {inst.customerId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${inst.installationType === "new"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                                }`}>
                                                {inst.installationType === "new" ? "ลูกค้าใหม่" : "เพิ่มสาขา"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const cust = customers.find(c => c.id === inst.customerId);
                                                const displayLink = cust?.subdomain || inst.customerLink;
                                                return displayLink ? (
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
                                                );
                                            })()}
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
                                                    <User className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-300">{inst.requestedBy}</span>
                                                        <span className="text-[10px] text-slate-500">
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
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {inst.modifiedBy ? (
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-300">{inst.modifiedBy}</span>
                                                        <span className="text-[10px] text-slate-500">
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
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 relative">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, inst.id)}
                                                    className={`p-2 rounded-lg transition-colors ${activeMenu === inst.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {mounted && activeMenu === inst.id && menuPosition && createPortal(
                                                    <div
                                                        style={{
                                                            position: 'fixed',
                                                            top: `${menuPosition.top + 8}px`,
                                                            left: `${menuPosition.left - 144}px`,
                                                        }}
                                                        className="z-[9999] w-40 py-1.5 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-150 origin-top-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => { setSelectedInst(inst); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไขรายละเอียด
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
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic text-sm">
                                        ไม่พบข้อมูลงานติดตั้ง
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between mt-auto">
                        <div className="text-xs text-slate-400">
                            แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredInstallations.length)} จาก {filteredInstallations.length} รายการ
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-300"
                            >
                                ก่อนหน้า
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === page
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                        : "hover:bg-white/5 text-slate-400"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-300"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg glass-card p-6 shadow-2xl border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-4 h-4 text-indigo-400" />
                                แจ้งงานติดตั้งใหม่
                            </h2>
                            <button onClick={() => { resetModal(); setModalOpen(false); }} className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">ประเภทงานติดตั้ง</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType("new")}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "new"
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                                            }`}
                                    >
                                        ติดตั้งลูกค้าใหม่
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType("existing")}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "existing"
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                                            }`}
                                    >
                                        ติดตั้งสาขาเพิ่ม
                                    </button>
                                </div>
                            </div>

                            {customerType === "existing" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">เลือกลูกค้า</label>
                                        <SearchableCustomerSelect
                                            customers={customers}
                                            value={newInst.customerId || null}
                                            onChange={(id, name) => setNewInst({ ...newInst, customerId: id, customerName: name })}
                                            placeholder="เลือกชื่อคลินิก/ร้านค้า..."
                                        />
                                    </div>
                                    {newInst.customerId > 0 && (
                                        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-xs font-medium text-slate-300">ข้อมูลสาขาใหม่</p>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                    ชื่อสาขา <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="เช่น สาขาสยาม, สาขาเซ็นทรัล"
                                                    value={newInst.branchName}
                                                    onChange={(e) => setNewInst({ ...newInst, branchName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {customerType === "new" && (
                                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                            ชื่อคลินิก/ร้านค้า <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="กรอกชื่อลูกค้า..."
                                            value={newInst.newCustomerName}
                                            onChange={(e) => setNewInst({ ...newInst, newCustomerName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                ประเภทระบบ <span className="text-rose-500">*</span>
                                            </label>
                                            <CustomSelect
                                                options={[
                                                    { value: "Dr.Ease", label: "Dr.Ease" },
                                                    { value: "ease", label: "ease" },
                                                ]}
                                                value={newInst.newCustomerProduct}
                                                onChange={(val) => setNewInst({ ...newInst, newCustomerProduct: val })}
                                                placeholder="เลือกระบบ..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                แพ็คเกจ <span className="text-rose-500">*</span>
                                            </label>
                                            <CustomSelect
                                                options={[
                                                    { value: "Starter", label: "Starter" },
                                                    { value: "Standard", label: "Standard" },
                                                    { value: "Elite", label: "Elite" },
                                                ]}
                                                value={newInst.newCustomerPackage}
                                                onChange={(val) => setNewInst({ ...newInst, newCustomerPackage: val })}
                                                placeholder="เลือกแพ็คเกจ..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                            ลิงก์เข้าระบบ (System Link) <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="input-field pl-9"
                                                placeholder="example.dr-ease.com"
                                                value={newInst.newCustomerLink}
                                                onChange={(e) => setNewInst({ ...newInst, newCustomerLink: e.target.value })}
                                            />
                                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">หมายเหตุ</label>
                                <textarea
                                    className="input-field min-h-[80px] py-3 h-auto resize-none text-xs"
                                    value={newInst.notes}
                                    onChange={(e) => setNewInst({ ...newInst, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => { resetModal(); setModalOpen(false); }} className="btn btn-ghost flex-1 py-2.5 text-xs font-medium">ยกเลิก</button>
                                <button
                                    onClick={() => {
                                        if (customerType === "existing" && (newInst.customerId === 0 || !newInst.branchName.trim())) return;
                                        if (customerType === "new" && (!newInst.newCustomerName.trim() || !newInst.newCustomerLink.trim())) return;

                                        onAddInstallation({
                                            ...newInst,
                                            installationType: customerType === "new" ? "new" : "branch"
                                        });
                                        resetModal();
                                        setModalOpen(false);
                                    }}
                                    className="btn btn-primary flex-1 py-2.5 text-xs font-medium"
                                >
                                    บันทึกงาน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedInst && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg glass-card p-6 shadow-2xl border-white/20">
                        <div className="flex justify-between items-start mb-0">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                    รายละเอียดการติดตั้ง
                                </h2>
                            </div>
                            <button onClick={() => setSelectedInst(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Flow Bar */}
                        <div className="px-6 py-4 border-b border-white/5">
                            <div className="flex items-center justify-end">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // Only update local state
                                            setSelectedInst({ ...selectedInst, status: "Pending" });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInst.status === "Pending"
                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                                            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                                            }`}
                                    >
                                        Pending
                                    </button>

                                    <span className="text-slate-600">→</span>

                                    <button
                                        onClick={() => {
                                            // Only update local state
                                            setSelectedInst({ ...selectedInst, status: "Completed" });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInst.status === "Completed"
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                            }`}
                                    >
                                        Completed
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">Type</label>
                                    <input
                                        readOnly
                                        value={selectedInst.installationType === "branch" ? "ติดตั้งสาขาใหม่" : "ติดตั้งลูกค้าใหม่"}
                                        className="input-field bg-white/5 text-slate-300 cursor-default"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">Customer</label>
                                    <input
                                        readOnly
                                        value={selectedInst.customerName}
                                        className="input-field bg-white/5 text-slate-300 cursor-default"
                                    />
                                </div>

                                {selectedInst.branchName && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Branch</label>
                                        <input
                                            readOnly
                                            value={selectedInst.branchName}
                                            className="input-field bg-white/5 text-slate-300 cursor-default"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">Notes</label>
                                    <textarea
                                        readOnly
                                        value={selectedInst.notes || "ไม่มีข้อมูล"}
                                        className="input-field min-h-[100px] text-xs py-3 resize-none bg-white/5 text-slate-300 cursor-default"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => {
                                    onUpdateStatus(selectedInst.id, selectedInst.status);
                                    setSelectedInst(null);
                                }}
                                className="btn btn-primary px-6"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
