"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, ExternalLink, Loader2, RefreshCw, Repeat } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { RenewalsRecord } from "@/types";

interface RenewalsManagerProps {
    renewals: RenewalsRecord[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

export default function RenewalsManager({ renewals, isLoading, onRefresh }: RenewalsManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [monthFilter, setMonthFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");

    // Get unique values for filters
    const uniqueMonths = useMemo(() => [...new Set(renewals.map(r => r.month).filter(Boolean))], [renewals]);
    const uniqueYears = useMemo(() => [...new Set(renewals.map(r => r.year).filter(Boolean))], [renewals]);

    const filteredRenewals = useMemo(() => renewals.filter((r) => {
        const matchesSearch =
            (r.month || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.year || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMonth = monthFilter === "all" || r.month === monthFilter;
        const matchesYear = yearFilter === "all" || r.year === yearFilter;

        return matchesSearch && matchesMonth && matchesYear;
    }), [renewals, searchTerm, monthFilter, yearFilter]);

    // Sort by index descending (latest first)
    const sortedRenewals = useMemo(() => [...filteredRenewals].sort((a, b) => {
        const idxA = parseInt(a.index) || 0;
        const idxB = parseInt(b.index) || 0;
        return idxB - idxA;
    }), [filteredRenewals]);

    const itemsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedRenewals.length / itemsPerPage), [sortedRenewals]);
    const paginatedRenewals = useMemo(() => sortedRenewals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedRenewals, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, monthFilter, yearFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Calculate totals
    const totals = useMemo(() => ({
        renewed: filteredRenewals.reduce((sum, r) => sum + (r.renewedAmount || 0), 0),
        notRenewed: filteredRenewals.reduce((sum, r) => sum + (r.notRenewedAmount || 0), 0),
        pending: filteredRenewals.reduce((sum, r) => sum + (r.pendingAmount || 0), 0),
    }), [filteredRenewals]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                        <Repeat className="w-8 h-8 text-purple-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">Renewals</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-500 border border-purple-500/30 flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            Google Sheets
                        </span>
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`p-2 rounded-lg bg-bg-hover text-text-muted hover:text-text-main hover:bg-bg-hover/70 transition-all ${isLoading ? 'animate-spin opacity-50' : ''}`}
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="ค้นหาเดือน, ปี..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกปี" },
                                ...uniqueYears.map(y => ({ value: y, label: y }))
                            ]}
                            value={yearFilter}
                            onChange={setYearFilter}
                            className="w-[120px]"
                            placeholder="ปี"
                            icon={<Calendar className="w-3.5 h-3.5" />}
                        />

                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกเดือน" },
                                ...uniqueMonths.map(m => ({ value: m, label: m }))
                            ]}
                            value={monthFilter}
                            onChange={setMonthFilter}
                            className="w-[140px]"
                            placeholder="เดือน"
                            icon={<Calendar className="w-3.5 h-3.5" />}
                        />

                        {/* Summary Cards */}
                        <div className="flex items-center gap-3 ml-auto">
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] text-emerald-500 font-bold uppercase">ต่อสัญญา</span>
                                <p className="text-sm font-bold text-emerald-500">{formatCurrency(totals.renewed)}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <span className="text-[10px] text-rose-500 font-bold uppercase">ไม่ต่อ</span>
                                <p className="text-sm font-bold text-rose-500">{formatCurrency(totals.notRenewed)}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <span className="text-[10px] text-amber-500 font-bold uppercase">รอคำตอบ</span>
                                <p className="text-sm font-bold text-amber-500">{formatCurrency(totals.pending)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-260px)]">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="text-sm text-text-muted">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                                    <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                        <th className="px-6 py-4 font-semibold w-[8%] text-center">ลำดับ</th>
                                        <th className="px-6 py-4 font-semibold w-[12%] text-center">ปี</th>
                                        <th className="px-6 py-4 font-semibold w-[12%] text-center">เดือน</th>
                                        <th className="px-6 py-4 font-semibold w-[23%] text-right">ยอดต่อสัญญา</th>
                                        <th className="px-6 py-4 font-semibold w-[23%] text-right">ไม่ต่อสัญญา</th>
                                        <th className="px-6 py-4 font-semibold w-[22%] text-right">รอคำตอบ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRenewals.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16 text-text-muted opacity-60">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedRenewals.map((renewal, index) => (
                                            <tr
                                                key={renewal.id || index}
                                                className="border-b border-border-light hover:bg-bg-hover transition-colors"
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-mono text-text-muted opacity-50">{renewal.index}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-bold text-text-main opacity-80">{renewal.year}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs text-purple-500 font-medium">{renewal.month}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-base font-bold text-emerald-500">
                                                        {formatCurrency(renewal.renewedAmount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-base font-bold text-rose-500">
                                                        {formatCurrency(renewal.notRenewedAmount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-base font-bold text-amber-500">
                                                        {formatCurrency(renewal.pendingAmount)}
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
                            <div className="p-4 border-t border-border-light flex items-center justify-between shrink-0 bg-bg-hover/30">
                                <p className="text-xs text-text-muted">
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedRenewals.length)} จาก {sortedRenewals.length.toLocaleString()} รายการ
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-hover hover:bg-bg-hover/70 text-text-main border border-border-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ก่อนหน้า
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-medium text-text-muted">
                                        หน้า {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-hover hover:bg-bg-hover/70 text-text-main border border-border-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
