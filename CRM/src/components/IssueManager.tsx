"use client";

import { useState } from "react";
import { Search, Edit2, Trash2, Plus, AlertCircle, AlertTriangle, Info, CheckCircle2, Clock, Play, Paperclip } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface Customer {
    id: number;
    name: string;
    link: string;
}

interface Issue {
    id: number;
    caseNumber: string;
    title: string;
    customerId: number;
    customerName: string;
    severity: "ต่ำ" | "ปานกลาง" | "สูง" | "วิกฤต";
    status: "แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น";
    type: string;
    description?: string;
    attachments?: { name: string; type: string; size: number; data: string }[];
    createdBy?: string;
    createdAt?: string;
    modifiedBy?: string;
    modifiedAt?: string;
}

interface IssueManagerProps {
    issues: Issue[];
    customers: Customer[];
    onAdd: () => void;
    onEdit: (issue: Issue) => void;
    onDelete: (id: number) => void;
}

export default function IssueManager({ issues, customers, onAdd, onEdit, onDelete }: IssueManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");

    const filteredIssues = issues.filter(issue => {
        const matchesSearch =
            issue.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
        const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;

        return matchesSearch && matchesStatus && matchesSeverity;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "วิกฤต": return "text-rose-400 bg-rose-500/10";
            case "สูง": return "text-orange-400 bg-orange-500/10";
            case "ปานกลาง": return "text-amber-400 bg-amber-500/10";
            case "ต่ำ": return "text-emerald-400 bg-emerald-500/10";
            default: return "text-slate-400 bg-slate-500/10";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case "วิกฤต": return <AlertCircle className="w-3.5 h-3.5" />;
            case "สูง": return <AlertTriangle className="w-3.5 h-3.5" />;
            case "ปานกลาง": return <AlertTriangle className="w-3.5 h-3.5" />;
            case "ต่ำ": return <Info className="w-3.5 h-3.5" />;
            default: return <Info className="w-3.5 h-3.5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "เสร็จสิ้น": return "text-emerald-400 bg-emerald-500/10";
            case "กำลังดำเนินการ": return "text-indigo-400 bg-indigo-500/10";
            case "แจ้งเคส": return "text-amber-400 bg-amber-500/10";
            default: return "text-slate-400 bg-slate-500/10";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "เสร็จสิ้น": return <CheckCircle2 className="w-3.5 h-3.5" />;
            case "กำลังดำเนินการ": return <Play className="w-3.5 h-3.5" />;
            case "แจ้งเคส": return <Clock className="w-3.5 h-3.5" />;
            default: return <Clock className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Issue Reporting</h1>
            </div>

            {/* Search, Filters, and Add Button */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-9 py-1.5 text-xs h-9"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <CustomSelect
                            options={[
                                { value: "all", label: "สถานะทั้งหมด" },
                                { value: "แจ้งเคส", label: "แจ้งเคส" },
                                { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
                                { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-[160px]"
                        />
                        <CustomSelect
                            options={[
                                { value: "all", label: "ระดับทั้งหมด" },
                                { value: "ต่ำ", label: "ต่ำ" },
                                { value: "ปานกลาง", label: "ปานกลาง" },
                                { value: "สูง", label: "สูง" },
                                { value: "วิกฤต", label: "วิกฤต" },
                            ]}
                            value={severityFilter}
                            onChange={setSeverityFilter}
                            className="w-[160px]"
                        />
                    </div>
                </div>

                <button
                    onClick={onAdd}
                    className="btn btn-primary h-9 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    New Case
                </button>
            </div>

            {/* Issues Table */}
            <div className="glass-card overflow-hidden border-indigo-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                                <th className="px-4 py-3 font-semibold w-[5%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[10%]">Case Id</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Case Name</th>
                                <th className="px-4 py-3 font-semibold w-[12%]">Customer</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Severity</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">Status</th>
                                <th className="px-4 py-3 font-semibold w-[10%]">Type</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[13%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredIssues.length > 0 ? (
                                filteredIssues.map((issue, index) => (
                                    <tr key={issue.id} className="group hover:bg-white/[0.02] transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-slate-500">{index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono text-slate-400">
                                                {issue.caseNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 max-w-[200px]">
                                                <div className="font-semibold text-slate-200 text-xs truncate" title={issue.title}>
                                                    {issue.title}
                                                </div>
                                                {issue.attachments && issue.attachments.length > 0 && (
                                                    <Paperclip className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-300">{issue.customerName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${getSeverityColor(issue.severity)}`}>
                                                {getSeverityIcon(issue.severity)}
                                                {issue.severity}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(issue.status)}`}>
                                                {getStatusIcon(issue.status)}
                                                {issue.status}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-400">{issue.type}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {issue.modifiedBy ? (
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-300">{issue.modifiedBy}</span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(issue.modifiedAt!).toLocaleString('th-TH', {
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
                                                    onClick={() => onEdit(issue)}
                                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(issue.id)}
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
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="w-12 h-12 text-slate-600" />
                                            <p className="text-sm text-slate-500">ไม่พบข้อมูลเคส</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
