"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit2, Trash2, User, X, Search, MoreVertical, Filter, AlertTriangle } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface UserData {
    id: number;
    name: string;
    username: string;
    password?: string;
    role: string;
    is_active?: boolean;
    modifiedBy?: string;
    modifiedAt?: string;
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
    onToggleActive?: (id: number, isActive: boolean) => void;
}

export default function UserManager({ users, roles, onSave, onDelete, onToggleActive }: UserManagerProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Action Menu States
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, name: string } | null>(null);
    const [mounted, setMounted] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);

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

    const handleOpenModal = (user: UserData | null = null) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const currentUser = localStorage.getItem("crm_user_v2");
        const userName = currentUser ? JSON.parse(currentUser).name : "System";
        const data: UserData = {
            id: editingUser ? editingUser.id : Date.now(),
            name: formData.get("name") as string,
            username: formData.get("username") as string,
            role: formData.get("role") as string,
            modifiedBy: userName,
            modifiedAt: new Date().toISOString(),
        };
        const password = formData.get("password") as string;
        if (password) {
            data.password = password;
        }
        onSave(data);
        setModalOpen(false);
    };

    const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

    // Filtering — keep toggling row visible until animation finishes
    const filteredUsers = users.filter(u => {
        if (u.id === togglingId) return true;
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.is_active !== false : u.is_active === false);
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-main">User Management</h1>
                </div>

                {/* Search, Filter Bar & Add Button */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อหรือ Username..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <div className="relative shrink-0">
                        <CustomSelect
                            options={[
                                { value: "active", label: "ใช้งานอยู่" },
                                { value: "inactive", label: "ปิดการใช้งาน" },
                                { value: "all", label: "ทั้งหมด" },
                            ]}
                            value={statusFilter}
                            onChange={(val) => { setStatusFilter(val as any); setCurrentPage(1); }}
                            className="w-[160px]"
                            placeholder="สถานะ"
                        />
                    </div>
                    <div className="relative shrink-0">
                        <CustomSelect
                            options={[
                                { value: "all", label: "ทุกบทบาท" },
                                ...roleOptions
                            ]}
                            value={roleFilter}
                            onChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}
                            className="w-[160px]"
                            placeholder="บทบาท"
                            icon={<Filter className="w-3.5 h-3.5" />}
                        />
                    </div>
                    <div className="ml-auto shrink-0">
                        <button onClick={() => handleOpenModal()} className="btn btn-primary px-6">
                            <Plus className="w-5 h-5" />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="glass-card overflow-hidden border-indigo-500/5 flex flex-col h-[calc(100vh-220px)]">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 z-10 bg-card-bg shadow-sm backdrop-blur-xl">
                            <tr className="bg-bg-hover text-text-muted text-xs uppercase tracking-wider border-b border-border-light">
                                <th className="px-4 py-3 font-semibold w-[5%] text-center">No.</th>
                                <th className="px-4 py-3 font-semibold w-[20%]">ชื่อ-นามสกุล</th>
                                <th className="px-4 py-3 font-semibold w-[15%]">Username</th>
                                <th className="px-4 py-3 font-semibold w-[15%] text-center">บทบาท</th>
                                <th className="px-4 py-3 font-semibold w-[15%] text-center">Modified By</th>
                                <th className="px-4 py-3 font-semibold w-[10%] text-center">สถานะ</th>
                                <th className="px-4 py-3 font-semibold w-[8%] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((u, index) => (
                                    <tr key={u.id} className="group hover:bg-bg-hover transition-colors h-14">
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs text-text-muted opacity-60">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-text-main text-sm">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-text-muted opacity-70 font-mono">{u.username}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-xs text-indigo-300 font-medium border border-indigo-500/20">
                                                {roles.find(r => r.id === u.role)?.name || u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {u.modifiedBy ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-medium text-text-main">{u.modifiedBy}</span>
                                                    <span className="text-[10px] text-text-muted opacity-70">
                                                        {new Date(u.modifiedAt!).toLocaleString('th-TH', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-text-muted opacity-50">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(() => {
                                                const isToggling = togglingId === u.id;
                                                const visualActive = isToggling ? (u.is_active === false) : (u.is_active !== false);
                                                return (
                                                    <button
                                                        onClick={() => {
                                                            if (togglingId) return;
                                                            setTogglingId(u.id);
                                                            setTimeout(() => {
                                                                onToggleActive?.(u.id, u.is_active === false);
                                                                setTimeout(() => setTogglingId(null), 100);
                                                            }, 400);
                                                        }}
                                                        disabled={isToggling}
                                                        className={`inline-flex items-center gap-2 cursor-pointer group/toggle hover:opacity-80 active:scale-95 transition-all duration-150 ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
                                                        title={visualActive ? 'คลิกเพื่อปิดการใช้งาน' : 'คลิกเพื่อเปิดการใช้งาน'}
                                                    >
                                                        <div className={`relative w-10 h-[22px] rounded-full transition-all duration-300 ease-in-out ${visualActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.68,-0.30,0.32,1.30)] ${visualActive ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
                                                        </div>
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={(e) => handleMenuToggle(e, u.id)}
                                                className={`p-2 rounded-lg transition-colors ${activeMenu === u.id ? 'bg-indigo-500/20 text-indigo-500 dark:text-white' : 'hover:bg-bg-hover text-text-muted hover:text-text-main'}`}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted opacity-60">
                                        ไม่พบข้อมูลผู้ใช้งาน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-border-light flex items-center justify-between bg-bg-hover/30">
                        <span className="text-xs text-text-muted">
                            แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จาก {filteredUsers.length} รายการ
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-xs rounded hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-muted"
                            >
                                ««
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-xs rounded hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-muted"
                            >
                                «
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-7 h-7 text-xs rounded transition-colors ${currentPage === pageNum
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'hover:bg-bg-hover text-text-muted'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-xs rounded hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-muted"
                            >
                                »
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-xs rounded hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-muted"
                            >
                                »»
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Menu Portal */}
            {mounted && activeMenu !== null && menuPosition && createPortal(
                <div
                    className="fixed z-[200] bg-card-bg border border-border rounded-lg shadow-xl py-1 min-w-[140px] backdrop-blur-xl"
                    style={{ top: menuPosition.top + 4, left: menuPosition.left - 140 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            const user = users.find(u => u.id === activeMenu);
                            if (user) handleOpenModal(user);
                            setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-main hover:bg-bg-hover flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        แก้ไข
                    </button>
                    <button
                        onClick={() => {
                            const user = users.find(u => u.id === activeMenu);
                            if (user) setDeleteConfirm({ id: user.id, name: user.name });
                            setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                    </button>
                </div>,
                document.body
            )}

            {/* User Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="bg-card-bg w-full max-w-lg max-h-[90vh] flex flex-col relative shadow-2xl border border-border rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-border-light flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{editingUser ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}</h2>
                                    <p className="text-xs text-text-muted">กรอกข้อมูลผู้ใช้งานระบบ</p>
                                </div>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-bg-hover rounded-lg transition-colors">
                                <X className="w-5 h-5 text-text-muted hover:text-text-main" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
                                {/* Name Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        defaultValue={editingUser?.name}
                                        className="input-field"
                                        placeholder="กรอกชื่อ-นามสกุล"
                                        required
                                    />
                                </div>

                                {/* Username & Password */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                            Username <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            name="username"
                                            defaultValue={editingUser?.username}
                                            className="input-field"
                                            placeholder="ชื่อผู้ใช้"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                            Password {editingUser ? "" : <span className="text-rose-500">*</span>}
                                        </label>
                                        <input
                                            name="password"
                                            type="password"
                                            className="input-field"
                                            placeholder={editingUser ? "เว้นว่างเพื่อใช้รหัสเดิม" : "รหัสผ่าน"}
                                            required={!editingUser}
                                        />
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">บทบาท</label>
                                    <CustomSelect
                                        name="role"
                                        defaultValue={editingUser?.role || (roleOptions[0]?.value)}
                                        options={roleOptions}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost flex-1">
                                ยกเลิก
                            </button>
                            <button form="user-form" type="submit" className="btn btn-primary flex-1">
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="bg-card-bg w-full max-w-md relative shadow-2xl border border-border rounded-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">ยืนยันการลบผู้ใช้งาน</h3>
                            <p className="text-text-muted text-sm mb-6">
                                คุณต้องการระงับการใช้งานคุณ <span className="text-text-main font-semibold">&quot;{deleteConfirm.name}&quot;</span> ใช่หรือไม่? <br />
                                <span className="text-[10px] text-rose-500 mt-1 block">*(ผู้ใช้งานนี้จะไม่สามารถเข้าสู่ระบบได้ชั่วคราว)*</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn btn-ghost flex-1"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(deleteConfirm.id);
                                        setDeleteConfirm(null);
                                    }}
                                    className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1"
                                >
                                    ยืนยันการลบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
