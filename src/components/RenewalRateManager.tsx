"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, ExternalLink, Loader2, RefreshCw, TrendingUp, Package } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { RenewalRateRecord } from "@/types";

interface RenewalRateManagerProps {
    renewalRates: RenewalRateRecord[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

export default function RenewalRateManager({ renewalRates, isLoading, onRefresh }: RenewalRateManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [productFilter, setProductFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");

    const uniqueProducts = useMemo(() => [...new Set(renewalRates.map(r => r.product).filter(Boolean))], [renewalRates]);
    const uniqueYears = useMemo(() => [...new Set(renewalRates.map(r => r.year).filter(Boolean))], [renewalRates]);
    const uniqueMonths = useMemo(() => [...new Set(renewalRates.map(r => r.month).filter(Boolean))], [renewalRates]);

    const filteredData = useMemo(() => renewalRates.filter((r) => {
        const matchesSearch =
            (r.month || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.product || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProduct = productFilter === "all" || r.product === productFilter;
        const matchesYear = yearFilter === "all" || r.year === yearFilter;
        const matchesMonth = monthFilter === "all" || r.month === monthFilter;

        return matchesSearch && matchesProduct && matchesYear && matchesMonth;
    }), [renewalRates, searchTerm, productFilter, yearFilter, monthFilter]);

    const monthOrder: Record<string, number> = {
        "ม.ค.": 1, "ก.พ.": 2, "มี.ค.": 3, "เม.ย.": 4, "พ.ค.": 5, "มิ.ย.": 6,
        "ก.ค.": 7, "ส.ค.": 8, "ก.ย.": 9, "ต.ค.": 10, "พ.ย.": 11, "ธ.ค.": 12,
        "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4, "พฤษภาคม": 5, "มิถุนายน": 6,
        "กรกฎาคม": 7, "สิงหาคม": 8, "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
    };

    const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearB !== yearA) return yearB - yearA;
        const monthA = monthOrder[a.month] || 0;
        const monthB = monthOrder[b.month] || 0;
        return monthB - monthA;
    }), [filteredData]);

    const itemsPerPage = 24;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedData.length / itemsPerPage), [sortedData]);
    const paginatedData = useMemo(() => sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedData, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, productFilter, yearFilter, monthFilter]);

    const calcRate = (renewed: number, notRenewed: number) => {
        const total = renewed + notRenewed;
        if (total === 0) return "-";
        return ((renewed / total) * 100).toFixed(1) + "%";
    };

    // Calculate totals
    const totals = useMemo(() => {
        const renewed = filteredData.reduce((sum, r) => sum + (r.renewed || 0), 0);
        const notRenewed = filteredData.reduce((sum, r) => sum + (r.notRenewed || 0), 0);
        const pending = filteredData.reduce((sum, r) => sum + (r.pending || 0), 0);
        return { renewed, notRenewed, pending };
    }, [filteredData]);

    const totalRate = calcRate(totals.renewed, totals.notRenewed);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8 text-teal-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">Renewal Rate</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-500 border border-teal-500/30 flex items-center gap-1.5">
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
                            placeholder="ค้นหาเดือน, product..."
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
                            className="w-[150px]"
                            placeholder="Product"
                            icon={<Package className="w-3.5 h-3.5" />}
                        />

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
                                <p className="text-sm font-bold text-emerald-500">{totals.renewed.toLocaleString()}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <span className="text-[10px] text-rose-500 font-bold uppercase">ไม่ต่อ</span>
                                <p className="text-sm font-bold text-rose-500">{totals.notRenewed.toLocaleString()}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <span className="text-[10px] text-amber-500 font-bold uppercase">รอคำตอบ</span>
                                <p className="text-sm font-bold text-amber-500">{totals.pending.toLocaleString()}</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                <span className="text-[10px] text-teal-500 font-bold uppercase">อัตราต่อสัญญา</span>
                                <p className="text-sm font-bold text-teal-500">{totalRate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-260px)]">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                            <p className="text-sm text-text-muted">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                                    <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                        <th className="px-6 py-4 font-semibold w-[12%]">เดือน</th>
                                        <th className="px-6 py-4 font-semibold w-[8%] text-center">ปี</th>
                                        <th className="px-6 py-4 font-semibold w-[13%]">Product</th>
                                        <th className="px-6 py-4 font-semibold w-[13%] text-right">ต่อสัญญา</th>
                                        <th className="px-6 py-4 font-semibold w-[13%] text-right">ไม่ต่อ</th>
                                        <th className="px-6 py-4 font-semibold w-[13%] text-right">รอคำตอบ</th>
                                        <th className="px-6 py-4 font-semibold w-[12%] text-right">รวม</th>
                                        <th className="px-6 py-4 font-semibold w-[10%] text-right">% ต่อสัญญา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-text-muted opacity-60">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, index) => {
                                            const total = row.renewed + row.notRenewed + row.pending;
                                            const rate = calcRate(row.renewed, row.notRenewed);
                                            const rateNum = parseFloat(rate);
                                            const rateColor = isNaN(rateNum) ? "text-text-muted" : rateNum >= 70 ? "text-emerald-500" : rateNum >= 50 ? "text-amber-500" : "text-rose-500";

                                            return (
                                                <tr
                                                    key={row.id || index}
                                                    className="border-b border-border-light hover:bg-bg-hover transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-text-main">{row.month}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold text-text-main opacity-80">{row.year}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                                                            style={row.product === "Dr.Ease"
                                                                ? { backgroundColor: 'rgba(98, 57, 252, 0.15)', color: '#6239FC', borderColor: 'rgba(98, 57, 252, 0.2)' }
                                                                : { backgroundColor: 'rgba(247, 109, 133, 0.15)', color: '#F76D85', borderColor: 'rgba(247, 109, 133, 0.2)' }
                                                            }
                                                        >
                                                            {row.product}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-emerald-500">{row.renewed.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-rose-500">{row.notRenewed.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-amber-500">{row.pending.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-bold text-text-main">{total.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-bold ${rateColor}`}>{rate}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border-light flex items-center justify-between shrink-0 bg-bg-hover/30">
                                <p className="text-xs text-text-muted">
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} จาก {filteredData.length.toLocaleString()} รายการ
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
