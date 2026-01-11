"use client";

import { useState } from "react";
import { Plus, Search, Filter, Clock, CheckCircle2, Play, User, MessageSquare, AlertCircle, X, Edit2, ExternalLink } from "lucide-react";
import SearchableCustomerSelect from "./SearchableCustomerSelect";
import CustomSelect from "./CustomSelect";

interface Installation {
    id: number;
    customerId: number;
    customerName: string;
    status: "Pending" | "Installing" | "Completed";
    requestedBy: string;
    requestedAt: string;
    assignedDev?: string;
    completedAt?: string;
    notes?: string;
}

interface InstallationManagerProps {
    installations: Installation[];
    customers: any[];
    onAddInstallation: (installation: Partial<Installation>) => void;
    onUpdateStatus: (id: number, status: "Pending" | "Installing" | "Completed") => void;
    onAssignDev: (id: number, devName: string) => void;
}

export default function InstallationManager({
    installations,
    customers,
    onAddInstallation,
    onUpdateStatus,
    onAssignDev
}: InstallationManagerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isModalOpen, setModalOpen] = useState(false);
    const [newInst, setNewInst] = useState({
        customerId: 0,
        customerName: "",
        notes: ""
    });

    const filteredInstallations = installations.filter(inst => {
        const matchesSearch = inst.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Sort: Latest ID top
    const sortedInstallations = [...filteredInstallations].sort((a, b) => b.id - a.id);

    // Pagination
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
                    <h1 className="text-3xl font-bold tracking-tight mb-2">งานติดตั้ง (Installation)</h1>
                    <p className="text-slate-400 text-sm">ติดตามและจัดการกระบวนการติดตั้งระบบสำหรับลูกค้าใหม่</p>
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
                            <div className="relative shrink-0">
                                <CustomSelect
                                    options={[
                                        { value: "all", label: "สถานะทั้งหมด" },
                                        { value: "Pending", label: "รอดำเนินการ" },
                                        { value: "Installing", label: "กำลังดำเนินการ" },
                                        { value: "Completed", label: "ติดตั้งเสร็จแล้ว" },
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
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-4 py-3 font-semibold w-[5%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[20%]">Customer</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">System Link</th>
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[18%]">Assigned Dev</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Requested At</th>
                                <th className="px-4 py-3 font-semibold w-[15%] text-right">Actions</th>
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
                                                <span className="font-semibold text-slate-200 text-xs truncate max-w-[200px]" title={inst.customerName}>
                                                    {inst.customerName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">ID: {inst.customerId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const cust = customers.find(c => c.id === inst.customerId);
                                                return cust?.link ? (
                                                    <a
                                                        href={cust.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline truncate block max-w-[150px]"
                                                        title={cust.link}
                                                    >
                                                        {cust.link}
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
                                            <div className="flex items-center gap-2">
                                                {inst.assignedDev ? (
                                                    <>
                                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                                            {inst.assignedDev.charAt(0)}
                                                        </div>
                                                        <span className="text-xs text-slate-300">{inst.assignedDev}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">ยังไม่ได้มอบหมาย</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-slate-300">
                                                        {new Date(inst.requestedAt).toLocaleDateString('th-TH', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(inst.requestedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">

                                                <button
                                                    onClick={() => setSelectedInst(inst)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                                    title="แก้ไขรายละเอียด"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic text-sm">
                                        ไม่พบข้อมูลงานติดตั้ง
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
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

            {/* Modal แจ้งงานใหม่ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md glass-card p-6 shadow-2xl border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-400" />
                                แจ้งงานติดตั้งใหม่
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                <Search className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">เลือกลูกค้า</label>
                                <SearchableCustomerSelect
                                    customers={customers}
                                    value={newInst.customerId || null}
                                    onChange={(id, name) => setNewInst({ ...newInst, customerId: id, customerName: name })}
                                    placeholder="เลือกชื่อคลินิก/ร้านค้า..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">หมายเหตุเพิ่มเติม</label>
                                <textarea
                                    className="input-field min-h-[100px] py-3 h-auto resize-none"
                                    placeholder="ใส่รายละเอียดที่ DEV ควรทราบ..."
                                    value={newInst.notes}
                                    onChange={(e) => setNewInst({ ...newInst, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="btn btn-ghost flex-1 py-2.5 translate-y-0 active:scale-95"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        if (newInst.customerId === 0) return;
                                        onAddInstallation(newInst);
                                        setModalOpen(false);
                                        setNewInst({ customerId: 0, customerName: "", notes: "" });
                                    }}
                                    className="btn btn-primary flex-1 py-2.5 translate-y-0 active:scale-95"
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
                    <div className="w-full max-w-lg glass-card p-6 shadow-2xl border-white/20">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                    รายละเอียด
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">ID: {selectedInst.customerId}</p>
                            </div>
                            <button onClick={() => setSelectedInst(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ลูกค้า</label>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-base font-medium text-slate-200">{selectedInst.customerName}</div>
                                        {(() => {
                                            const cust = customers.find(c => c.id === selectedInst.customerId);
                                            return cust?.link ? (
                                                <a
                                                    href={cust.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 w-fit hover:underline"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    {cust.link}
                                                </a>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">สถานะ</label>
                                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(selectedInst.status)}`}>
                                            {getStatusIcon(selectedInst.status)}
                                            {selectedInst.status}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">ผู้รับผิดชอบ</label>
                                        <div className="flex items-center gap-2">
                                            {selectedInst.assignedDev ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                                        {selectedInst.assignedDev.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-slate-300">{selectedInst.assignedDev}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-slate-500 italic">ยังไม่ได้มอบหมาย</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">ข้อมูลเพิ่มเติม / หมายเหตุ</label>
                                <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-300 min-h-[80px] border border-white/5">
                                    {selectedInst.notes || <span className="text-slate-600 italic">ไม่มีข้อมูลเพิ่มเติม</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs text-slate-500">
                                <div>
                                    <span className="block mb-0.5 opacity-50">Requested By</span>
                                    <span className="text-slate-400">{selectedInst.requestedBy}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block mb-0.5 opacity-50">Requested At</span>
                                    <span className="text-slate-400">
                                        {new Date(selectedInst.requestedAt).toLocaleString('th-TH')}
                                    </span>
                                </div>
                                {selectedInst.completedAt && (
                                    <div className="col-span-2 text-right text-emerald-500/70">
                                        Completed: {new Date(selectedInst.completedAt).toLocaleString('th-TH')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 shrink-0">
                            {selectedInst.status === "Pending" && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(selectedInst.id, "Installing");
                                        setSelectedInst(null);
                                    }}
                                    className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <Play className="w-5 h-5" />
                                    <span>เริ่มดำเนินการติดตั้ง</span>
                                </button>
                            )}

                            {selectedInst.status === "Installing" && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(selectedInst.id, "Completed");
                                        setSelectedInst(null);
                                    }}
                                    className="btn bg-emerald-500 hover:bg-emerald-600 text-white w-full py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>บันทึกการติดตั้งเสร็จสิ้น</span>
                                </button>
                            )}

                            {selectedInst.status === "Completed" && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <span className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        งานนี้ดำเนินการเสร็จสิ้นแล้ว
                                    </span>
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
}
