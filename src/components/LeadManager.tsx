"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Edit2, Trash2, Filter, Clock, MoreVertical, Plus, User, Phone, Tag, Briefcase, MessageSquare } from "lucide-react";
import CustomSelect from "./CustomSelect";
import Papa from "papaparse";
import { Lead } from "@/types";

interface LeadManagerProps {
    leads: Lead[];
    onEdit: (lead: Lead) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export default function LeadManager({ leads, onEdit, onDelete, onAdd }: LeadManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [productFilter, setProductFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [salesFilter, setSalesFilter] = useState("all");

    // Action Menu States
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

    const filteredLeads = leads.filter((l) => {
        const matchesSearch =
            (l.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.leadNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.phone || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProduct = productFilter === "all" || l.product === productFilter;
        const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
        const matchesType = typeFilter === "all" || l.leadType === typeFilter;
        const matchesSales = salesFilter === "all" || l.salesName === salesFilter;

        return matchesSearch && matchesProduct && matchesSource && matchesType && matchesSales;
    });

    const sortedLeads = [...filteredLeads].sort((a, b) => b.id - a.id);

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
    const paginatedLeads = sortedLeads.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">จัดการลีด (Leads)</h1>
                        <p className="text-slate-400 text-sm">ติดตามความคืบหน้าและข้อมูลลีดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            เพิ่มลีดใหม่
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, phone, lead no..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "ทุก Product" },
                                    { value: "Dr.Ease", label: "Dr.Ease" },
                                    { value: "Ease POS", label: "Ease POS" },
                                ]}
                                value={productFilter}
                                onChange={(val) => { setProductFilter(val); setCurrentPage(1); }}
                                className="w-[140px]"
                                placeholder="Product"
                                icon={<Briefcase className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "ทุกช่องทาง" },
                                    { value: "ยิงแอด", label: "ยิงแอด" },
                                    { value: "เซลล์หา", label: "เซลล์หา" },
                                    { value: "พาร์ทเนอร์", label: "พาร์ทเนอร์" },
                                    { value: "บริษัทหา", label: "บริษัทหา" },
                                ]}
                                value={sourceFilter}
                                onChange={(val) => { setSourceFilter(val); setCurrentPage(1); }}
                                className="w-[150px]"
                                placeholder="Source"
                                icon={<Tag className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "ทุกประเภท" },
                                    { value: "LINE", label: "LINE" },
                                    { value: "Facebook", label: "Facebook" },
                                    { value: "Call", label: "Call" },
                                    { value: "ลีดจากสัมนา", label: "ลีดจากสัมนา" },
                                    { value: "ลูกค้าเก่า ต่อสัญญา", label: "ลูกค้าเก่า ต่อสัญญา" },
                                    { value: "ขบายสัญญาเพิ่ม", label: "ขบายสัญญาเพิ่ม" },
                                    { value: "ลีดซ้ำ", label: "ลีดซ้ำ" },
                                ]}
                                value={typeFilter}
                                onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                                className="w-[180px]"
                                placeholder="Lead Type"
                                icon={<MessageSquare className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "เซลล์ทุกคน" },
                                    { value: "Aoey", label: "Aoey" },
                                    { value: "Yo", label: "Yo" },
                                ]}
                                value={salesFilter}
                                onChange={(val) => { setSalesFilter(val); setCurrentPage(1); }}
                                className="w-[130px]"
                                placeholder="Sales"
                                icon={<User className="w-3.5 h-3.5" />}
                            />
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
                                <th className="px-4 py-3 font-semibold w-[12%] text-center">Lead No.</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Customer Name</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Date Received</th>
                                <th className="px-4 py-3 font-semibold w-[10%]">Product</th>
                                <th className="px-4 py-3 font-semibold w-[10%]">Source</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Type</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Sales</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Modified</th>
                                <th className="px-4 py-3 font-semibold w-[5%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedLeads.length > 0 ? (
                                paginatedLeads.map((l, index) => (
                                    <tr key={l.id} className="group hover:bg-white/[0.02] transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-mono text-indigo-400 font-bold">
                                                {l.leadNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-slate-200 text-xs truncate max-w-[150px]" title={l.customerName}>
                                                    {l.customerName}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                                                    <span className="text-[10px] text-slate-400 font-mono">{l.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-400 font-mono italic">
                                                {l.receivedDate ? new Date(l.receivedDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${l.product === "Ease POS"
                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                }`}>
                                                {l.product}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-300">{l.source}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                                                {l.leadType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] uppercase font-black text-slate-200">{l.salesName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {l.modifiedAt ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-300 font-bold">{l.modifiedBy || 'System'}</span>
                                                    <span className="text-[9px] text-slate-500">
                                                        {new Date(l.modifiedAt).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, l.id)}
                                                    className={`p-2 rounded-lg transition-colors ${activeMenu === l.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {mounted && activeMenu === l.id && menuPosition && createPortal(
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
                                                            onClick={() => { onEdit(l); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไขข้อมูล
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={() => { onDelete(l.id); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            ลบข้อมูลลีด
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
                                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        ไม่พบข้อมูลลีด
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                แสดง {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, sortedLeads.length)} จาก {sortedLeads.length} ลีด
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs transition-colors"
                                >
                                    ก่อนหน้า
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs transition-colors"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
