"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import CustomerTable from "@/components/CustomerTable";
import { Layers, X, ChevronDown, Plus, Edit2, Trash2, Users, Activity, Award, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import UserManager from "@/components/UserManager";
import RoleManager from "@/components/RoleManager";
import Toast from "@/components/Toast";
import IssueManager from "@/components/IssueManager";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SegmentedControl from "@/components/SegmentedControl";
import InstallationManager from "@/components/InstallationManager";
import { Customer, Branch, Installation, Issue } from "@/types";
import { importCustomersFromCSV, getCustomers, getIssues, getInstallations } from "./actions";

function TableSummary({ customers }: { customers: Customer[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
          <th className="px-6 py-3 font-semibold">Clinic/Shop Name</th>
          <th className="px-6 py-3 font-semibold">Package</th>
          <th className="px-6 py-3 font-semibold">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {customers.map((c) => (
          <tr key={c.id}>
            <td className="px-5 py-3 text-sm font-medium">{c.name}</td>
            <td className="px-5 py-3 text-sm text-slate-400">{c.package}</td>
            <td className="px-5 py-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.usageStatus === "Active" ? "text-emerald-400 bg-emerald-500/10" :
                c.usageStatus === "Trial" ? "text-amber-400 bg-amber-500/10" :
                  c.usageStatus === "Inactive" ? "text-slate-400 bg-slate-500/10" : "text-rose-400 bg-rose-500/10"
                }`}>{c.usageStatus}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CRMPage() {
  const [currentView, setView] = useState("dashboard");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isIssueModalOpen, setIssueModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'customer' | 'issue' | 'branch', id?: number, index?: number, title: string } | null>(null);

  // New states for issue form
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ name: string, type: string, size: number, data: string }[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Branch states
  const [branchInputs, setBranchInputs] = useState<Branch[]>([]);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [tempBranchName, setTempBranchName] = useState("");
  const [tempBranchAddress, setTempBranchAddress] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("crm_user_v2");
    const savedCustomers = localStorage.getItem("crm_customers_v2");
    const savedSystemUsers = localStorage.getItem("crm_system_users_v2");
    const savedRoles = localStorage.getItem("crm_roles_v2");
    const savedIssues = localStorage.getItem("crm_issues_v2");
    const savedInstallations = localStorage.getItem("crm_installations_v2");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedIssues) setIssues(JSON.parse(savedIssues));
    if (savedInstallations) setInstallations(JSON.parse(savedInstallations));
    if (savedRoles) setRoles(JSON.parse(savedRoles));

    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }

    if (savedSystemUsers) {
      setUsers(JSON.parse(savedSystemUsers));
    } else {
      const initialUsers = [
        { id: 1, name: "Administrator", username: "admin", password: "password", role: "admin" }
      ];
      setUsers(initialUsers);
      localStorage.setItem("crm_system_users_v2", JSON.stringify(initialUsers));
    }

    const fetchData = async () => {
      try {
        const [cData, iData, instData] = await Promise.all([
          getCustomers(),
          getIssues(),
          getInstallations()
        ]);
        if (cData.length > 0) setCustomers(cData);
        if (iData.length > 0) setIssues(iData);
        if (instData.length > 0) setInstallations(instData);
      } catch (err) {
        console.error("Failed to fetch data from Turso:", err);
      }
    };

    fetchData();
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const u = formData.get("username");
    const p = formData.get("password");

    if (u === "admin" && p === "1234") {
      const userData = { name: "Admin" };
      setUser(userData);
      localStorage.setItem("crm_user_v2", JSON.stringify(userData));
    } else {
      alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Customer = {
      id: editingCustomer ? editingCustomer.id : (customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1),
      name: formData.get("name") as string,
      subdomain: formData.get("subdomain") as string,
      productType: formData.get("product") as any,
      package: formData.get("package") as string,
      usageStatus: (formData.get("usageStatus") as any) || "Active",
      installationStatus: editingCustomer ? editingCustomer.installationStatus : "Pending",
      branches: branchInputs,
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    let updated;
    if (editingCustomer) {
      updated = customers.map(c => c.id === editingCustomer.id ? data : c);
    } else {
      updated = [...customers, data];
    }

    setCustomers(updated);
    localStorage.setItem("crm_customers_v2", JSON.stringify(updated));
    setModalOpen(false);
    setEditingCustomer(null);
    setToast({ message: "บันทึกข้อมูลลูกค้าสำเร็จ", type: "success" });
  };

  const handleDeleteCustomer = (id: number) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    localStorage.setItem("crm_customers_v2", JSON.stringify(updated));
    setToast({ message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว", type: "success" });
  };

  const handleImportCSV = async (data: any[]) => {
    try {
      setToast({ message: "กำลังนำเข้าข้อมูล...", type: "info" });
      const result = await importCustomersFromCSV(data);
      if (result.success) {
        setToast({ message: `นำเข้าข้อมูลสำเร็จ ${result.count} รายการ`, type: "success" });
        // NOTE: In the future, this would fetch from Turso instead of local state
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล", type: "error" });
    }
  };

  const handleSaveIssue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Issue = {
      id: editingIssue ? editingIssue.id : (issues.length > 0 ? Math.max(...issues.map(i => i.id)) + 1 : 1),
      caseNumber: editingIssue ? editingIssue.caseNumber : `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.get("title") as string,
      customerId: selectedCustomerId || 0,
      customerName: selectedCustomerName,
      branchName: selectedBranchName,
      severity: formData.get("severity") as any,
      status: (formData.get("status") as any) || "แจ้งเคส",
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      attachments: JSON.stringify(selectedFiles),
      createdBy: editingIssue ? editingIssue.createdBy : user?.name,
      createdAt: editingIssue ? editingIssue.createdAt : new Date().toISOString(),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    let updated;
    if (editingIssue) {
      updated = issues.map(i => i.id === editingIssue.id ? data : i);
    } else {
      updated = [...issues, data];
    }

    setIssues(updated);
    localStorage.setItem("crm_issues_v2", JSON.stringify(updated));
    setIssueModalOpen(false);
    setEditingIssue(null);
    setToast({ message: "บันทึกข้อมูลเคสเรียบร้อยแล้ว", type: "success" });
  };

  const handleDeleteIssue = (id: number) => {
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    localStorage.setItem("crm_issues_v2", JSON.stringify(updated));
    setToast({ message: "ลบเคสเรียบร้อยแล้ว", type: "success" });
  };

  const handleAddInstallation = (newInst: any) => {
    // Basic implementation for compatibility with existing manager
    const data: Installation = {
      id: installations.length > 0 ? Math.max(...installations.map(i => i.id)) + 1 : 1,
      customerId: newInst.customerId || 0,
      customerName: newInst.customerName || "",
      status: "Pending",
      requestedBy: user?.name || "System",
      requestedAt: new Date().toISOString(),
      notes: newInst.notes,
      installationType: newInst.installationType
    };
    const updated = [...installations, data];
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
  };

  const handleUpdateInstallationStatus = (id: number, status: any) => {
    const updated = installations.map(inst => inst.id === id ? { ...inst, status, modifiedBy: user?.name, modifiedAt: new Date().toISOString() } : inst);
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
  };

  const handleAssignDev = (id: number, devName: string) => {
    const updated = installations.map(inst => inst.id === id ? { ...inst, assignedDev: devName } : inst);
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
  };

  const handleSaveUser = (userData: any) => {
    const updated = users.find(u => u.id === userData.id) ? users.map(u => u.id === userData.id ? userData : u) : [...users, userData];
    setUsers(updated);
    localStorage.setItem("crm_system_users_v2", JSON.stringify(updated));
  };

  const handleDeleteUser = (id: number) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem("crm_system_users_v2", JSON.stringify(updated));
  };

  const handleSaveRole = (roleData: any) => {
    const updated = roles.find(r => r.id === roleData.id) ? roles.map(r => r.id === roleData.id ? roleData : r) : [...roles, roleData];
    setRoles(updated);
    localStorage.setItem("crm_roles_v2", JSON.stringify(updated));
  };

  const handleDeleteRole = (id: string) => {
    const updated = roles.filter(r => r.id !== id);
    setRoles(updated);
    localStorage.setItem("crm_roles_v2", JSON.stringify(updated));
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
        <div className="glass-card w-full max-w-md p-8 border-indigo-500/20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-bounce">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Atiz CRM</h1>
            <p className="text-slate-400 mt-2 text-sm italic">Advanced Management Console</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input name="username" className="input-field py-3 text-sm h-12" placeholder="Enter username" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input name="password" type="password" className="input-field py-3 text-sm h-12" placeholder="••••••••" required />
            </div>
            <button type="submit" className="w-full btn btn-primary py-3 text-sm font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30">
      <Sidebar currentView={currentView} setView={setView} onLogout={() => { setUser(null); localStorage.removeItem("crm_user_v2"); }} />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] relative">
        <div className="p-8 max-w-[1600px] mx-auto relative z-10">
          {currentView === "dashboard" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-md">
                <div>
                  <h1 className="text-4xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">ภาพรวมระบบ</h1>
                  <p className="text-slate-400 mt-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    ยินดีต้อนรับกลับมา, <span className="text-indigo-400 font-bold">{user.name}</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { setEditingCustomer(null); setBranchInputs([{ name: "สำนักงานใหญ่", isMain: true, address: "", status: "รอการติดตั้ง" }]); setModalOpen(true); }} className="btn btn-primary h-12 px-6 flex items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                    เพิ่มลูกค้าใหม่
                  </button>
                  <button onClick={() => { setView("issues"); setIssueModalOpen(true); }} className="btn btn-ghost h-12 px-6 border border-white/10 hover:border-indigo-500/50 flex items-center gap-2 font-bold group">
                    <AlertTriangle className="w-5 h-5 text-amber-500 group-hover:animate-shake" />
                    แจ้งเคสใหม่
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "ลูกค้าทั้งหมด", value: customers.length, icon: Users, gradient: "from-indigo-500/20 to-purple-500/20", iconColor: "text-indigo-400", trend: "+12%" },
                  { label: "เคสที่รอดำเนินการ", value: issues.filter(i => i.status !== "เสร็จสิ้น").length, icon: Activity, gradient: "from-rose-500/20 to-orange-500/20", iconColor: "text-rose-400", trend: "-2%" },
                  { label: "ติดตั้งสำเร็จ (เดือนนี้)", value: installations.filter(i => i.status === "Completed").length, icon: Layers, gradient: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400", trend: "+8%" },
                  { label: "โปรเจกต์ Elite", value: customers.filter(c => c.package === "Elite").length, icon: Award, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400", trend: "+5%" },
                ].map((stat, i) => (
                  <div key={i} className={`glass-card p-6 border-white/10 bg-gradient-to-br ${stat.gradient} hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-bold mt-3 text-white">{stat.value}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card overflow-hidden border-white/10">
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-white">ลูกค้าล่าสุด</h3>
                    </div>
                    <button onClick={() => setView("customers")} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                      ดูทั้งหมด <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>
                <TableSummary customers={customers.slice(0, 5)} />
              </div>
            </div>
          ) : currentView === "customers" ? (
            <CustomerTable customers={customers} onEdit={(c) => { setEditingCustomer(c); setBranchInputs(c.branches || []); setModalOpen(true); }} onDelete={(id) => { const customer = customers.find(c => c.id === id); setDeleteConfirm({ type: 'customer', id, title: customer?.name || 'Customer' }); }} onImport={handleImportCSV} />
          ) : currentView === "user_management" ? (
            <UserManager users={users} roles={roles} onSave={handleSaveUser} onDelete={handleDeleteUser} />
          ) : currentView === "role_management" ? (
            <RoleManager roles={roles} onSave={handleSaveRole} onDelete={handleDeleteRole} />
          ) : currentView === "issues" ? (
            <IssueManager issues={issues} customers={customers} onAdd={() => { setEditingIssue(null); setSelectedCustomerId(null); setSelectedCustomerName(""); setSelectedBranchName(""); setSelectedFiles([]); setModalMode('create'); setIssueModalOpen(true); }} onEdit={(issue) => { setEditingIssue(issue); setSelectedCustomerId(issue.customerId); setSelectedCustomerName(issue.customerName); setSelectedBranchName(issue.branchName || ""); setSelectedFiles(JSON.parse(issue.attachments || "[]")); setModalMode('edit'); setIssueModalOpen(true); }} onDelete={(id) => { const issue = issues.find(i => i.id === id); setDeleteConfirm({ type: 'issue', id, title: issue?.title || 'Issue' }); }} />
          ) : currentView === "installations" ? (
            <InstallationManager installations={installations} customers={customers} onAddInstallation={handleAddInstallation} onUpdateStatus={handleUpdateInstallationStatus} onAssignDev={handleAssignDev} />
          ) : null}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Simplified Customer Modal for types fix - in a real app would have full fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="glass-card w-full max-w-4xl p-6 relative shadow-2xl">
            <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X /></button>
            <h2 className="text-xl font-bold mb-6">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
            <form onSubmit={handleSaveCustomer}>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ชื่อคลินิก/ร้าน</label>
                    <input name="name" defaultValue={editingCustomer?.name} className="input-field py-1.5 h-8 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Subdomain / Link</label>
                    <input name="subdomain" defaultValue={editingCustomer?.subdomain} className="input-field py-1.5 h-8 text-xs" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">ประเภทระบบ</label>
                      <CustomSelect name="product" defaultValue={editingCustomer?.productType || "Dr.Ease"} options={[{ value: "Dr.Ease", label: "Dr.Ease" }, { value: "EasePos", label: "EasePos" }]} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">แพ็คเกจ</label>
                      <CustomSelect name="package" defaultValue={editingCustomer?.package || "Standard"} options={[{ value: "Starter", label: "Starter" }, { value: "Standard", label: "Standard" }, { value: "Elite", label: "Elite" }]} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-white/10">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost flex-1">ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal and Delete Confirm remain similar but with updated attachments handling */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIssueModalOpen(false)} />
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl border-indigo-500/20">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingIssue ? "Edit Issue" : "New Issue"}</h2>
              <button onClick={() => setIssueModalOpen(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="issue-form" onSubmit={handleSaveIssue} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Customer</label>
                  <SearchableCustomerSelect customers={customers} value={selectedCustomerId} onChange={(id, name) => { setSelectedCustomerId(id); setSelectedCustomerName(name); }} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Subject</label>
                  <input name="title" defaultValue={editingIssue?.title} className="input-field py-1.5 h-8 text-xs" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect name="type" defaultValue={editingIssue?.type || "issue"} options={[{ value: "issue", label: "Issue" }, { value: "request", label: "Request" }]} />
                  <CustomSelect name="severity" defaultValue={editingIssue?.severity || "ต่ำ"} options={[{ value: "ต่ำ", label: "ต่ำ" }, { value: "ปานกลาง", label: "ปานกลาง" }, { value: "สูง", label: "สูง" }]} />
                </div>
                <textarea name="description" defaultValue={editingIssue?.description} className="input-field min-h-[100px] text-xs" placeholder="Description..." />
              </form>
            </div>
            <div className="p-6 border-t border-white/5 flex gap-2">
              <button onClick={() => setIssueModalOpen(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button form="issue-form" type="submit" className="btn btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="glass-card w-full max-w-sm p-6 relative border-rose-500/20 text-center">
            <h3 className="text-lg font-bold mb-2">ยืนยันการลบ?</h3>
            <p className="text-sm text-slate-400 mb-6">{deleteConfirm.title}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => {
                if (deleteConfirm.type === 'customer' && deleteConfirm.id) handleDeleteCustomer(deleteConfirm.id);
                if (deleteConfirm.type === 'issue' && deleteConfirm.id) handleDeleteIssue(deleteConfirm.id);
                setDeleteConfirm(null);
              }} className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
