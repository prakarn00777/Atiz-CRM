"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ShieldCheck, X, CheckCircle2 } from "lucide-react";

interface RoleData {
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

interface RoleManagerProps {
    roles: RoleData[];
    onSave: (role: RoleData) => void;
    onDelete: (id: string) => void;
}

const AVAILABLE_PERMISSIONS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "customers", label: "จัดการลูกค้า" },
    { id: "user_management", label: "จัดการผู้ใช้งาน" },
    { id: "role_management", label: "จัดการบทบาท" },
];

export default function RoleManager({ roles, onSave, onDelete }: RoleManagerProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const handleOpenModal = (role: RoleData | null = null) => {
        setEditingRole(role);
        setSelectedPermissions(role?.permissions || []);
        setModalOpen(true);
    };

    const togglePermission = (id: string) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: RoleData = {
            id: editingRole ? editingRole.id : `role_${Date.now()}`,
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            permissions: selectedPermissions,
        };
        onSave(data);
        setModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">จัดการบทบาท</h1>
                <button onClick={() => handleOpenModal()} className="btn btn-primary px-6">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มบทบาท</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((r) => (
                    <div key={r.id} className="glass-card p-6 border-white/5 group hover:border-indigo-500/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-200">{r.name}</h3>
                                    <p className="text-sm text-slate-400">{r.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(r)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เมนูที่เข้าถึงได้:</p>
                            <div className="flex flex-wrap gap-2">
                                {r.permissions.map(p => (
                                    <span key={p} className="px-2 py-1 rounded-md bg-indigo-500/5 text-indigo-300 text-xs border border-indigo-500/10">
                                        {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                    </span>
                                ))}
                                {r.permissions.length === 0 && <span className="text-xs text-slate-500 italic">ไม่มีสิทธิการเข้าถึง</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="glass-card w-full max-w-lg p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6">{editingRole ? "แก้ไขบทบาท" : "เพิ่มบทบาท"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">ชื่อบทบาท</label>
                                <input name="name" defaultValue={editingRole?.name} className="input-field" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">รายละเอียด</label>
                                <textarea name="description" defaultValue={editingRole?.description} className="input-field h-24 resize-none" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">สิทธิการเข้าถึงเมนู</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {AVAILABLE_PERMISSIONS.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => togglePermission(p.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${selectedPermissions.includes(p.id)
                                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                                                    : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${selectedPermissions.includes(p.id) ? "border-indigo-400 bg-indigo-400 text-slate-900" : "border-slate-600"
                                                }`}>
                                                {selectedPermissions.includes(p.id) && <CheckCircle2 className="w-3 h-3" />}
                                            </div>
                                            <span className="text-sm">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost flex-1">ยกเลิก</button>
                                <button type="submit" className="btn btn-primary flex-1">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
