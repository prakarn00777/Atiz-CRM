"use client";

import { Plus, Edit2, Trash2, ExternalLink } from "lucide-react";

interface Customer {
    id: number;
    name: string;
    link: string;
    package: string;
    status: string;
}

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export default function CustomerTable({ customers, onEdit, onDelete, onAdd }: CustomerTableProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">จัดการข้อมูลลูกค้า</h1>
                <button onClick={onAdd} className="btn btn-primary px-6">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มลูกค้า</span>
                </button>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">ชื่อร้าน/คลินิก</th>
                                <th className="px-6 py-4 font-semibold">แพ็คเกจ</th>
                                <th className="px-6 py-4 font-semibold">สถานะ</th>
                                <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {customers.map((c) => (
                                <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-200">{c.name}</div>
                                        <a
                                            href={c.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                        >
                                            {c.link} <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-300">{c.package}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${c.status === "ใช้งาน" ? "bg-emerald-500/10 text-emerald-400" :
                                                c.status === "รอการใช้งาน" ? "bg-amber-500/10 text-amber-400" :
                                                    "bg-rose-500/10 text-rose-400"
                                            }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
