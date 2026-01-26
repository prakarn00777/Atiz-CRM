"use client";

import { useState } from "react";
import { Plus, X, ExternalLink } from "lucide-react";
import SearchableCustomerSelect from "./SearchableCustomerSelect";
import CustomSelect from "./CustomSelect";
import { Customer } from "@/types";

interface InstallationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    onSave: (data: any) => void;
}

export default function InstallationRequestModal({
    isOpen,
    onClose,
    customers,
    onSave
}: InstallationRequestModalProps) {
    const [customerType, setCustomerType] = useState<"new" | "existing">("new");
    const [newInst, setNewInst] = useState({
        customerId: 0,
        customerName: "",
        notes: "",
        newCustomerName: "",
        newCustomerLink: "",
        newCustomerProduct: "Dr.Ease" as any,
        newCustomerPackage: "Standard",
        branchName: "",
        branchAddress: ""
    });

    const resetModal = () => {
        setCustomerType("new");
        setNewInst({
            customerId: 0,
            customerName: "",
            notes: "",
            newCustomerName: "",
            newCustomerLink: "",
            newCustomerProduct: "Dr.Ease",
            newCustomerPackage: "Standard",
            branchName: "",
            branchAddress: ""
        });
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleSave = () => {
        if (customerType === "existing" && (newInst.customerId === 0 || !newInst.branchName.trim())) return;
        if (customerType === "new" && (!newInst.newCustomerName.trim() || !newInst.newCustomerLink.trim())) return;

        onSave({
            ...newInst,
            installationType: customerType === "new" ? "new" : "branch"
        });
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg glass-card p-6 shadow-2xl border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-400" />
                        แจ้งงานติดตั้งใหม่
                    </h2>
                    <button onClick={handleClose} className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">ประเภทงานติดตั้ง</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCustomerType("new")}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "new"
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                                    }`}
                            >
                                ติดตั้งลูกค้าใหม่
                            </button>
                            <button
                                type="button"
                                onClick={() => setCustomerType("existing")}
                                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-medium transition-all ${customerType === "existing"
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                                    }`}
                            >
                                ติดตั้งสาขาเพิ่ม
                            </button>
                        </div>
                    </div>

                    {customerType === "existing" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">เลือกลูกค้า</label>
                                <SearchableCustomerSelect
                                    customers={customers}
                                    value={newInst.customerId || null}
                                    onChange={(id, name) => setNewInst({ ...newInst, customerId: id, customerName: name })}
                                    placeholder="เลือกชื่อคลินิก/ร้านค้า..."
                                />
                            </div>
                            {newInst.customerId > 0 && (
                                <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-xs font-medium text-slate-300">ข้อมูลสาขาใหม่</p>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                            ชื่อสาขา <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="เช่น สาขาสยาม, สาขาเซ็นทรัล"
                                            value={newInst.branchName}
                                            onChange={(e) => setNewInst({ ...newInst, branchName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {customerType === "new" && (
                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    ชื่อคลินิก/ร้านค้า <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="กรอกชื่อลูกค้า..."
                                    value={newInst.newCustomerName}
                                    onChange={(e) => setNewInst({ ...newInst, newCustomerName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        ประเภทระบบ <span className="text-rose-500">*</span>
                                    </label>
                                    <CustomSelect
                                        options={[
                                            { value: "Dr.Ease", label: "Dr.Ease" },
                                            { value: "EasePos", label: "EasePos" },
                                        ]}
                                        value={newInst.newCustomerProduct}
                                        onChange={(val) => setNewInst({ ...newInst, newCustomerProduct: val })}
                                        placeholder="เลือกระบบ..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        แพ็คเกจ <span className="text-rose-500">*</span>
                                    </label>
                                    <CustomSelect
                                        options={[
                                            { value: "Starter", label: "Starter" },
                                            { value: "Standard", label: "Standard" },
                                            { value: "Elite", label: "Elite" },
                                        ]}
                                        value={newInst.newCustomerPackage}
                                        onChange={(val) => setNewInst({ ...newInst, newCustomerPackage: val })}
                                        placeholder="เลือกแพ็คเกจ..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    ลิงก์เข้าระบบ (System Link) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input-field pl-9"
                                        placeholder="example.dr-ease.com"
                                        value={newInst.newCustomerLink}
                                        onChange={(e) => setNewInst({ ...newInst, newCustomerLink: e.target.value })}
                                    />
                                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">หมายเหตุ</label>
                        <textarea
                            className="input-field min-h-[80px] py-3 h-auto resize-none text-xs"
                            value={newInst.notes}
                            onChange={(e) => setNewInst({ ...newInst, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={handleClose} className="btn btn-ghost flex-1 py-2.5 text-xs font-medium">ยกเลิก</button>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary flex-1 py-2.5 text-xs font-medium"
                        >
                            บันทึกงาน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
