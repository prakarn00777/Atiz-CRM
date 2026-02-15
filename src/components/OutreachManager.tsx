"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, Loader2, RefreshCw, MessageCircle, ExternalLink } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { OutreachRecord } from "@/types";

interface OutreachManagerProps {
    outreach: OutreachRecord[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

export default function OutreachManager({ outreach, isLoading, onRefresh }: OutreachManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [monthFilter, setMonthFilter] = useState("all");

    const uniqueMonths = useMemo(() => {
        const months = outreach.map(o => o.month).filter(Boolean);
        return [...new Set(months)];
    }, [outreach]);

    const filteredData = useMemo(() => outreach.filter((o) => {
        const matchesSearch =
            o.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.month.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = monthFilter === "all" || o.month === monthFilter;
        return matchesSearch && matchesMonth;
    }), [outreach, searchTerm, monthFilter]);

    // Sort by date (latest first) — reverse row order since sheet is chronological
    const sortedData = useMemo(() => [...filteredData].reverse(), [filteredData]);

    const itemsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedData.length / itemsPerPage), [sortedData]);
    const paginatedData = useMemo(() => sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedData, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, monthFilter]);

    // Summary for filtered data
    const summary = useMemo(() => {
        const data = filteredData;
        return {
            totalContactedDr: data.reduce((sum, o) => sum + o.contactedDr, 0),
            totalQualifiedDr: data.reduce((sum, o) => sum + o.qualifiedDr, 0),
            totalContactedEase: data.reduce((sum, o) => sum + o.contactedEase, 0),
            totalQualifiedEase: data.reduce((sum, o) => sum + o.qualifiedEase, 0),
            days: data.length,
        };
    }, [filteredData]);

    const avgPerDay = (total: number) => summary.days > 0 ? (total / summary.days).toFixed(1) : "0";

    return (
        <div className="flex flex-col gap-3 h-[calc(100vh-64px)]">
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <MessageCircle className="w-8 h-8 text-violet-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">Outreach</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-500 border border-violet-500/30 flex items-center gap-1.5">
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

                <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="ค้นหาวันที่..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
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
                    </div>
                </div>
            </div>

            {/* Summary Cards — compact */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-text-muted">ทัก Dr.Ease</p>
                    <p className="text-lg font-bold font-mono text-indigo-500">{summary.totalContactedDr.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted opacity-60">{avgPerDay(summary.totalContactedDr)}/วัน</p>
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-text-muted">ลืด Dr.Ease</p>
                    <p className="text-lg font-bold font-mono text-indigo-400">{summary.totalQualifiedDr.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted opacity-60">{avgPerDay(summary.totalQualifiedDr)}/วัน</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-text-muted">ทัก EasePos</p>
                    <p className="text-lg font-bold font-mono text-rose-500">{summary.totalContactedEase.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted opacity-60">{avgPerDay(summary.totalContactedEase)}/วัน</p>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-text-muted">ลืด EasePos</p>
                    <p className="text-lg font-bold font-mono text-rose-400">{summary.totalQualifiedEase.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted opacity-60">{avgPerDay(summary.totalQualifiedEase)}/วัน</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                            <p className="text-sm text-text-muted">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                                    <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                        <th className="px-3 py-3 font-semibold w-[20%]">วันที่</th>
                                        <th className="px-3 py-3 font-semibold w-[20%] text-center">
                                            <span className="text-indigo-500">ทัก Dr</span>
                                        </th>
                                        <th className="px-3 py-3 font-semibold w-[20%] text-center">
                                            <span className="text-indigo-500">ลืด Dr</span>
                                        </th>
                                        <th className="px-3 py-3 font-semibold w-[20%] text-center">
                                            <span className="text-rose-500">ทัก Ease</span>
                                        </th>
                                        <th className="px-3 py-3 font-semibold w-[20%] text-center">
                                            <span className="text-rose-500">ลืด Ease</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16 text-text-muted opacity-60">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, index) => (
                                            <tr
                                                key={row.id || index}
                                                className="border-b border-border-light hover:bg-bg-hover transition-colors"
                                            >
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs font-medium text-text-main">{row.date}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono font-bold text-indigo-500">{row.contactedDr}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono font-bold text-indigo-400">{row.qualifiedDr}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono font-bold text-rose-500">{row.contactedEase}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono font-bold text-rose-400">{row.qualifiedEase}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border-light flex items-center justify-between shrink-0 bg-bg-hover/30">
                                <p className="text-xs text-text-muted">
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} จาก {sortedData.length.toLocaleString()} รายการ
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