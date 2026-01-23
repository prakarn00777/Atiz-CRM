"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Phone, User, Tag, Briefcase, MessageSquare, FileText, Building2, Calendar, ExternalLink, Loader2 } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { GoogleSheetLead } from "@/types";

interface GoogleSheetLeadManagerProps {
    leads: GoogleSheetLead[];
    isLoading?: boolean;
}

export default function GoogleSheetLeadManager({ leads, isLoading }: GoogleSheetLeadManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [productFilter, setProductFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [salesFilter, setSalesFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Get unique values for filters
    const uniqueProducts = useMemo(() => [...new Set(leads.map(l => l.product).filter(Boolean))], [leads]);
    const uniqueSources = useMemo(() => [...new Set(leads.map(l => l.source).filter(Boolean))], [leads]);
    const uniqueTypes = useMemo(() => [...new Set(leads.map(l => l.leadType).filter(Boolean))], [leads]);
    const uniqueSales = useMemo(() => [...new Set(leads.map(l => l.salesName).filter(Boolean))], [leads]);
    const uniqueStatuses = useMemo(() => [...new Set(leads.map(l => l.quotationStatus).filter(Boolean))], [leads]);

    const filteredLeads = useMemo(() => leads.filter((l) => {
        const matchesSearch =
            (l.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.leadNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.clinicName || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProduct = productFilter === "all" || l.product === productFilter;
        const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
        const matchesType = typeFilter === "all" || l.leadType === typeFilter;
        const matchesSales = salesFilter === "all" || l.salesName === salesFilter;
        const matchesStatus = statusFilter === "all" || l.quotationStatus === statusFilter;

        return matchesSearch && matchesProduct && matchesSource && matchesType && matchesSales && matchesStatus;
    }), [leads, searchTerm, productFilter, sourceFilter, typeFilter, salesFilter, statusFilter]);

    // Sort by leadIndex descending (newest first)
    const sortedLeads = useMemo(() => [...filteredLeads].sort((a, b) =>
        parseInt(b.leadIndex || '0') - parseInt(a.leadIndex || '0')
    ), [filteredLeads]);

    const itemsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedLeads.length / itemsPerPage), [sortedLeads]);
    const paginatedLeads = useMemo(() => sortedLeads.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedLeads, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, productFilter, sourceFilter, typeFilter, salesFilter, statusFilter]);

    const getStatusBadge = (status: string) => {
        if (!status) return null;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('ปิดการขาย') || statusLower.includes('won') || statusLower.includes('สำเร็จ')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{status}</span>;
        }
        if (statusLower.includes('รอ') || statusLower.includes('pending')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{status}</span>;
        }
        if (statusLower.includes('ยกเลิก') || statusLower.includes('lost') || statusLower.includes('cancel')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">{status}</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight">จัดการลีด (Leads)</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            Google Sheets
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        ดึงข้อมูลจาก Google Sheets อัตโนมัติ ({leads.length.toLocaleString()} รายการ)
                    </p>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, เบอร์, เลขลีด..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุก Product" },
                                ...uniqueProducts.map(p => ({ value: p, label: p }))
                            ]}
                            value={productFilter}
                            onChange={setProductFilter}
                            className="w-[140px]"
                            placeholder="Product"
                            icon={<Briefcase className="w-3.5 h-3.5" />}
                        />

                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกช่องทาง" },
                                ...uniqueSources.map(s => ({ value: s, label: s }))
                            ]}
                            value={sourceFilter}
                            onChange={setSourceFilter}
                            className="w-[150px]"
                            placeholder="Source"
                            icon={<Tag className="w-3.5 h-3.5" />}
                        />

                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกประเภท" },
                                ...uniqueTypes.map(t => ({ value: t, label: t }))
                            ]}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            className="w-[150px]"
                            placeholder="Lead Type"
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                        />

                        <CustomSelect
                            options={[
                                { value: "all", label: "เซลล์ทุกคน" },
                                ...uniqueSales.map(s => ({ value: s, label: s }))
                            ]}
                            value={salesFilter}
                            onChange={setSalesFilter}
                            className="w-[130px]"
                            placeholder="Sales"
                            icon={<User className="w-3.5 h-3.5" />}
                        />

                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกสถานะ" },
                                ...uniqueStatuses.map(s => ({ value: s, label: s }))
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-[160px]"
                            placeholder="สถานะใบเสนอราคา"
                            icon={<FileText className="w-3.5 h-3.5" />}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-220px)]">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-sm text-slate-400">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                                    <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                        <th className="px-3 py-3 font-semibold w-[4%] text-center">ลีดที่</th>
                                        <th className="px-3 py-3 font-semibold w-[8%] text-center">เลขที่ลีด</th>
                                        <th className="px-3 py-3 font-semibold w-[8%] text-center">วันที่</th>
                                        <th className="px-3 py-3 font-semibold w-[8%]">Product</th>
                                        <th className="px-3 py-3 font-semibold w-[8%]">ลีด</th>
                                        <th className="px-3 py-3 font-semibold w-[8%]">ประเภท</th>
                                        <th className="px-3 py-3 font-semibold w-[6%] text-center">เซลล์</th>
                                        <th className="px-3 py-3 font-semibold w-[12%]">ชื่อลูกค้า</th>
                                        <th className="px-3 py-3 font-semibold w-[9%]">เบอร์โทร</th>
                                        <th className="px-3 py-3 font-semibold w-[10%]">สถานะใบเสนอราคา</th>
                                        <th className="px-3 py-3 font-semibold w-[10%]">คลินิก/ธุรกิจ</th>
                                        <th className="px-3 py-3 font-semibold w-[9%]">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="text-center py-16 text-slate-500">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedLeads.map((lead) => (
                                            <tr
                                                key={lead.id || lead.leadIndex}
                                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono text-slate-500">{lead.leadIndex}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="font-mono text-xs font-bold text-indigo-400">{lead.leadNumber}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs text-slate-400">{lead.date}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`text-xs font-semibold ${lead.product === 'Dr.Ease' ? 'text-cyan-400' : 'text-amber-400'}`}>
                                                        {lead.product}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-slate-300">{lead.source}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-slate-400">{lead.leadType}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-medium text-slate-300">{lead.salesName}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs font-medium text-white">{lead.customerName}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs font-mono text-slate-400">{lead.phone}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {getStatusBadge(lead.quotationStatus)}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-slate-400 truncate block max-w-[120px]" title={lead.clinicName}>
                                                        {lead.clinicName}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-slate-500 truncate block max-w-[100px]" title={lead.notes}>
                                                        {lead.notes}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-white/5 flex items-center justify-between shrink-0">
                                <p className="text-xs text-slate-500">
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedLeads.length)} จาก {sortedLeads.length.toLocaleString()} รายการ
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ก่อนหน้า
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-medium text-slate-400">
                                        หน้า {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
