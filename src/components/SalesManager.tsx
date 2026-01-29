"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, User, Calendar, DollarSign, ExternalLink, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { NewSalesRecord } from "@/types";

interface SalesManagerProps {
    sales: NewSalesRecord[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

export default function SalesManager({ sales, isLoading, onRefresh }: SalesManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [monthFilter, setMonthFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");
    const [salesFilter, setSalesFilter] = useState("all");

    // Get unique values for filters
    const uniqueMonths = useMemo(() => [...new Set(sales.map(s => s.month).filter(Boolean))], [sales]);
    const uniqueYears = useMemo(() => [...new Set(sales.map(s => s.year).filter(Boolean))], [sales]);
    const uniqueSales = useMemo(() => [...new Set(sales.map(s => s.salesName).filter(Boolean))], [sales]);

    const filteredSales = useMemo(() => sales.filter((s) => {
        const matchesSearch =
            (s.salesName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.month || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.year || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMonth = monthFilter === "all" || s.month === monthFilter;
        const matchesYear = yearFilter === "all" || s.year === yearFilter;
        const matchesSales = salesFilter === "all" || s.salesName === salesFilter;

        return matchesSearch && matchesMonth && matchesYear && matchesSales;
    }), [sales, searchTerm, monthFilter, yearFilter, salesFilter]);

    // Sort by index descending (latest first if index is sequence)
    const sortedSales = useMemo(() => [...filteredSales].sort((a, b) => {
        const idxA = parseInt(a.index) || 0;
        const idxB = parseInt(b.index) || 0;
        return idxB - idxA;
    }), [filteredSales]);

    const itemsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedSales.length / itemsPerPage), [sortedSales]);
    const paginatedSales = useMemo(() => sortedSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedSales, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, monthFilter, yearFilter, salesFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold tracking-tight">New Sales</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            Google Sheets
                        </span>
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all ${isLoading ? 'animate-spin opacity-50' : ''}`}
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อเซลล์, เดือน, ปี..."
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

                        <CustomSelect
                            options={[
                                { value: "all", label: "เซลล์ทุกคน" },
                                ...uniqueSales.map(s => ({ value: s, label: s }))
                            ]}
                            value={salesFilter}
                            onChange={setSalesFilter}
                            className="w-[160px]"
                            placeholder="Sales"
                            icon={<User className="w-3.5 h-3.5" />}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-220px)]">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                            <p className="text-sm text-slate-400">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                                    <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                        <th className="px-6 py-4 font-semibold w-[10%] text-center">ลำดับ</th>
                                        <th className="px-6 py-4 font-semibold w-[15%] text-center">ปี</th>
                                        <th className="px-6 py-4 font-semibold w-[15%] text-center">เดือน</th>
                                        <th className="px-6 py-4 font-semibold w-[30%]">ชื่อเซลล์</th>
                                        <th className="px-6 py-4 font-semibold w-[30%] text-right">ยอดรวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16 text-slate-500">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSales.map((sale, index) => (
                                            <tr
                                                key={sale.id || index}
                                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-mono text-slate-500">{sale.index}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-bold text-slate-300">{sale.year}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs text-indigo-400 font-medium">{sale.month}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                            <User className="w-4 h-4 text-indigo-400" />
                                                        </div>
                                                        <span className="text-sm font-medium text-white">{sale.salesName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-base font-bold text-emerald-400">
                                                        {formatCurrency(sale.amount)}
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
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedSales.length)} จาก {sortedSales.length.toLocaleString()} รายการ
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
