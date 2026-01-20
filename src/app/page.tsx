"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import CustomerTable from "@/components/CustomerTable";
import { Layers, X, ChevronDown, Plus, Edit2, Trash2, Users, Activity, Award, TrendingUp, Clock, AlertTriangle, MapPin, Play, CheckCircle2, AlertCircle, Paperclip } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import UserManager from "@/components/UserManager";
import RoleManager from "@/components/RoleManager";
import Toast from "@/components/Toast";
import IssueManager from "@/components/IssueManager";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SegmentedControl from "@/components/SegmentedControl";
import Dashboard from "@/components/Dashboard";
import InstallationManager from "@/components/InstallationManager";
import NotificationBell from "@/components/NotificationBell";
import { Customer, Branch, Installation, Issue, UsageStatus } from "@/types";
import { useNotification } from "@/components/NotificationProvider";
import {
  importCustomersFromCSV, getCustomers, getIssues, getInstallations,
  getUsers, saveUser, deleteUser, getRoles, saveRole, deleteRole, loginUser
} from "./actions";

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
                c.usageStatus === "Pending" ? "text-amber-400 bg-amber-500/10" :
                  c.usageStatus === "Training" ? "text-indigo-400 bg-indigo-500/10" : "text-rose-400 bg-rose-500/10"
                }`}>{c.usageStatus === "Active" ? "ใช้งานแล้ว" :
                  c.usageStatus === "Pending" ? "รอการใช้งาน" :
                    c.usageStatus === "Training" ? "รอการเทรนนิ่ง" : "ยกเลิก"}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CRMPage() {
  const [currentView, setView] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
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
  const [isEditingName, setIsEditingName] = useState(false);

  // Branch states
  const [branchInputs, setBranchInputs] = useState<Branch[]>([]);
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [tempBranchName, setTempBranchName] = useState("");
  const [tempBranchAddress, setTempBranchAddress] = useState("");
  const [modalUsageStatus, setModalUsageStatus] = useState<UsageStatus>("Active");
  const [modalIssueStatus, setModalIssueStatus] = useState<"แจ้งเคส" | "กำลังดำเนินการ" | "เสร็จสิ้น">("แจ้งเคส");
  const [showConfetti, setShowConfetti] = useState(false);
  const { pushNotification, requestPermission } = useNotification();

  useEffect(() => {
    setMounted(true);
    requestPermission();
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
        const [cData, iData, instData, userData, roleData] = await Promise.all([
          getCustomers(),
          getIssues(),
          getInstallations(),
          getUsers(),
          getRoles()
        ]);
        if (cData.length > 0) setCustomers(cData);
        if (iData.length > 0) setIssues(iData);
        if (instData.length > 0) setInstallations(instData);
        if (userData.length > 0) setUsers(userData);
        if (roleData.length > 0) setRoles(roleData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const u_str = String(formData.get("username"));
    const p_str = String(formData.get("password"));

    setIsLoading(true);
    setToast({ message: "กำลังเข้าสู่ระบบ...", type: "info" });

    try {
      const result = await loginUser(u_str, p_str);

      if (result.success) {
        setUser(result.user);
        localStorage.setItem("crm_user_v2", JSON.stringify(result.user));
        setToast({ message: "เข้าสู่ระบบสำเร็จ", type: "success" });
      } else {
        setToast({ message: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", type: "error" });
      }
    } catch (err) {
      console.error("Login failed:", err);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่", type: "error" });
    } finally {
      setIsLoading(false);
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
      usageStatus: modalUsageStatus,
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
    setIsEditingName(false);
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
      status: modalIssueStatus,
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

    // Trigger Notification
    if (!editingIssue) {
      pushNotification(
        "📝 มีการแจ้งปัญหาใหม่",
        `เคส: ${data.title} (${data.customerName}) ถูกสร้างขึ้นโดย ${user?.name || 'System'}`,
        "info"
      );
    } else if (editingIssue.status !== modalIssueStatus) {
      pushNotification(
        "🔄 อัปเดตสถานะเคส",
        `เคส [${data.caseNumber}] เปลี่ยนสถานะเป็น ${modalIssueStatus}`,
        modalIssueStatus === "เสร็จสิ้น" ? "success" : "info"
      );
    }

    // Show confetti when completing an issue
    if (modalIssueStatus === "เสร็จสิ้น") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setToast({ message: "🎉 ยินดี! แก้ไขเคสเสร็จสิ้นแล้ว", type: "success" });
    } else {
      setToast({ message: "บันทึกข้อมูลเคสเรียบร้อยแล้ว", type: "success" });
    }
  };

  const handleDeleteIssue = (id: number) => {
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    localStorage.setItem("crm_issues_v2", JSON.stringify(updated));
    setToast({ message: "ลบเคสเรียบร้อยแล้ว", type: "success" });
  };

  const handleAddInstallation = (newInst: any) => {
    const nextInstId = installations.length > 0 ? Math.max(...installations.map(i => i.id)) + 1 : 1;
    let finalCustomerId = newInst.customerId || 0;
    let updatedCustomers = [...customers];

    // If it's a new customer, create the customer record first
    if (newInst.installationType === "new") {
      const nextCustId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      finalCustomerId = nextCustId;

      const newCustomer: Customer = {
        id: nextCustId,
        clientCode: `DE${nextCustId.toString().padStart(4, "0")}`,
        name: newInst.newCustomerName,
        subdomain: newInst.newCustomerLink,
        productType: newInst.newCustomerProduct,
        package: newInst.newCustomerPackage,
        usageStatus: "Pending",
        installationStatus: "Pending",
        branches: [
          { name: "สำนักงานใหญ่", isMain: true, status: "Pending" }
        ],
        createdBy: user?.name,
        createdAt: new Date().toISOString()
      };

      updatedCustomers = [...customers, newCustomer];
      setCustomers(updatedCustomers);
      localStorage.setItem("crm_customers_v2", JSON.stringify(updatedCustomers));
    } else if (newInst.installationType === "branch" && newInst.branchName) {
      // If it's a new branch for an existing customer, add the branch to the customer
      updatedCustomers = customers.map(c => {
        if (c.id === finalCustomerId) {
          const branches = c.branches || [];
          // Check if branch already exists to avoid duplicates
          if (!branches.some(b => b.name === newInst.branchName)) {
            return {
              ...c,
              branches: [...branches, { name: newInst.branchName, isMain: false, status: "Pending" }]
            };
          }
        }
        return c;
      });
      setCustomers(updatedCustomers);
      localStorage.setItem("crm_customers_v2", JSON.stringify(updatedCustomers));
    }

    const data: Installation = {
      id: nextInstId,
      customerId: finalCustomerId,
      customerName: newInst.installationType === "new" ? newInst.newCustomerName : (newInst.customerName || ""),
      customerLink: newInst.installationType === "new" ? newInst.newCustomerLink : undefined,
      branchName: newInst.installationType === "branch" ? newInst.branchName : undefined,
      status: "Pending",
      requestedBy: user?.name || "System",
      requestedAt: new Date().toISOString(),
      notes: newInst.notes,
      installationType: newInst.installationType
    };

    const updatedInst = [...installations, data];
    setInstallations(updatedInst);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updatedInst));

    setToast({ message: newInst.installationType === "new" ? "สร้างลูกค้าและเปิดงานติดตั้งสำเร็จ" : "แจ้งงานติดตั้งสาขาใหม่สำเร็จ", type: "success" });
  };

  const handleUpdateInstallationStatus = (id: number, status: Installation["status"]) => {
    const updated = installations.map(inst => {
      if (inst.id === id) {
        // If installation completed, also update customer/branch status
        if (status === "Completed") {
          const updatedCusts = customers.map(c => {
            if (c.id === inst.customerId) {
              const updatedBranches = c.branches?.map(b => {
                // If it's a branch installation, match branch name
                if (inst.installationType === "branch" && b.name === inst.branchName) {
                  return { ...b, status: "Completed" as const };
                }
                // If it's a new main installation
                if (inst.installationType === "new" && b.isMain) {
                  return { ...b, status: "Completed" as const };
                }
                return b;
              });
              return {
                ...c,
                installationStatus: "Completed" as const,
                branches: updatedBranches
              };
            }
            return c;
          });
          setCustomers(updatedCusts);
          localStorage.setItem("crm_customers_v2", JSON.stringify(updatedCusts));
        } else if (status === "Installing") {
          // Sync "Installing" status to customer and specific branch
          const updatedCusts = customers.map(c => {
            if (c.id === inst.customerId) {
              const updatedBranches = c.branches?.map(b => {
                if (inst.installationType === "branch" && b.name === inst.branchName) {
                  return { ...b, status: "Installing" as const };
                }
                if (inst.installationType === "new" && b.isMain) {
                  return { ...b, status: "Installing" as const };
                }
                return b;
              });
              return {
                ...c,
                installationStatus: "Installing" as const,
                branches: updatedBranches
              };
            }
            return c;
          });
          setCustomers(updatedCusts);
          localStorage.setItem("crm_customers_v2", JSON.stringify(updatedCusts));
        }

        return { ...inst, status, modifiedBy: user?.name, modifiedAt: new Date().toISOString() };
      }
      return inst;
    });
    setInstallations(updated);
    localStorage.setItem("crm_installations_v2", JSON.stringify(updated));
    setToast({ message: "อัปเดตสถานะงานติดตั้งเรียบร้อยแล้ว", type: "success" });
  };



  const handleSaveUser = async (userData: any) => {
    try {
      const result = await saveUser(userData);
      if (result.success) {
        const saved = result.data;
        const updated = users.find(u => u.id === saved.id)
          ? users.map(u => u.id === saved.id ? saved : u)
          : [...users, saved];
        setUsers(updated);
        setToast({ message: "บันทึกข้อมูลผู้ใช้งานสำเร็จ", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const result = await deleteUser(id);
      if (result.success) {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        setToast({ message: "ลบผู้ใช้งานเรียบร้อยแล้ว", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleSaveRole = async (roleData: any) => {
    try {
      const result = await saveRole(roleData);
      if (result.success) {
        const saved = result.data;
        const updated = roles.find(r => r.id === saved.id)
          ? roles.map(r => r.id === saved.id ? saved : r)
          : [...roles, saved];
        setRoles(updated);
        setToast({ message: "บันทึกข้อมูลบทบาทสำเร็จ", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const result = await deleteRole(id);
      if (result.success) {
        const updated = roles.filter(r => r.id !== id);
        setRoles(updated);
        setToast({ message: "ลบบทบาทเรียบร้อยแล้ว", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err: any) {
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
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
              <input name="username" className="input-field py-3 text-sm h-12" placeholder="Enter username" required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <input name="password" type="password" className="input-field py-3 text-sm h-12" placeholder="••••••••" required disabled={isLoading} />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-sm font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังตรวจสอบ...
                </span>
              ) : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30">
      <Sidebar
        currentView={currentView}
        setView={setView}
        onLogout={() => { setUser(null); localStorage.removeItem("crm_user_v2"); }}
        userRole={{ ...roles.find(r => r.id === user?.role), role: user?.role }}
      />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] relative">
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto relative z-10">
          <div className="absolute top-4 lg:top-8 right-4 lg:right-8 z-[100]">
            <NotificationBell />
          </div>
          {currentView === "dashboard" ? (
            <Dashboard
              customers={customers}
              installations={installations}
              issues={issues}
              user={user}
              onViewChange={setView}
            />
          ) : currentView === "customers" ? (
            <CustomerTable
              customers={customers}
              onEdit={(c) => {
                setEditingCustomer(c);
                const branches = c.branches && c.branches.length > 0
                  ? c.branches
                  : [{ name: "สำนักงานใหญ่", isMain: true, address: "", status: "Pending" as "Pending" }];
                setBranchInputs(branches);
                setModalUsageStatus(c.usageStatus || "Active");
                setActiveBranchIndex(0);
                setModalOpen(true);
              }}
              onDelete={(id) => {
                const customer = customers.find(c => c.id === id);
                setDeleteConfirm({ type: 'customer', id, title: customer?.name || 'Customer' });
              }}
              onImport={handleImportCSV}
            />
          ) : currentView === "user_management" ? (
            <UserManager users={users} roles={roles} onSave={handleSaveUser} onDelete={handleDeleteUser} />
          ) : currentView === "role_management" ? (
            <RoleManager roles={roles} onSave={handleSaveRole} onDelete={handleDeleteRole} />
          ) : currentView === "issues" ? (
            <IssueManager issues={issues} customers={customers} onAdd={() => { setEditingIssue(null); setSelectedCustomerId(null); setSelectedCustomerName(""); setSelectedBranchName(""); setSelectedFiles([]); setModalMode('create'); setModalIssueStatus("แจ้งเคส"); setIssueModalOpen(true); }} onEdit={(issue) => { setEditingIssue(issue); setSelectedCustomerId(issue.customerId); setSelectedCustomerName(issue.customerName); setSelectedBranchName(issue.branchName || ""); setSelectedFiles(JSON.parse(issue.attachments || "[]")); setModalMode('edit'); setModalIssueStatus(issue.status); setIssueModalOpen(true); }} onDelete={(id) => { const issue = issues.find(i => i.id === id); setDeleteConfirm({ type: 'issue', id, title: issue?.title || 'Issue' }); }} />
          ) : currentView === "installations" ? (
            <InstallationManager installations={installations} customers={customers} onAddInstallation={handleAddInstallation} onUpdateStatus={handleUpdateInstallationStatus} />
          ) : null}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Simplified Customer Modal for types fix - in a real app would have full fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col relative shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
              <button onClick={() => { setModalOpen(false); setIsEditingName(false); }} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"><X /></button>
            </div>
            <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
              <form onSubmit={handleSaveCustomer}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                      ข้อมูลพื้นฐาน
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {editingCustomer && (
                        <div className="col-span-2 flex items-center gap-6">
                          {/* Customer ID Badge */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Customer ID</label>
                            <div className="flex items-center">
                              <div className="bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-md px-2.5 py-1 flex items-center gap-2 group hover:border-indigo-500/40 transition-all duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-xs font-mono font-black text-indigo-400 tracking-tight leading-none">
                                  {editingCustomer.clientCode || `DE${editingCustomer.id.toString().padStart(4, "0")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-medium text-slate-400">ชื่อคลินิก/ร้าน</label>
                        {isEditingName || !editingCustomer ? (
                          <div className="relative group">
                            <input
                              name="name"
                              defaultValue={editingCustomer?.name}
                              className="input-field pr-10"
                              placeholder="กรอกชื่อคลินิกหรือร้าน..."
                              autoFocus={isEditingName}
                              required
                            />
                            {isEditingName && (
                              <button
                                type="button"
                                onClick={() => setIsEditingName(false)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 group hover:border-indigo-500/30 transition-all duration-200">
                            <span className="text-sm font-semibold text-slate-200">{editingCustomer?.name}</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingName(true)}
                              className="p-1 px-2 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                            >
                              <Edit2 className="w-3 h-3" />
                              แก้ไขชื่อ
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Subdomain / Link</label>
                        <input name="subdomain" defaultValue={editingCustomer?.subdomain} className="input-field" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">ประเภทระบบ</label>
                        <CustomSelect name="product" defaultValue={editingCustomer?.productType || "Dr.Ease"} options={[{ value: "Dr.Ease", label: "Dr.Ease" }, { value: "EasePos", label: "EasePos" }]} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">สถานะการใช้งาน</label>
                        <CustomSelect
                          options={[
                            { value: "Training", label: "รอการเทรนนิ่ง" },
                            { value: "Pending", label: "รอการใช้งาน" },
                            { value: "Active", label: "ใช้งานแล้ว" },
                            { value: "Canceled", label: "ยกเลิก" },
                          ]}
                          value={modalUsageStatus}
                          onChange={(val) => setModalUsageStatus(val as UsageStatus)}
                          placeholder="เลือกสถานะ..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">แพ็คเกจ</label>
                        <CustomSelect name="package" defaultValue={editingCustomer?.package || "Standard"} options={[{ value: "Starter", label: "Starter" }, { value: "Standard", label: "Standard" }, { value: "Elite", label: "Elite" }]} />
                      </div>

                    </div>
                  </div>

                  {/* Branch Management - Master Detail Layout */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                        จัดการสาขา ({branchInputs.length})
                      </h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 h-[320px] bg-slate-900/40 rounded-xl border border-white/5 p-4">
                      {/* Left: Branch List */}
                      <div className="w-full md:w-1/3 flex flex-col border-r border-white/5 pr-4">
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                          {branchInputs.map((branch, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setActiveBranchIndex(idx)}
                              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${idx === activeBranchIndex
                                ? "bg-indigo-500/10 border-indigo-500/30 shadow-sm"
                                : "bg-transparent border-transparent hover:bg-white/5"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${idx === activeBranchIndex ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
                                    }`}>
                                    {idx + 1}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-semibold truncate max-w-[120px] ${idx === activeBranchIndex ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                      }`}>
                                      {branch.name || "ระบุชื่อสาขา..."}
                                    </span>
                                    {branch.isMain && (
                                      <span className="text-[9px] text-emerald-400 font-medium">Main Branch</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status Indicator Dot */}
                              <div className={`absolute right-3 top-3 w-1.5 h-1.5 rounded-full ${branch.status === "Completed" ? "bg-emerald-500" :
                                branch.status === "Installing" ? "bg-blue-500" : "bg-slate-600"
                                }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Branch Details */}
                      <div className="flex-1 pl-2">
                        {branchInputs[activeBranchIndex] ? (
                          <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-2 duration-200">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                              <div>
                                <h4 className="text-sm font-semibold text-white">รายละเอียดสาขา</h4>
                                <p className="text-[10px] text-slate-500">แก้ไขข้อมูลและจัดการสถานะของสาขาที่เลือก</p>
                              </div>
                              {!branchInputs[activeBranchIndex].isMain && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({ type: 'branch', index: activeBranchIndex, title: branchInputs[activeBranchIndex].name || "สาขาที่เลือก" })}
                                  className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  ลบสาขานี้
                                </button>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">ชื่อสาขา (Branch Name)</label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={branchInputs[activeBranchIndex].name}
                                    onChange={(e) => {
                                      const updated = [...branchInputs];
                                      updated[activeBranchIndex].name = e.target.value;
                                      setBranchInputs(updated);
                                    }}
                                    placeholder="เช่น สาขาสยามพารากอน..."
                                    className="input-field pl-9 py-2 text-sm w-full"
                                    autoFocus
                                  />
                                </div>
                              </div>



                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">สถานะการติดตั้ง (Installation Status)</label>
                                <div className="h-9 flex items-center">
                                  {(() => {
                                    const activeBranch = branchInputs[activeBranchIndex];
                                    const inst = installations.find(i =>
                                      i.customerId === editingCustomer?.id &&
                                      ((activeBranch.isMain && i.installationType === "new") ||
                                        (!activeBranch.isMain && i.installationType === "branch" && i.branchName === activeBranch.name))
                                    );

                                    if (inst) {
                                      const getStatusIcon = (status: string) => {
                                        switch (status) {
                                          case "Pending": return <Clock className="w-3.5 h-3.5 text-amber-400" />;
                                          case "Installing": return <Play className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />;
                                          case "Completed": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                                          default: return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
                                        }
                                      };

                                      const getStatusStyle = (status: string) => {
                                        switch (status) {
                                          case "Pending": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
                                          case "Installing": return "bg-indigo-500/15 text-indigo-400 border-indigo-500/20";
                                          case "Completed": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
                                          default: return "bg-slate-500/15 text-slate-400 border-slate-500/20";
                                        }
                                      };

                                      const statusLabel = inst.status; // Directly use English status label

                                      return (
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusStyle(inst.status)}`}>
                                          {getStatusIcon(inst.status)}
                                          {statusLabel}
                                        </div>
                                      );
                                    }

                                    // Fallback to internal branch status
                                    return (
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm ${activeBranch.status === "Completed" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                                        activeBranch.status === "Installing" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                                          "bg-slate-500/15 text-slate-400 border border-slate-500/20"
                                        }`}>
                                        {activeBranch.status || "Pending"}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <MapPin className="w-12 h-12 mb-3" />
                            <p className="text-sm">เลือกสาขาเพื่อแก้ไขรายละเอียด</p>
                          </div>
                        )}
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
        </div>
      )}

      {/* Issue Modal and Delete Confirm remain similar but with updated attachments handling */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl border-indigo-500/20">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingIssue ? "Edit Issue" : "New Issue"}</h2>
              <button onClick={() => setIssueModalOpen(false)}><X /></button>
            </div>

            {/* Status Indicator Bar - Only show when editing */}
            {editingIssue && (
              <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status:</span>

                  {/* Clickable Status Flow Buttons - Forward Only */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={editingIssue.status !== "แจ้งเคส"}
                      onClick={() => setModalIssueStatus("แจ้งเคส")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${modalIssueStatus === "แจ้งเคส"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                        : editingIssue.status !== "แจ้งเคส"
                          ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/20"
                          : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                        }`}
                    >
                      แจ้งเคส
                    </button>

                    <span className="text-slate-600">→</span>

                    <button
                      type="button"
                      disabled={editingIssue.status === "เสร็จสิ้น"}
                      onClick={() => setModalIssueStatus("กำลังดำเนินการ")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${modalIssueStatus === "กำลังดำเนินการ"
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                        : editingIssue.status === "เสร็จสิ้น"
                          ? "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/20"
                          : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                        }`}
                    >
                      กำลังดำเนินการ
                    </button>

                    <span className="text-slate-600">→</span>

                    <button
                      type="button"
                      onClick={() => setModalIssueStatus("เสร็จสิ้น")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${modalIssueStatus === "เสร็จสิ้น"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                        }`}
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <form id="issue-form" onSubmit={handleSaveIssue} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Customer</label>
                  <SearchableCustomerSelect customers={customers} value={selectedCustomerId} onChange={(id, name) => { setSelectedCustomerId(id); setSelectedCustomerName(name); }} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Subject</label>
                  <input name="title" defaultValue={editingIssue?.title} className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Issue Type</label>
                    <CustomSelect
                      name="type"
                      defaultValue={editingIssue?.type || "Bug Report"}
                      options={[
                        { value: "Bug Report", label: "Bug Report" },
                        { value: "Data Request", label: "Data Request" },
                        { value: "System Modification", label: "System Modification" },
                        { value: "New Requirement", label: "New Requirement" }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Severity</label>
                    <CustomSelect
                      name="severity"
                      defaultValue={editingIssue?.severity || "Low"}
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "High", label: "High" },
                        { value: "Critical", label: "Critical" }
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Description</label>
                  <textarea name="description" defaultValue={editingIssue?.description} className="input-field min-h-[100px] text-xs" />
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Attachments</label>

                  {/* Upload Zone */}
                  <div
                    className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach(file => {
                            if (!file.type.startsWith('image/')) {
                              setToast({ message: `ไฟล์ ${file.name} ต้องเป็นรูปภาพเท่านั้น`, type: "error" });
                              return;
                            }
                            if (file.size > 2 * 1024 * 1024) {
                              setToast({ message: `ไฟล์ ${file.name} ใหญ่เกิน 2MB`, type: "error" });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setSelectedFiles(prev => [...prev, {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: reader.result as string
                              }]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300">คลิกเพื่อเลือกรูปภาพหรือลากไฟล์มาวาง</p>
                        <p className="text-[10px] text-slate-500 mt-1">รองรับ: รูปภาพเท่านั้น (สูงสุด 2MB ต่อไฟล์)</p>
                      </div>
                    </div>
                  </div>

                  {/* File Preview List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                          {/* Thumbnail for images */}
                          {file.type.startsWith('image/') ? (
                            <img src={file.data} alt={file.name} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost flex-1">ยกเลิก</button>
              <button onClick={() => {
                if (deleteConfirm.type === 'customer' && deleteConfirm.id) handleDeleteCustomer(deleteConfirm.id);
                if (deleteConfirm.type === 'issue' && deleteConfirm.id) handleDeleteIssue(deleteConfirm.id);
                if (deleteConfirm.type === 'branch' && deleteConfirm.index !== undefined) {
                  const filtered = branchInputs.filter((_, i) => i !== deleteConfirm.index);
                  setBranchInputs(filtered);
                  setActiveBranchIndex(Math.max(0, (deleteConfirm.index || 0) - 1));
                }
                setDeleteConfirm(null);
              }} className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1">ลบรายการ</button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                width: `${8 + Math.random() * 12}px`,
                height: `${8 + Math.random() * 12}px`,
                backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
