"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Clock, CheckCircle2, MessageSquare, X, ExternalLink, AlertTriangle } from "lucide-react";
import SearchableCustomerSelect from "./SearchableCustomerSelect";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { Customer, Installation } from "@/types";
import InstallationRow from "./rows/InstallationRow";

interface InstallationManagerProps {
    installations: Installation[];
    customers: Customer[];
    onAddInstallation: (installation: any) => void;
    onUpdateStatus: (id: number, status: Installation["status"]) => void;
    onDelete: (id: number) => void;
}

const InstallationManager = React.memo(function InstallationManager({
    installations,
    customers,
    onAddInstallation,
    onUpdateStatus,
    onDelete
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

    // Parent-managed action menu state
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

    const closeMenu = useCallback(() => {
        setOpenMenuId(null);
        setMenuPosition(null);
    }, []);

    const handleToggleMenu = useCallback((id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (openMenuId === id) {
            closeMenu();
            return;
        }
        const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({ top: rect.bottom, left: rect.left });
        }
        setOpenMenuId(id);
    }, [openMenuId, closeMenu]);

    // Document-level handlers for closing menu
    useEffect(() => {
        if (openMenuId === null) return;

        const handleClick = () => closeMenu();
        const handleScroll = () => closeMenu();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenu();
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll, true);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll, true);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [openMenuId, closeMenu]);

    const handleDeleteRequest = useCallback((id: number) => {
        const inst = installations.find(i => i.id === id);
        setDeleteTarget({ id, name: inst?.customerName || `#${id}` });
    }, [installations]);

    const confirmDelete = useCallback(() => {
        if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
        }
    }, [deleteTarget, onDelete]);

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

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && inst.requestedAt >= dateRange.start;
        }
        if (dateRange.end) {
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

    const [selectedInst, setSelectedInst] = useState<Installation | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-main">Installations</h1>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full md:w-64 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
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
                        <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                            <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                <th className="px-3 py-3 font-semibold w-[4%] text-center">No.</th>
                                <th className="px-3 py-3 font-semibold w-[14%]">Customer</th>
                                <th className="px-3 py-3 font-semibold w-[10%]">Branch</th>
                                <th className="px-3 py-3 font-semibold w-[8%] text-center">Type</th>
                                <th className="px-3 py-3 font-semibold w-[15%]">Subdomain</th>
                                <th className="px-3 py-3 font-semibold w-[8%] text-center">Status</th>
                                <th className="px-3 py-3 font-semibold w-[13%]">Request By</th>
                                <th className="px-3 py-3 font-semibold w-[13%]">Modified By</th>
                                <th className="px-3 py-3 font-semibold w-[5%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedInstallations.length > 0 ? (
                                paginatedInstallations.map((inst, index) => (
                                    <InstallationRow
                                        key={inst.id}
                                        installation={inst}
                                        rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                                        customers={customers}
                                        onSelect={setSelectedInst}
                                        onDelete={handleDeleteRequest}
                                        isMenuOpen={openMenuId === inst.id}
                                        menuPosition={openMenuId === inst.id ? menuPosition : null}
                                        onToggleMenu={handleToggleMenu}
                                        onCloseMenu={closeMenu}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-text-muted italic text-sm">
                                        ไม่พบข้อมูลงานติดตั้ง
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-border-light flex items-center justify-between mt-auto bg-gradient-to-r from-bg-hover to-transparent">
                        <div className="text-xs text-text-muted">
                            แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredInstallations.length)} จาก {filteredInstallations.length} รายการ
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-text-main"
                            >
                                ก่อนหน้า
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === page
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "hover:bg-bg-hover text-text-muted hover:text-text-main"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-text-main"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Installation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border" style={{ backgroundColor: 'var(--modal-bg)' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                                <Plus className="w-4 h-4 text-indigo-500" />
                                แจ้งงานติดตั้งใหม่
                            </h2>
                            <button onClick={() => { resetModal(); setModalOpen(false); }} className="p-1.5 hover:bg-bg-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-2">ประเภทงานติดตั้ง</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType("new")}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "new"
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-bg-hover text-text-muted hover:text-text-main"
                                            }`}
                                    >
                                        ติดตั้งลูกค้าใหม่
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomerType("existing")}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "existing"
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-bg-hover text-text-muted hover:text-text-main"
                                            }`}
                                    >
                                        ติดตั้งสาขาเพิ่ม
                                    </button>
                                </div>
                            </div>

                            {customerType === "existing" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted mb-1.5">เลือกลูกค้า</label>
                                        <SearchableCustomerSelect
                                            customers={customers}
                                            value={newInst.customerId || null}
                                            onChange={(id, name) => setNewInst({ ...newInst, customerId: id, customerName: name })}
                                            placeholder="เลือกชื่อคลินิก/ร้านค้า..."
                                        />
                                    </div>
                                    {newInst.customerId > 0 && (
                                        <div className="space-y-3 p-4 bg-bg-hover rounded-xl border border-border">
                                            <p className="text-xs font-medium text-text-main">ข้อมูลสาขาใหม่</p>
                                            <div>
                                                <label className="block text-xs font-medium text-text-muted mb-1.5">
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
                                <div className="space-y-4 p-4 bg-bg-hover rounded-xl border border-border">
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted mb-1.5">
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
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">
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
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">
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
                                        <label className="block text-xs font-medium text-text-muted mb-1.5">
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
                                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1.5">หมายเหตุ</label>
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

            {/* Detail Modal */}
            {selectedInst && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl shadow-2xl border border-border" style={{ backgroundColor: 'var(--modal-bg)' }}>
                        <div className="flex justify-between items-start p-6 pb-0">
                            <div>
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                                    รายละเอียดการติดตั้ง
                                </h2>
                            </div>
                            <button onClick={() => setSelectedInst(null)} className="p-2 hover:bg-bg-hover rounded-full text-text-muted hover:text-text-main transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Flow Bar */}
                        <div className="px-6 py-4 border-b border-border-light">
                            <div className="flex items-center justify-end">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedInst({ ...selectedInst, status: "Pending" });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInst.status === "Pending"
                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                                            : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20"
                                            }`}
                                    >
                                        Pending
                                    </button>

                                    <span className="text-text-muted">&rarr;</span>

                                    <button
                                        onClick={() => {
                                            setSelectedInst({ ...selectedInst, status: "Completed" });
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedInst.status === "Completed"
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                                            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
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
                                    <label className="text-xs font-medium text-text-muted">Type</label>
                                    <input
                                        readOnly
                                        value={selectedInst.installationType === "branch" ? "ติดตั้งสาขาใหม่" : "ติดตั้งลูกค้าใหม่"}
                                        className="input-field bg-bg-hover text-text-main cursor-default"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-text-muted">Customer</label>
                                    <input
                                        readOnly
                                        value={selectedInst.customerName}
                                        className="input-field bg-bg-hover text-text-main cursor-default"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-text-muted">Branch</label>
                                    <input
                                        readOnly
                                        value={selectedInst.installationType === "new" ? "สำนักงานใหญ่" : (selectedInst.branchName || "-")}
                                        className="input-field bg-bg-hover text-text-main cursor-default"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-text-muted">Notes</label>
                                    <textarea
                                        readOnly
                                        value={selectedInst.notes || "ไม่มีข้อมูล"}
                                        className="input-field min-h-[100px] text-xs py-3 resize-none bg-bg-hover text-text-main cursor-default"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 pt-4 border-t border-border-light flex justify-end">
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
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="w-full max-w-sm p-6 relative rounded-2xl border border-border shadow-2xl" style={{ backgroundColor: 'var(--modal-bg)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                            </div>
                            <h3 className="text-base font-bold text-text-main">ยืนยันการลบ</h3>
                        </div>
                        <p className="text-sm text-text-muted mb-6">
                            คุณต้องการลบงานติดตั้งของ <span className="font-semibold text-text-main">{deleteTarget.name}</span> ใช่หรือไม่?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1">ยกเลิก</button>
                            <button
                                onClick={confirmDelete}
                                className="btn flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                            >
                                ลบรายการ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default InstallationManager;
