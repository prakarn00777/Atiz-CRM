"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, User, X } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface UserData {
    id: number;
    name: string;
    username: string;
    password: string;
    role: string;
}

interface RoleData {
    id: string;
    name: string;
}

interface UserManagerProps {
    users: UserData[];
    roles: RoleData[];
    onSave: (user: UserData) => void;
    onDelete: (id: number) => void;
}

export default function UserManager({ users, roles, onSave, onDelete }: UserManagerProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    const handleOpenModal = (user: UserData | null = null) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: UserData = {
            id: editingUser ? editingUser.id : Date.now(),
            name: formData.get("name") as string,
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            role: formData.get("role") as string,
        };
        onSave(data);
        setModalOpen(false);
    };

    const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">จัดการผู้ใช้งาน</h1>
                <button onClick={() => handleOpenModal()} className="btn btn-primary px-6">
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มผู้ใช้งาน</span>
                </button>
            </div>

            <div className="glass-card overflow-hidden border-indigo-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 font-semibold">Full Name</th>
                                <th className="px-4 py-3 font-semibold">Username</th>
                                <th className="px-4 py-3 font-semibold">Role</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-slate-200">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">{u.username}</td>
                                    <td className="px-4 py-3 text-slate-300">
                                        <span className="px-2 py-1 rounded bg-white/5 text-xs text-indigo-300">
                                            {roles.find(r => r.id === u.role)?.name || u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(u)}
                                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(u.id)}
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

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="glass-card w-full max-w-lg p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6">{editingUser ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">ชื่อ-นามสกุล</label>
                                <input name="name" defaultValue={editingUser?.name} className="input-field" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Username</label>
                                    <input name="username" defaultValue={editingUser?.username} className="input-field" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">Password</label>
                                    <input name="password" type="password" defaultValue={editingUser?.password} className="input-field" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">บทบาท</label>
                                <CustomSelect
                                    name="role"
                                    defaultValue={editingUser?.role || (roleOptions[0]?.value)}
                                    options={roleOptions}
                                />
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
