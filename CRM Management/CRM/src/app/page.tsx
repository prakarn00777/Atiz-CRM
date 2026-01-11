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

interface Branch {
  name: string;
  isMain: boolean;
  address?: string;
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

interface Customer {
  id: number;
  name: string;
  link: string;
  package: string;
  status: string;
  branches?: Branch[];
  product?: "Dr.Ease" | "EasePos"; // Added product field
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

interface Installation {
  id: number;
  customerId: number;
  customerName: string;
  systemLink?: string; // Added system link
  status: "Pending" | "Installing" | "Completed";
  requestedBy: string;
  requestedAt: string;
  assignedDev?: string;
  completedAt?: string;
  notes?: string;
}

export default function CRMPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentView, setView] = useState("dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [branchInputs, setBranchInputs] = useState<Branch[]>([]);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'branch' | 'customer' | 'issue', id?: number, index?: number, title?: string } | null>(null);
  const [tempBranchName, setTempBranchName] = useState("");
  const [tempBranchAddress, setTempBranchAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Issue States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isIssueModalOpen, setIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; size: number; data: string }[]>([]);

  // User & Role State
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Installation States
  const [installations, setInstallations] = useState<Installation[]>([]);

  // Initial Data
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

    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      const initial: Customer[] = [
        {
          id: 1,
          name: "คลินิกความงาม ออร่า",
          link: "https://aura.example.com",
          package: "Elite",
          status: "ใช้งาน",
          product: "Dr.Ease",
          branches: [
            { name: "สาขาสยาม", isMain: true, address: "สยามสแควร์ ซอย 1" },
            { name: "สาขาเซ็นทรัลลาดพร้าว", isMain: false, address: "ชั้น 3 โซนบิวตี้" }
          ]
        },
        {
          id: 2,
          name: "สไมล์ เดนทัล",
          link: "https://smile.example.com",
          package: "Standard",
          status: "รอการใช้งาน",
          product: "Dr.Ease",
          branches: [
            { name: "สาขาพระราม 9", isMain: true, address: "G Tower ชั้น G" }
          ]
        },
        {
          id: 3,
          name: "ร้านกาแฟ อาราบิก้า",
          link: "https://arabica.example.com",
          package: "Starter",
          status: "ติดตั้งแล้ว",
          product: "EasePos",
          branches: []
        },
        {
          id: 4,
          name: "เพ็ท แอนด์ มี",
          link: "https://petme.example.com",
          package: "Starter",
          status: "ยกเลิก",
          product: "EasePos",
          branches: []
        }
      ];
      setCustomers(initial);
      localStorage.setItem("crm_customers_v2", JSON.stringify(initial));
    }
    // ... (rest of useEffect)


    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    } else {
      const initialRoles = [
        { id: "admin", name: "Administrator", description: "ผู้ดูแลระบบสูงสุด", permissions: ["dashboard", "customers", "user_management", "role_management"] },
        { id: "staff", name: "Staff", description: "เจ้าหน้าที่ทั่วไป", permissions: ["dashboard", "customers"] }
      ];
      setRoles(initialRoles);
      localStorage.setItem("crm_roles_v2", JSON.stringify(initialRoles));
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

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("crm_user_v2");
  };

  const handleDeleteCustomer = (id: number) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    localStorage.setItem("crm_customers_v2", JSON.stringify(updated));
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Customer = {
      id: editingCustomer ? editingCustomer.id : (customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1),
      name: formData.get("name") as string,
      link: formData.get("link") as string,
      package: formData.get("package") as string,
      status: editingCustomer ? (formData.get("status") as string) : "รอการติดตั้ง",
      product: (formData.get("product") as any) || "Dr.Ease",
      branches: branchInputs.filter(b => b.name.trim() !== ""),
      createdBy: editingCustomer?.createdBy || user?.name,
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString(),
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

    // Auto-create installation request
    let installCreated = false;
    if (!editingCustomer && data.status === "รอการติดตั้ง") {
      const newInst: Installation = {
        id: installations.length > 0 ? Math.max(...installations.map(i => i.id)) + 1 : 1,
        customerId: data.id,
        customerName: data.name,
        status: "Pending",
        requestedBy: user?.name || "System",
        requestedAt: new Date().toISOString(),
      };

      const updatedInst = [...installations, newInst];
      setInstallations(updatedInst);
      localStorage.setItem("crm_installations_v2", JSON.stringify(updatedInst));
      installCreated = true;
    }

    // Show notifications
    const isNewCustomer = !editingCustomer;
    let message = isNewCustomer
      ? `เพิ่มลูกค้า "${data.name}" สำเร็จ!`
      : `แก้ไขข้อมูล "${data.name}" สำเร็จ!`;

    if (installCreated) {
      message += " พร้อมสร้างใบงานติดตั้งอัตโนมัติ";
    }

    setToast({ message, type: "success" });

    // Desktop notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("CRM - " + (isNewCustomer ? "ลูกค้าใหม่" : "แก้ไขข้อมูล"), {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  // User Management Handlers
  const handleSaveUser = (userData: any) => {
    const updated = users.find(u => u.id === userData.id)
      ? users.map(u => u.id === userData.id ? userData : u)
      : [...users, userData];
    setUsers(updated);
    localStorage.setItem("crm_system_users_v2", JSON.stringify(updated));
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("ยืนยันการลบผู้ใช้งาน?")) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem("crm_system_users_v2", JSON.stringify(updated));
    }
  };

  // Role Management Handlers
  const handleSaveRole = (roleData: any) => {
    const updated = roles.find(r => r.id === roleData.id)
      ? roles.map(r => r.id === roleData.id ? roleData : r)
      : [...roles, roleData];
    setRoles(updated);
    localStorage.setItem("crm_roles_v2", JSON.stringify(updated));
  };

  const handleDeleteRole = (id: string) => {
    if (confirm("ยืนยันการลบบทบาท?")) {
      const updated = roles.filter(r => r.id !== id);
      setRoles(updated);
      localStorage.setItem("crm_roles_v2", JSON.stringify(updated));
    }
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.15),transparent_25%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,0.1),transparent_25%)]">
        <div className="glass-card w-full max-w-md p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex w-16 h-16 bg-indigo-500 rounded-2xl items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">เข้าสู่ระบบ CRM</h2>
            <p className="text-slate-400">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">ชื่อผู้ใช้งาน</label>
              <input name="username" type="text" className="input-field" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">รหัสผ่าน</label>
              <input name="password" type="password" className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary w-full py-4 text-lg">เข้าสู่ระบบ</button>
          </form>
        </div>
      </div>
    );
  }

  // Issue Handlers
  const handleSaveIssue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    if (!selectedCustomerId) {
      setToast({ message: "กรุณาเลือกลูกค้าที่ต้องการแจ้งปัญหา", type: "error" });
      return;
    }

    if (!title.trim()) {
      setToast({ message: "กรุณาระบุหัวข้อปัญหา", type: "error" });
      return;
    }

    const newId = editingIssue ? editingIssue.id : (issues.length > 0 ? Math.max(...issues.map(i => i.id)) + 1 : 1);

    let caseNumber = editingIssue?.caseNumber || "";
    if (!caseNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const sequence = (issues.length + 1).toString().padStart(4, "0");
      caseNumber = `CS${year}${month}-${sequence}`;
    }

    const data: Issue = {
      id: newId,
      caseNumber: caseNumber,
      title: formData.get("title") as string,
      customerId: selectedCustomerId,
      customerName: selectedCustomerName,
      severity: (formData.get("severity") as any) || "ต่ำ",
      status: (formData.get("status") as any) || "แจ้งเคส",
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      attachments: selectedFiles,
      createdBy: editingIssue?.createdBy || user?.name,
      createdAt: editingIssue?.createdAt || new Date().toISOString(),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString(),
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
    setSelectedCustomerId(null);
    setSelectedCustomerName("");
    setSelectedFiles([]);

    setToast({
      message: editingIssue ? `อัพเดทเคส ${caseNumber} สำเร็จ` : `สร้างเคส ${caseNumber} สำเร็จ`,
      type: "success"
    });
  };

  const handleDeleteIssue = (id: number) => {
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    localStorage.setItem("crm_issues_v2", JSON.stringify(updated));
    setToast({ message: "ลบเคสเรียบร้อยแล้ว", type: "info" });
  };

  // Installation Handlers
  const handleAddInstallation = (newInst: Partial<Installation>) => {
    const customer = customers.find(c => c.id === newInst.customerId);
    const data: Installation = {
      id: installations.length > 0 ? Math.max(...installations.map(i => i.id)) + 1 : 1,
      customerId: newInst.customerId || 0,
      customerName: newInst.customerName || "",
      status: "Pending",
      requestedBy: user?.name || "System",
      requestedAt: new Date().toISOString(),
      notes: newInst.notes,
    };
    const updated = [...installations, data];
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
    setToast({ message: `แจ้งงานติดตั้งแผนก DEV สำหรับคุณ ${data.customerName} เรียบร้อยแล้ว`, type: "success" });
  };

  const handleUpdateInstallationStatus = (id: number, status: "Pending" | "Installing" | "Completed") => {
    const updated = installations.map(inst => {
      if (inst.id === id) {
        const newData = { ...inst, status, assignedDev: inst.assignedDev || user?.name };
        if (status === "Completed") newData.completedAt = new Date().toISOString();
        return newData;
      }
      return inst;
    });
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));

    // Auto-update customer status to "Active" if installation is completed
    if (status === "Completed") {
      const targetInst = installations.find(i => i.id === id);
      if (targetInst) {
        const updatedCustomers = customers.map(c =>
          c.id === targetInst.customerId ? { ...c, status: "ติดตั้งแล้ว" } : c
        );
        setCustomers(updatedCustomers);
        localStorage.setItem("crm_customers_v2", JSON.stringify(updatedCustomers));
        setToast({ message: `ติดตั้งระบบเรียบร้อยแล้ว! สถานะลูกค้า ${targetInst.customerName} ถูกปรับเป็น "ติดตั้งแล้ว" อัตโนมัติ`, type: "success" });
      }
    } else {
      setToast({ message: `อัพเดทสถานะงานติดตั้งเป็น ${status} เรียบร้อยแล้ว`, type: "info" });
    }
  };

  const handleAssignDev = (id: number, devName: string) => {
    const updated = installations.map(inst => inst.id === id ? { ...inst, assignedDev: devName } : inst);
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar
        currentView={currentView}
        setView={setView}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 lg:p-6 overflow-x-hidden min-h-screen">
        <div
          key={currentView}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ willChange: "opacity, transform" }}
        >
          {currentView === "dashboard" ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-400">ภาพรวมข้อมูลลูกค้าและสถิติการใช้งาน</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "ลูกค้าทั้งหมด",
                    value: customers.length,
                    icon: Users,
                    gradient: "from-indigo-500/20 to-purple-500/20",
                    iconColor: "text-indigo-400",
                    trend: "+12%"
                  },
                  {
                    label: "ใช้งานอยู่",
                    value: customers.filter(c => c.status === "ใช้งาน").length,
                    icon: Activity,
                    gradient: "from-emerald-500/20 to-teal-500/20",
                    iconColor: "text-emerald-400",
                    trend: "+8%"
                  },
                  {
                    label: "แพ็คเกจ Elite",
                    value: customers.filter(c => c.package === "Elite").length,
                    icon: Award,
                    gradient: "from-amber-500/20 to-orange-500/20",
                    iconColor: "text-amber-400",
                    trend: "+5%"
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className={`glass-card p-6 border-white/10 bg-gradient-to-br ${stat.gradient} hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-3xl font-bold mt-3 text-white">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">{stat.trend}</span>
                            <span className="text-xs text-slate-500">vs เดือนที่แล้ว</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Customers Table */}
              <div className="glass-card overflow-hidden border-white/10">
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-white">ลูกค้าล่าสุด</h3>
                      <p className="text-xs text-slate-400 mt-1">รายการลูกค้าที่เพิ่มเข้ามาใหม่</p>
                    </div>
                    <button
                      onClick={() => setView("customers")}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
                    >
                      ดูทั้งหมด
                      <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
                <TableSummary customers={customers.slice(0, 5)} />
              </div>
            </div>
          ) : currentView === "customers" ? (
            <CustomerTable
              customers={customers}
              onAdd={() => { setEditingCustomer(null); setBranchInputs([]); setModalOpen(true); }}
              onEdit={(c) => { setEditingCustomer(c); setBranchInputs(c.branches || []); setModalOpen(true); }}
              onDelete={(id) => {
                const customer = customers.find(c => c.id === id);
                setDeleteConfirm({ type: 'customer', id, title: customer?.name || 'Customer' });
              }}
            />
          ) : currentView === "user_management" ? (
            <UserManager
              users={users}
              roles={roles}
              onSave={handleSaveUser}
              onDelete={handleDeleteUser}
            />
          ) : currentView === "role_management" ? (
            <RoleManager
              roles={roles}
              onSave={handleSaveRole}
              onDelete={handleDeleteRole}
            />
          ) : currentView === "issues" ? (
            <IssueManager
              issues={issues}
              customers={customers}
              onAdd={() => {
                setEditingIssue(null);
                setSelectedCustomerId(null);
                setSelectedCustomerName("");
                setSelectedFiles([]);
                setIssueModalOpen(true);
              }}
              onEdit={(issue) => {
                setEditingIssue(issue);
                setSelectedCustomerId(issue.customerId);
                setSelectedCustomerName(issue.customerName);
                setSelectedFiles(issue.attachments || []);
                setIssueModalOpen(true);
              }}
              onDelete={(id) => {
                const issue = issues.find(i => i.id === id);
                setDeleteConfirm({ type: 'issue', id, title: issue?.title || 'Issue' });
              }}
            />
          ) : currentView === "installations" ? (
            <InstallationManager
              installations={installations}
              customers={customers}
              onAddInstallation={handleAddInstallation}
              onUpdateStatus={handleUpdateInstallationStatus}
              onAssignDev={handleAssignDev}
            />
          ) : null}
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="glass-card w-full max-w-4xl p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
              {editingCustomer && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <span className="text-xs text-slate-400">รหัสลูกค้า:</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      DE{editingCustomer.id.toString().padStart(4, "0")}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-xs text-slate-400">จำนวนสาขา:</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {(editingCustomer.branches?.length || 0) + (branchInputs.filter(b => !b.isMain).length > 0 ? branchInputs.filter(b => !b.isMain).length : 0)} สาขา
                    </span>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Main Form */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ชื่อคลินิก/ร้าน</label>
                    <input name="name" defaultValue={editingCustomer?.name} className="input-field py-1.5 h-8 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">ลิงก์เข้าสู่ระบบ</label>
                    <input name="link" type="url" defaultValue={editingCustomer?.link} className="input-field py-1.5 h-8 text-xs" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">ประเภทระบบ</label>
                      <CustomSelect
                        name="product"
                        defaultValue={editingCustomer?.product || "Dr.Ease"}
                        options={[
                          { value: "Dr.Ease", label: "Dr.Ease (คลินิก)" },
                          { value: "EasePos", label: "EasePos (ร้านค้า)" },
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">แพ็คเกจ</label>
                      <CustomSelect
                        name="package"
                        defaultValue={editingCustomer?.package || "Standard"}
                        options={[
                          { value: "Starter", label: "Starter" },
                          { value: "Standard", label: "Standard" },
                          { value: "Elite", label: "Elite" },
                        ]}
                      />
                    </div>
                    {editingCustomer && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">สถานะ</label>
                        <CustomSelect
                          name="status"
                          defaultValue={editingCustomer?.status || "ใช้งาน"}
                          options={[
                            { value: "ใช้งาน", label: "ใช้งาน" },
                            { value: "ติดตั้งแล้ว", label: "ติดตั้งแล้ว" },
                            { value: "รอการใช้งาน", label: "รอการใช้งาน" },
                            { value: "ยกเลิก", label: "ยกเลิก" },
                            { value: "รอการติดตั้ง", label: "รอการติดตั้ง" },
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  {/* Main Branch Field */}
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-medium text-slate-400">สาขาหลัก</label>
                    <input
                      value={branchInputs.find(b => b.isMain)?.name || "สำนักงานใหญ่"}
                      onChange={(e) => {
                        const updated = [...branchInputs];
                        const mainBranchIndex = updated.findIndex(b => b.isMain);
                        if (mainBranchIndex >= 0) {
                          updated[mainBranchIndex].name = e.target.value;
                        } else {
                          updated.unshift({ name: e.target.value, isMain: true, address: "" });
                        }
                        setBranchInputs(updated);
                      }}
                      className="input-field py-1.5 h-8 text-xs"
                      placeholder="สำนักงานใหญ่"
                    />
                    <p className="text-[10px] text-slate-500 italic">สาขานี้จะถูกกำหนดเป็นสาขาหลักโดยอัตโนมัติ</p>
                  </div>
                </div>

                {/* Right Column - Branch List */}
                <div className="space-y-3 lg:border-l lg:border-white/10 lg:pl-6">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-400">รายการสาขาย่อย</label>
                    {!isAddingBranch && editingBranchIndex === null && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBranch(true);
                          setTempBranchName("");
                          setTempBranchAddress("");
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> เพิ่มสาขาย่อย
                      </button>
                    )}
                  </div>

                  {/* Add/Edit Form */}
                  {(isAddingBranch || editingBranchIndex !== null) && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-indigo-400">
                        {isAddingBranch ? "เพิ่มสาขาใหม่" : "แก้ไขสาขา"}
                      </p>
                      <input
                        value={tempBranchName}
                        onChange={(e) => setTempBranchName(e.target.value)}
                        className="input-field py-1.5 h-8 text-xs"
                        placeholder="ชื่อสาขา (เช่น สาขาสยาม)"
                      />
                      <input
                        value={tempBranchAddress}
                        onChange={(e) => setTempBranchAddress(e.target.value)}
                        className="input-field py-1.5 h-8 text-xs"
                        placeholder="ที่อยู่ / รายละเอียด"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (tempBranchName.trim()) {
                              if (isAddingBranch) {
                                setBranchInputs([...branchInputs, { name: tempBranchName, isMain: false, address: tempBranchAddress }]);
                              } else if (editingBranchIndex !== null) {
                                const updated = [...branchInputs];
                                updated[editingBranchIndex] = { name: tempBranchName, isMain: false, address: tempBranchAddress };
                                setBranchInputs(updated);
                              }
                              setIsAddingBranch(false);
                              setEditingBranchIndex(null);
                              setTempBranchName("");
                              setTempBranchAddress("");
                            }
                          }}
                          className="btn btn-primary flex-1 h-8"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingBranch(false);
                            setEditingBranchIndex(null);
                            setTempBranchName("");
                            setTempBranchAddress("");
                          }}
                          className="btn btn-ghost flex-1 h-8"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Branch List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                    {branchInputs.filter(b => !b.isMain).length > 0 ? (
                      branchInputs.filter(b => !b.isMain).map((branch, idx) => {
                        const actualIndex = branchInputs.indexOf(branch);
                        return (
                          <div key={actualIndex} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">{branch.name}</p>
                                {branch.address && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{branch.address}</p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBranchIndex(actualIndex);
                                    setTempBranchName(branch.name);
                                    setTempBranchAddress(branch.address || "");
                                    setIsAddingBranch(false);
                                  }}
                                  className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ type: 'branch', index: actualIndex, title: branch.name })}
                                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      !isAddingBranch && editingBranchIndex === null && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
                          <p className="text-[10px] text-slate-500 italic">ยังไม่มีสาขาย่อย</p>
                          <p className="text-[10px] text-slate-600 mt-1">คลิก "เพิ่มสาขาย่อย" เพื่อเพิ่ม</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-white/10">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost flex-1">ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="glass-card w-full max-w-2xl p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIssueModalOpen(false);
                setSelectedFiles([]);
              }}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold">{editingIssue ? "Edit Issue Details" : "Create New Case"}</h2>
              {editingIssue && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg mt-2">
                  <span className="text-xs text-slate-400">Case ID:</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{editingIssue.caseNumber}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    Customer <span className="text-rose-500">*</span>
                  </label>
                  <SearchableCustomerSelect
                    customers={customers}
                    value={selectedCustomerId}
                    onChange={(id, name) => {
                      setSelectedCustomerId(id);
                      setSelectedCustomerName(name);
                    }}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    Case Subject / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="title"
                    defaultValue={editingIssue?.title}
                    className="input-field py-1.5 h-8 text-xs"
                    placeholder="Briefly describe the issue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Issue Type</label>
                  <CustomSelect
                    name="type"
                    defaultValue={editingIssue?.type || "issue/bug"}
                    options={[
                      { value: "issue/bug", label: "issue/bug" },
                      { value: "data request", label: "data request" },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Severity</label>
                  <CustomSelect
                    name="severity"
                    defaultValue={editingIssue?.severity || "ต่ำ"}
                    options={[
                      { value: "ต่ำ", label: "ต่ำ" },
                      { value: "ปานกลาง", label: "ปานกลาง" },
                      { value: "สูง", label: "สูง" },
                      { value: "วิกฤต", label: "วิกฤต" },
                    ]}
                  />
                </div>

                {editingIssue && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Status</label>
                    <CustomSelect
                      name="status"
                      defaultValue={editingIssue?.status || "แจ้งเคส"}
                      options={[
                        { value: "แจ้งเคส", label: "แจ้งเคส" },
                        { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
                        { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
                      ]}
                    />
                  </div>
                )}

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Attachments (Images, PDF, Video)</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[10px] text-slate-300">
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,application/pdf,video/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setSelectedFiles(prev => [...prev, {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: reader.result as string
                              }]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                      <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 border-dashed px-3 py-1 rounded-lg text-[10px] text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                        <Plus className="w-3 h-3" /> Add Files
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingIssue?.description}
                    className="input-field py-2 text-xs min-h-[100px] resize-none"
                    placeholder="Provide more details about the issue..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="btn btn-ghost flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 py-2"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-card w-full max-w-sm p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 border-rose-500/20">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {deleteConfirm.type === 'branch' ? 'ยืนยันการลบสาขา?' :
                    deleteConfirm.type === 'customer' ? 'ยืนยันการลบลูกค้า?' :
                      deleteConfirm.type === 'issue' ? 'Confirm Delete Issue?' :
                        'ยืนยันการลบรายการ?'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {deleteConfirm.type === 'branch' ? `คุณแน่ใจหรือไม่ว่าต้องการลบสาขา "${deleteConfirm.title}"?` :
                    deleteConfirm.type === 'customer' ? `คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า "${deleteConfirm.title}"?` :
                      deleteConfirm.type === 'issue' ? `Are you sure you want to delete issue "${deleteConfirm.title}"?` :
                        `คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${deleteConfirm.title}"?`}
                  <br />
                  {deleteConfirm.type === 'issue' ? 'This action cannot be undone.' : 'การดำเนินการนี้ไม่สามารถย้อนกลับได้'}
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-ghost flex-1 py-2 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'branch' && deleteConfirm.index !== undefined) {
                      setBranchInputs(branchInputs.filter((_, i) => i !== deleteConfirm.index));
                    } else if (deleteConfirm.type === 'customer' && deleteConfirm.id !== undefined) {
                      handleDeleteCustomer(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'issue' && deleteConfirm.id !== undefined) {
                      handleDeleteIssue(deleteConfirm.id);
                    }
                    setDeleteConfirm(null);
                  }}
                  className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 py-2 rounded-xl transition-all font-medium text-xs shadow-lg shadow-rose-500/20"
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "ใช้งาน" ? "text-emerald-400 bg-emerald-500/10" :
                c.status === "รอการใช้งาน" ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10"
                }`}>{c.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
