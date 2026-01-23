"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, ShieldCheck, X, Check } from "lucide-react";

interface MenuPermission {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

interface RoleData {
    id: string;
    name: string;
    description: string;
    permissions: Record<string, MenuPermission>;
}

interface RoleManagerProps {
    roles: RoleData[];
    onSave: (role: RoleData) => void;
    onDelete: (id: string) => void;
}

const AVAILABLE_MENUS = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "customers", label: "จัดการลูกค้า", icon: "👥" },
    { id: "installations", label: "งานติดตั้ง", icon: "🔧" },
    { id: "issues", label: "แจ้งปัญหา", icon: "📝" },
    { id: "leads", label: "ลีด (Leads)", icon: "📢" },
    { id: "user_management", label: "จัดการผู้ใช้งาน", icon: "👤" },
    { id: "cs_activity", label: "CS Task", icon: "📋" },
    { id: "role_management", label: "จัดการบทบาท", icon: "🛡️" },
];

const DEFAULT_PERMISSION: MenuPermission = { create: false, read: false, update: false, delete: false };

export default function RoleManager({ roles, onSave, onDelete }: RoleManagerProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);
    const [permissions, setPermissions] = useState<Record<string, MenuPermission>>({});

    const handleOpenModal = (role: RoleData | null = null) => {
        setEditingRole(role);
        if (role?.permissions) {
            setPermissions(role.permissions);
        } else {
            // Initialize with default permissions
            const defaultPerms: Record<string, MenuPermission> = {};
            AVAILABLE_MENUS.forEach(menu => {
                defaultPerms[menu.id] = { ...DEFAULT_PERMISSION };
            });
            setPermissions(defaultPerms);
        }
        setModalOpen(true);
    };

    const togglePermission = (menuId: string, action: keyof MenuPermission) => {
        setPermissions(prev => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                [action]: !prev[menuId]?.[action]
            }
        }));
    };

    const toggleAllForMenu = (menuId: string) => {
        const current = permissions[menuId];
        const allChecked = current?.create && current?.read && current?.update && current?.delete;
        setPermissions(prev => ({
            ...prev,
            [menuId]: {
                create: !allChecked,
                read: !allChecked,
                update: !allChecked,
                delete: !allChecked
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: RoleData = {
            id: editingRole ? editingRole.id : `role_${Date.now()}`,
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            permissions: permissions,
        };
        onSave(data);
        setModalOpen(false);
    };

    const getPermissionCount = (role: RoleData) => {
        if (!role.permissions) return 0;
        let count = 0;
        Object.values(role.permissions).forEach(p => {
            if (p.create) count++;
            if (p.read) count++;
            if (p.update) count++;
            if (p.delete) count++;
        });
        return count;
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
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สิทธิ์การเข้าถึง:</p>
                                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                    {getPermissionCount(r)} สิทธิ์
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_MENUS.filter(menu => {
                                    const p = r.permissions?.[menu.id];
                                    return p?.create || p?.read || p?.update || p?.delete;
                                }).map(menu => {
                                    const p = r.permissions?.[menu.id];
                                    const actions = [
                                        p?.read && 'R',
                                        p?.create && 'C',
                                        p?.update && 'U',
                                        p?.delete && 'D'
                                    ].filter(Boolean).join('');
                                    return (
                                        <span key={menu.id} className="px-2 py-1 rounded-md bg-indigo-500/5 text-indigo-300 text-xs border border-indigo-500/10">
                                            {menu.icon} {menu.label} <span className="text-indigo-400/60">({actions})</span>
                                        </span>
                                    );
                                })}
                                {getPermissionCount(r) === 0 && <span className="text-xs text-slate-500 italic">ไม่มีสิทธิการเข้าถึง</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                            <h2 className="text-2xl font-bold">{editingRole ? "แก้ไขบทบาท" : "เพิ่มบทบาท"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">ชื่อบทบาท</label>
                                        <input name="name" defaultValue={editingRole?.name} className="input-field" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">รายละเอียด</label>
                                        <input name="description" defaultValue={editingRole?.description} className="input-field" />
                                    </div>
                                </div>

                                {/* Permission Matrix */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-400">สิทธิ์การเข้าถึงเมนู (CRUD)</label>
                                    <div className="border border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                                    <th className="px-4 py-3 text-left font-semibold">เมนู</th>
                                                    <th className="px-3 py-3 text-center font-semibold w-20">ดู (R)</th>
                                                    <th className="px-3 py-3 text-center font-semibold w-20">เพิ่ม (C)</th>
                                                    <th className="px-3 py-3 text-center font-semibold w-20">แก้ไข (U)</th>
                                                    <th className="px-3 py-3 text-center font-semibold w-20">ลบ (D)</th>
                                                    <th className="px-3 py-3 text-center font-semibold w-20">ทั้งหมด</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {AVAILABLE_MENUS.map(menu => {
                                                    const perm = permissions[menu.id] || DEFAULT_PERMISSION;
                                                    const allChecked = perm.create && perm.read && perm.update && perm.delete;
                                                    return (
                                                        <tr key={menu.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{menu.icon}</span>
                                                                    <span className="text-sm text-slate-300">{menu.label}</span>
                                                                </div>
                                                            </td>
                                                            {(['read', 'create', 'update', 'delete'] as const).map(action => (
                                                                <td key={action} className="px-3 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => togglePermission(menu.id, action)}
                                                                        className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${perm[action]
                                                                            ? 'bg-indigo-500 border-indigo-500 text-white'
                                                                            : 'bg-transparent border-slate-600 hover:border-slate-500'
                                                                            }`}
                                                                    >
                                                                        {perm[action] && <Check className="w-4 h-4" />}
                                                                    </button>
                                                                </td>
                                                            ))}
                                                            <td className="px-3 py-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllForMenu(menu.id)}
                                                                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${allChecked
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                        : 'bg-transparent border-slate-600 hover:border-slate-500'
                                                                        }`}
                                                                >
                                                                    {allChecked && <Check className="w-4 h-4" />}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-slate-500">R = Read (ดู), C = Create (เพิ่ม), U = Update (แก้ไข), D = Delete (ลบ)</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
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
