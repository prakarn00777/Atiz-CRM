"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Phone, User, Tag, Briefcase, MessageSquare, Building2, ExternalLink, Loader2, RefreshCw, Monitor } from "lucide-react";
import CustomSelect from "./CustomSelect";
import CustomDatePicker from "./CustomDatePicker";
import { MasterDemoLead } from "@/types";

const parseSheetDate = (dateVal: string | undefined) => {
    if (!dateVal) return null;
    const parts = dateVal.split('/');
    if (parts.length === 3) {
        const d = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[2]);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
            return new Date(y, m, d);
        }
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
};

const parseLocalISO = (isoStr: string) => {
    if (!isoStr) return null;
    const parts = isoStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(isoStr);
};

interface DemoManagerProps {
    demos: MasterDemoLead[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

export default function DemoManager({ demos, isLoading, onRefresh }: DemoManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [productFilter, setProductFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [salesFilter, setSalesFilter] = useState("all");
    const [demoStatusFilter, setDemoStatusFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Get unique values for filters
    const uniqueProducts = useMemo(() => [...new Set(demos.map(d => d.product).filter(Boolean))], [demos]);
    const uniqueSources = useMemo(() => [...new Set(demos.map(d => d.source).filter(Boolean))], [demos]);
    const uniqueSales = useMemo(() => [...new Set(demos.map(d => d.salesperson || d.salesName).filter(Boolean))], [demos]);
    const uniqueDemoStatuses = useMemo(() => [...new Set(demos.map(d => d.demoStatus).filter(Boolean))], [demos]);

    const filteredDemos = useMemo(() => demos.filter((d) => {
        const matchesSearch =
            (d.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.leadNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.clinicName || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesProduct = productFilter === "all" || d.product === productFilter;
        const matchesSource = sourceFilter === "all" || d.source === sourceFilter;
        const salesperson = d.salesperson || d.salesName;
        const matchesSales = salesFilter === "all" || salesperson === salesFilter;
        const matchesDemoStatus = demoStatusFilter === "all" || d.demoStatus === demoStatusFilter;

        const demoDate = parseSheetDate(d.date);
        const sDate = parseLocalISO(startDate);
        const eDate = parseLocalISO(endDate);
        if (eDate) eDate.setHours(23, 59, 59, 999);

        const matchesDateRange = (!sDate || (demoDate && demoDate >= sDate)) &&
            (!eDate || (demoDate && demoDate <= eDate));

        return matchesSearch && matchesProduct && matchesSource && matchesSales && matchesDemoStatus && matchesDateRange;
    }), [demos, searchTerm, productFilter, sourceFilter, salesFilter, demoStatusFilter, startDate, endDate]);

    // Sort by date descending (latest first)
    const sortedDemos = useMemo(() => [...filteredDemos].sort((a, b) => {
        const dateA = parseSheetDate(a.date);
        const dateB = parseSheetDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
    }), [filteredDemos]);

    const itemsPerPage = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = useMemo(() => Math.ceil(sortedDemos.length / itemsPerPage), [sortedDemos]);
    const paginatedDemos = useMemo(() => sortedDemos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [sortedDemos, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, productFilter, sourceFilter, salesFilter, demoStatusFilter, startDate, endDate]);

    const getDemoStatusBadge = (status: string) => {
        if (!status) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-500 border border-slate-500/30">-</span>;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('demo แล้ว') || statusLower.includes('เสร็จ')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">{status}</span>;
        }
        if (statusLower.includes('ยังไม่ได้') || statusLower.includes('รอ')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30">{status}</span>;
        }
        if (statusLower.includes('ปฏิเสธ') || statusLower.includes('ปฎิเสธ') || statusLower.includes('ยกเลิก')) {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">{status}</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-hover text-text-muted border border-border-light">{status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight text-text-main">Demos</h1>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30 flex items-center gap-1.5">
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
                            placeholder="ค้นหาชื่อ, เบอร์, เลขลีด..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <div className="w-[160px]">
                            <CustomDatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="วันที่เริ่มต้น"
                            />
                        </div>
                        <div className="w-[160px]">
                            <CustomDatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="วันที่สิ้นสุด"
                            />
                        </div>

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
                                { value: "all", label: "ทุกสถานะ Demo" },
                                ...uniqueDemoStatuses.map(s => ({ value: s, label: s }))
                            ]}
                            value={demoStatusFilter}
                            onChange={setDemoStatusFilter}
                            className="w-[160px]"
                            placeholder="สถานะ Demo"
                            icon={<Monitor className="w-3.5 h-3.5" />}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-220px)]">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-text-muted">กำลังโหลดข้อมูลจาก Google Sheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                                    <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                        <th className="px-3 py-3 font-semibold w-[4%] text-center">No.</th>
                                        <th className="px-3 py-3 font-semibold w-[9%] text-center">เลขที่ลีด</th>
                                        <th className="px-3 py-3 font-semibold w-[8%] text-center">วันที่</th>
                                        <th className="px-3 py-3 font-semibold w-[8%]">Product</th>
                                        <th className="px-3 py-3 font-semibold w-[8%]">ช่องทาง</th>
                                        <th className="px-3 py-3 font-semibold w-[7%] text-center">เซลล์</th>
                                        <th className="px-3 py-3 font-semibold w-[14%]">ชื่อลูกค้า</th>
                                        <th className="px-3 py-3 font-semibold w-[10%]">เบอร์โทร</th>
                                        <th className="px-3 py-3 font-semibold w-[11%]">สถานะ Demo</th>
                                        <th className="px-3 py-3 font-semibold w-[12%]">คลินิก/ธุรกิจ</th>
                                        <th className="px-3 py-3 font-semibold w-[9%]">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDemos.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="text-center py-16 text-text-muted opacity-60">
                                                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedDemos.map((demo, index) => (
                                            <tr
                                                key={demo.id || index}
                                                className="border-b border-border-light hover:bg-bg-hover transition-colors"
                                            >
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-mono text-text-muted opacity-50">{sortedDemos.length - ((currentPage - 1) * itemsPerPage + index)}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="font-mono text-xs font-bold text-blue-500">{demo.leadNumber}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs text-text-muted opacity-70">{demo.date}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`text-xs font-semibold ${demo.product === 'Dr.Ease' ? 'text-[#6239FC]' : 'text-[#F76D85]'}`}>
                                                        {demo.product}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-text-main opacity-80">{demo.source}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-xs font-medium text-text-main">{demo.salesperson || demo.salesName}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs font-medium text-text-main">{demo.customerName}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs font-mono text-text-muted opacity-70">{demo.phone}</span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {getDemoStatusBadge(demo.demoStatus)}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-text-muted opacity-70 truncate block max-w-[120px]" title={demo.clinicName}>
                                                        {demo.clinicName}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-xs text-text-muted opacity-50 truncate block max-w-[100px]" title={demo.notes}>
                                                        {demo.notes}
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
                                    แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedDemos.length)} จาก {sortedDemos.length.toLocaleString()} รายการ
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
