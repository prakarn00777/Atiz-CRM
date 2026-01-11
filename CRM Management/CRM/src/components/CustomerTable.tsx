"use client";

import { useState } from "react";
import { Search, Edit2, Trash2, MapPin, Filter, Plus, ExternalLink, Clock } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface Branch {
    name: string;
    isMain: boolean;
    address?: string;
}

interface Customer {
    id: number;
    name: string;
    link: string;
    package: string;
    status: string;
    branches?: Branch[];
    product?: "Dr.Ease" | "EasePos";
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export default function CustomerTable({ customers, onEdit, onDelete, onAdd }: CustomerTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [packageFilter, setPackageFilter] = useState("all");
    const [productFilter, setProductFilter] = useState<"all" | "Dr.Ease" | "EasePos">("all");
    // "ระบบลูกค้ามี 2 ประเภท... แสดงผล table เดียวกัน... หรือแยกเมนู หรือแท็ปเลย" -> I suggested Tab.
    // Let's implement Tab state: "all", "Dr.Ease", "EasePos"

    // Filter logic
    const filteredCustomers = customers.filter((c) => {
        const matchesProduct = productFilter === "all" || c.product === productFilter || (!c.product && productFilter === "Dr.Ease"); // Handle legacy data as Dr.Ease or just show in All? Let's assume legacy is Dr.Ease for safety or show in all.
        // Actually, let's strict match. If undefined, maybe show in 'all' only?
        // Let's assume default product is Dr.Ease if missing for legacy compatibility? Or just 'all'.
        // Let's make it: strict match if filter is set.

        const matchesSearch =
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `DE${c.id.toString().padStart(4, "0")}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        const matchesPackage = packageFilter === "all" || c.package === packageFilter;

        if (productFilter !== "all" && c.product !== productFilter) return false;

        return matchesSearch && matchesStatus && matchesPackage;
    });

    // Sort: Latest ID top
    const sortedCustomers = [...filteredCustomers].sort((a, b) => b.id - a.id);

    // Pagination
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
                                    { value: "all", label: "สถานะทั้งหมด" },
                                    { value: "ใช้งาน", label: "ใช้งาน" },
                                    { value: "ติดตั้งแล้ว", label: "ติดตั้งแล้ว" },
                                    { value: "รอการใช้งาน", label: "รอการใช้งาน" },
                                    { value: "ยกเลิก", label: "ยกเลิก" },
                                ]}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                                className="w-[140px]"
                                placeholder="สถานะ"
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

                        <button onClick={onAdd} className="btn btn-primary px-4 py-2 h-9 ml-auto shrink-0">
                            <Plus className="w-4 h-4" />
                            <span>เพิ่มลูกค้า</span>
                        </button>
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
                                <th className="px-4 py-3 font-semibold w-[20%]">Link</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Package</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Branches</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[15%] text-right">Actions</th>
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
                                                DE{c.id.toString().padStart(4, "0")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <div className="font-semibold text-slate-200 text-xs truncate max-w-[150px]" title={c.name}>
                                                    {c.name}
                                                </div>
                                                <span className={`text-[10px] w-fit px-1.5 rounded mt-1 font-medium ${c.product === "EasePos"
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                    }`}>
                                                    {c.product || "Dr.Ease"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <a
                                                href={c.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline truncate block max-w-[150px]"
                                                title={c.link}
                                            >
                                                {c.link}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-300 font-medium">{c.package}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${c.status === "ใช้งาน" ? "bg-emerald-500/10 text-emerald-400" :
                                                c.status === "ติดตั้งแล้ว" ? "bg-blue-500/10 text-blue-400" :
                                                    c.status === "รอการใช้งาน" ? "bg-amber-500/10 text-amber-400" :
                                                        "bg-rose-500/10 text-rose-400"
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {c.branches && c.branches.length > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                                                    <MapPin className="w-3 h-3 text-indigo-400" />
                                                    <span className="text-xs font-medium text-slate-300">
                                                        {c.branches.length} <span className="text-slate-500 text-[10px] ml-0.5">สาขา</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-600">-</span>
                                            )}
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
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => onEdit(c)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(c.id)}
                                                    className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">
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
