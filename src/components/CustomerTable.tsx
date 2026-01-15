"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Edit2, Trash2, MapPin, Filter, ExternalLink, Clock, MoreVertical, Plus } from "lucide-react";
import CustomSelect from "./CustomSelect";
import Papa from "papaparse";
import { Customer, Branch } from "@/types";

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
    onImport?: (data: any[]) => Promise<void>;
}

export default function CustomerTable({ customers, onEdit, onDelete, onImport }: CustomerTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [usageStatusFilter, setUsageStatusFilter] = useState("all");
    const [installationStatusFilter, setInstallationStatusFilter] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");
    const [productFilter, setProductFilter] = useState<"all" | "Dr.Ease" | "EasePos">("all");

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

    const filteredCustomers = customers.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.subdomain || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            `DE${c.id.toString().padStart(4, "0")}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUsageStatus = usageStatusFilter === "all" || c.usageStatus === usageStatusFilter;
        const matchesInstallationStatus = installationStatusFilter === "all" || c.installationStatus === installationStatusFilter;
        const matchesPackage = packageFilter === "all" || c.package === packageFilter;
        const matchesProduct = productFilter === "all" || c.productType === productFilter;

        return matchesSearch && matchesUsageStatus && matchesInstallationStatus && matchesPackage && matchesProduct;
    });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => b.id - a.id);

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
                    <h1 className="text-3xl font-bold tracking-tight mb-2">จัดการข้อมูลลูกค้า</h1>
                    <p className="text-slate-400 text-sm">จัดการข้อมูลลูกค้าในระบบ Dr.Ease และ EasePos</p>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full">
                    <div className="relative w-full md:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-9 py-1.5 text-xs h-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {onImport && (
                            <label className="btn btn-ghost h-9 px-3 gap-2 text-xs flex items-center cursor-pointer border border-white/10 hover:border-indigo-500/50 transition-all font-medium text-slate-300">
                                <Plus className="w-3.5 h-3.5" />
                                Import CSV
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            Papa.parse(file, {
                                                header: true,
                                                skipEmptyLines: true,
                                                complete: (results) => {
                                                    onImport(results.data);
                                                }
                                            });
                                        }
                                    }}
                                />
                            </label>
                        )}

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
                                    { value: "Active", label: "Active (ใช้งาน)" },
                                    { value: "Trial", label: "Trial (ทดลองใช้)" },
                                    { value: "Inactive", label: "Inactive (ปิดปรับปรุง)" },
                                    { value: "Canceled", label: "Canceled (ยกเลิก)" },
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
                                    { value: "Pending", label: "Pending (รอติดตั้ง)" },
                                    { value: "In Progress", label: "In Progress (กำลังติดตั้ง)" },
                                    { value: "Installed", label: "Installed (ติดตั้งแล้ว)" },
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
                        <thead className="sticky top-0 z-10 bg-[#0f172a] shadow-sm">
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-4 py-3 font-semibold w-[5%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">ID</th>
                                <th className="px-4 py-3 font-semibold w-[20%]">Clinic/Shop Name</th>
                                <th className="px-4 py-3 font-semibold w-[20%]">Subdomain</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Package</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Branches</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((c, index) => (
                                    <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-mono text-slate-400">
                                                {c.clientCode || `DE${c.id.toString().padStart(4, "0")}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-slate-200 text-xs truncate max-w-[150px]" title={c.name}>
                                                    {c.name}
                                                </div>
                                                <span className={`text-[10px] w-fit px-1.5 rounded mt-1 font-medium ${c.productType === "EasePos"
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                    }`}>
                                                    {c.productType || "Dr.Ease"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-indigo-400 truncate block max-w-[150px]" title={c.subdomain}>
                                                {c.subdomain || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-300 font-medium">{c.package}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${c.usageStatus === "Active" ? "bg-emerald-500/10 text-emerald-400" :
                                                    c.usageStatus === "Trial" ? "bg-amber-500/10 text-amber-400" :
                                                        c.usageStatus === "Inactive" ? "bg-slate-500/10 text-slate-400" :
                                                            "bg-rose-500/10 text-rose-400"
                                                    }`}>
                                                    {c.usageStatus}
                                                </span>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${c.installationStatus === "Installed" ? "bg-blue-500/10 text-blue-400" :
                                                    c.installationStatus === "In Progress" ? "bg-cyan-500/10 text-cyan-400" :
                                                        "bg-purple-500/10 text-purple-400"
                                                    }`}>
                                                    {c.installationStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                                                <MapPin className="w-3 h-3 text-indigo-400" />
                                                <span className="text-xs font-medium text-slate-300">
                                                    {1 + (c.branches?.filter(b => !b.isMain).length || 0)} <span className="text-slate-500 text-[10px] ml-0.5">สาขา</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.modifiedBy ? (
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-300">{c.modifiedBy}</span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(c.modifiedAt!).toLocaleString('th-TH', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={(e) => handleMenuToggle(e, c.id)}
                                                    className={`p-2 rounded-lg transition-colors ${activeMenu === c.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {mounted && activeMenu === c.id && menuPosition && createPortal(
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
                                                            onClick={() => { onEdit(c); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            แก้ไขข้อมูล
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={async () => {
                                                                const customerId = c.clientCode || `DE${c.id.toString().padStart(4, "0")}`;
                                                                const url = `${window.location.origin.replace('3000', '3001')}/login?id=${customerId}`;
                                                                try {
                                                                    await navigator.clipboard.writeText(url);
                                                                    alert("คัดลอกลิงก์ Console แล้ว: " + url);
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            ลิงก์ Console
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={() => { onDelete(c.id); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            ลบรายการ
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
                                        ไม่พบข้อมูลลูกค้า
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} จาก {sortedCustomers.length} รายการ
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
        </div>
    );
}
