"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, Users } from "lucide-react";
import CustomSelect from "./CustomSelect";
import { Customer } from "@/types";
import CustomerRow from "./rows/CustomerRow";

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
}

const CustomerTable = React.memo(function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [usageStatusFilter, setUsageStatusFilter] = useState("all");

    // Debounce search input - only update searchTerm after 300ms of no typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);
    const [installationStatusFilter, setInstallationStatusFilter] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");
    const [productFilter, setProductFilter] = useState<"all" | "Dr.Ease" | "EasePos">("all");

    // Memoize filter and sort for performance
    const filteredCustomers = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return customers.filter((c) => {
            const matchesSearch =
                (c.name || "").toLowerCase().includes(searchLower) ||
                (c.subdomain || "").toLowerCase().includes(searchLower) ||
                `DE${c.id.toString().padStart(4, "0")}`.toLowerCase().includes(searchLower);
            const matchesUsageStatus = usageStatusFilter === "all" || c.usageStatus === usageStatusFilter;
            const matchesInstallationStatus = installationStatusFilter === "all" || c.installationStatus === installationStatusFilter;
            const matchesPackage = packageFilter === "all" || c.package === packageFilter;
            const matchesProduct = productFilter === "all" || c.productType === productFilter;

            return matchesSearch && matchesUsageStatus && matchesInstallationStatus && matchesPackage && matchesProduct;
        });
    }, [customers, searchTerm, usageStatusFilter, installationStatusFilter, packageFilter, productFilter]);

    const sortedCustomers = useMemo(() => {
        return [...filteredCustomers].sort((a, b) => b.id - a.id);
    }, [filteredCustomers]);

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
    const paginatedCustomers = sortedCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-main">Customers</h1>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchInput}
                            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "ทุกประเภท" },
                                    { value: "Dr.Ease", label: "Dr.Ease (คลินิก)" },
                                    { value: "EasePos", label: "EasePos (ร้านค้า)" },
                                ]}
                                value={productFilter}
                                onChange={(val) => { setProductFilter(val as any); setCurrentPage(1); }}
                                className="w-[140px]"
                                placeholder="ประเภท"
                                icon={<Filter className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "สถานะใช้งานทั้งหมด" },
                                    { value: "Training", label: "รอการเทรนนิ่ง" },
                                    { value: "Pending", label: "รอการใช้งาน" },
                                    { value: "Active", label: "ใช้งานแล้ว" },
                                    { value: "Canceled", label: "ยกเลิก" },
                                ]}
                                value={usageStatusFilter}
                                onChange={(val) => { setUsageStatusFilter(val); setCurrentPage(1); }}
                                className="w-[170px]"
                                placeholder="สถานะใช้งาน"
                                icon={<Filter className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "สถานะติดตั้งทั้งหมด" },
                                    { value: "Pending", label: "Pending" },
                                    { value: "Completed", label: "Completed" },
                                ]}
                                value={installationStatusFilter}
                                onChange={(val) => { setInstallationStatusFilter(val); setCurrentPage(1); }}
                                className="w-[180px]"
                                placeholder="สถานะติดตั้ง"
                                icon={<Filter className="w-3.5 h-3.5" />}
                            />
                        </div>

                        <div className="relative shrink-0">
                            <CustomSelect
                                options={[
                                    { value: "all", label: "ทุกแพ็คเกจ" },
                                    { value: "Starter", label: "Starter" },
                                    { value: "Standard", label: "Standard" },
                                    { value: "Elite", label: "Elite" },
                                ]}
                                value={packageFilter}
                                onChange={(val) => { setPackageFilter(val); setCurrentPage(1); }}
                                className="w-[140px]"
                                placeholder="แพ็คเกจ"
                                icon={<Filter className="w-3.5 h-3.5" />}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-175px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                            <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                <th className="px-3 py-3 font-semibold w-[4%] text-center">No.</th>
                                <th className="px-3 py-3 font-semibold w-[7%] text-center">ID</th>
                                <th className="px-3 py-3 font-semibold w-[14%]">Clinic/Shop Name</th>
                                <th className="px-3 py-3 font-semibold w-[16%]">Subdomain</th>
                                <th className="px-3 py-3 font-semibold w-[8%] text-center">ประเภท</th>
                                <th className="px-3 py-3 font-semibold w-[7%] text-center">Package</th>
                                <th className="px-3 py-3 font-semibold w-[10%] text-center">สถานะใช้งาน</th>
                                <th className="px-3 py-3 font-semibold w-[10%] text-center">สถานะติดตั้ง</th>
                                <th className="px-3 py-3 font-semibold w-[12%]">Modified By</th>
                                <th className="px-3 py-3 font-semibold w-[5%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((c, index) => (
                                    <CustomerRow
                                        key={c.id}
                                        customer={c}
                                        rowNumber={(currentPage - 1) * itemsPerPage + index + 1}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center">
                                                <Users className="w-8 h-8 text-text-muted opacity-50" />
                                            </div>
                                            <p className="text-text-muted text-sm">ไม่พบข้อมูลลูกค้า</p>
                                            <p className="text-text-muted text-xs opacity-70">ลองปรับตัวกรองหรือค้นหาใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls - Enhanced Design */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border-light bg-gradient-to-r from-bg-hover to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-text-main">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <div className="h-4 w-px bg-border-light mx-2"></div>
                                <span className="text-xs text-text-muted">
                                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, sortedCustomers.length)} จาก {sortedCustomers.length} รายการ
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
                                    title="หน้าแรก"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main text-xs font-medium group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    ก่อนหน้า
                                </button>

                                <div className="flex gap-1">
                                    {(() => {
                                        const pageNumbers = [];
                                        const maxVisible = 5;

                                        if (totalPages <= maxVisible) {
                                            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                                        } else {
                                            if (currentPage <= 3) {
                                                for (let i = 1; i <= 4; i++) pageNumbers.push(i);
                                                pageNumbers.push('...');
                                                pageNumbers.push(totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumbers.push(1);
                                                pageNumbers.push('...');
                                                for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
                                            } else {
                                                pageNumbers.push(1);
                                                pageNumbers.push('...');
                                                for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
                                                pageNumbers.push('...');
                                                pageNumbers.push(totalPages);
                                            }
                                        }

                                        return pageNumbers.map((page, idx) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-xs">•••</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${currentPage === page
                                                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                                                        : "hover:bg-bg-hover text-text-muted hover:text-text-main hover:scale-105"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ));
                                    })()}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 h-8 rounded-lg flex items-center gap-1.5 hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main text-xs font-medium group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
                                >
                                    ถัดไป
                                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-main group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer disabled:cursor-not-allowed"
                                    title="หน้าสุดท้าย"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default CustomerTable;
