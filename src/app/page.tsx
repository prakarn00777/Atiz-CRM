"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import LoginTransition from "@/components/LoginTransition";
import CustomerTable from "@/components/CustomerTable";
import { Layers, X, ChevronDown, Plus, Edit2, Trash2, Users, Activity as ActivityIcon, Award, TrendingUp, Clock, AlertTriangle, MapPin, Play, CheckCircle2, AlertCircle, Paperclip, History as HistoryIcon, Download } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";
import UserManager from "@/components/UserManager";
import RoleManager from "@/components/RoleManager";
import ActivityManager from "@/components/ActivityManager";
import Toast from "@/components/Toast";
import IssueManager from "@/components/IssueManager";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SegmentedControl from "@/components/SegmentedControl";
import Dashboard from "@/components/Dashboard";
import InstallationManager from "@/components/InstallationManager";
import NotificationBell from "@/components/NotificationBell";
import LeadManager from "@/components/LeadManager";
import GoogleSheetLeadManager from "@/components/GoogleSheetLeadManager";
import DemoManager from "@/components/DemoManager";
import CustomDatePicker from "@/components/CustomDatePicker";
import { Customer, Branch, Installation, Issue, UsageStatus, Activity as CSActivity, ActivityType, SentimentType, Lead, GoogleSheetLead, MasterDemoLead, BusinessMetrics } from "@/types";
import { useNotification } from "@/components/NotificationProvider";
import { db } from "@/lib/db";
import {
  importCustomersFromCSV, getCustomers, getIssues, getInstallations,
  getUsers, saveUser, deleteUser, getRoles, saveRole, deleteRole, loginUser,
  saveIssue, deleteIssue, saveCustomer, deleteCustomer, saveInstallation, updateInstallationStatus,
  getActivities, saveActivity, deleteActivity,
  getLeads, saveLead, deleteLead, importLeads, getBusinessMetrics
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

// Reusable Modal Wrapper with smooth animations
const ModalWrapper = ({ isOpen, onClose, children, maxWidth = "max-w-2xl", zIndex = "z-[100]" }: {
  isOpen: boolean,
  onClose: () => void,
  children: React.ReactNode,
  maxWidth?: string,
  zIndex?: string
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`glass-card w-full ${maxWidth} max-h-[90vh] flex flex-col relative shadow-2xl border-white/10 transform transition-all duration-300 ease-out ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}>
        {children}
      </div>
    </div>
  );
};

export default function CRMPage() {
  const [currentView, setView] = useState(() => {
    if (typeof window === 'undefined') return "dashboard";
    return localStorage.getItem("crm_last_view_v2") || "dashboard";
  });
  const [showLoginTransition, setShowLoginTransition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isIssueModalOpen, setIssueModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_customers_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [issues, setIssues] = useState<Issue[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_issues_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [installations, setInstallations] = useState<Installation[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_installations_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [users, setUsers] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_system_users_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [roles, setRoles] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_roles_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [user, setUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem("crm_user_v2");
    try {
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'customer' | 'issue' | 'branch' | 'activity', id?: number, index?: number, title: string } | null>(null);
  const [activities, setActivities] = useState<CSActivity[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_activities_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CSActivity | null>(null);
  const [activitySentiment, setActivitySentiment] = useState<SentimentType>("Neutral");
  const [activityType, setActivityType] = useState<ActivityType>("Other");
  const [activityStatus, setActivityStatus] = useState("Open");
  const [activityAssignee, setActivityAssignee] = useState("");
  const [activityFollowUp, setActivityFollowUp] = useState("");
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window === 'undefined') return [];
    const cached = localStorage.getItem("crm_leads_v2");
    return cached ? JSON.parse(cached) : [];
  });
  const [googleSheetLeads, setGoogleSheetLeads] = useState<GoogleSheetLead[]>([]);
  const [googleSheetDemos, setGoogleSheetDemos] = useState<MasterDemoLead[]>([]);
  const [isGoogleSheetLeadsLoading, setGoogleSheetLeadsLoading] = useState(true);
  const [isGoogleSheetDemosLoading, setGoogleSheetDemosLoading] = useState(true);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | undefined>(undefined);
  const [isLeadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
  const [modalLeadDate, setModalLeadDate] = useState("");

  useEffect(() => {
    if (isLeadModalOpen && editingLead) {
      setModalLeadDate(editingLead.receivedDate || new Date().toISOString().split('T')[0]);
    } else if (isLeadModalOpen) {
      setModalLeadDate(new Date().toISOString().split('T')[0]);
    }
  }, [isLeadModalOpen, editingLead]);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { pushNotification, requestPermission } = useNotification();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const debounceTimer = useRef<any>(null);
  const customersRef = useRef<Customer[]>(customers);

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  const fetchData = useCallback(async () => {
    try {
      const [cData, iData, instData, userData, roleData, actData, lData, metricsResult] = await Promise.all([
        getCustomers(),
        getIssues(),
        getInstallations(),
        getUsers(),
        getRoles(),
        getActivities(),
        getLeads(),
        getBusinessMetrics()
      ]);

      // Update states
      setCustomers(cData);
      setIssues(iData);
      setInstallations(instData);
      setUsers(userData);
      setRoles(roleData);
      setActivities(actData as CSActivity[]);
      setLeads(lData);
      if (metricsResult.success) {
        setBusinessMetrics(metricsResult.data);
      }

      // Update cache for next load
      localStorage.setItem("crm_customers_v2", JSON.stringify(cData));
      localStorage.setItem("crm_issues_v2", JSON.stringify(iData));
      localStorage.setItem("crm_installations_v2", JSON.stringify(instData));
      localStorage.setItem("crm_system_users_v2", JSON.stringify(userData));
      localStorage.setItem("crm_roles_v2", JSON.stringify(roleData));
      localStorage.setItem("crm_activities_v2", JSON.stringify(actData));
      localStorage.setItem("crm_leads_v2", JSON.stringify(lData));
    } catch (err) {
      console.error("Background fetch failed:", err);
    }
  }, []);

  const fetchDataDebounced = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchData();
    }, 500);
  }, [fetchData]);

  // 3. Fetch leads from Google Sheets API
  const fetchGoogleSheetLeads = useCallback(async () => {
    try {
      setGoogleSheetLeadsLoading(true);
      const response = await fetch('/api/leads');
      const result = await response.json();
      if (result.success) {
        setGoogleSheetLeads(result.data);
      } else {
        console.error('Failed to fetch Google Sheet leads:', result.error, result.details);
        setToast({ message: `Google Sheet: ${result.details || result.error}`, type: "error" });
      }
    } catch (error: any) {
      console.error('Error fetching Google Sheet leads:', error);
      setToast({ message: "Error: " + (error.message || "Cannot connect to API"), type: "error" });
    } finally {
      setGoogleSheetLeadsLoading(false);
    }
  }, [setToast]);

  const fetchGoogleSheetDemos = useCallback(async () => {
    try {
      setGoogleSheetDemosLoading(true);
      const response = await fetch('/api/demos');
      const result = await response.json();
      if (result.success) {
        setGoogleSheetDemos(result.data);
      }
    } catch (error: any) {
      console.error('Error fetching Google Sheet demos:', error);
    } finally {
      setGoogleSheetDemosLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoogleSheetLeads();
    fetchGoogleSheetDemos();
  }, [fetchGoogleSheetLeads, fetchGoogleSheetDemos]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("crm_last_view_v2", currentView);
    }
  }, [currentView, mounted]);

  useEffect(() => {
    setMounted(true);
    requestPermission();
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // 2. Background Revalidation (Fetch from Supabase)
    fetchData();


    // Real-time Subscriptions with Broadcast Notifications
    const channels = [
      db.channel('public:issues')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload: any) => {
          if (!user) return;
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const actor = newRecord?.created_by || newRecord?.modified_by;

          if (!actor || actor === "System" || actor === user.name) return;

          fetchDataDebounced();

          if (eventType === 'INSERT') {
            const customerName = customersRef.current.find(c => c.id === newRecord.customer_id)?.name || "ไม่ทราบชื่อลูกค้า";
            pushNotification(
              "📝 มีการแจ้งปัญหาใหม่",
              `เคส: ${newRecord.title} (${customerName}) โดย ${actor || 'System'}`,
              "info"
            );
          } else if (eventType === 'UPDATE' && newRecord.status !== oldRecord.status) {
            const customerName = customersRef.current.find(c => c.id === newRecord.customer_id)?.name || "ไม่ทราบชื่อลูกค้า";
            pushNotification(
              "🔄 อัปเดตสถานะเคส",
              `เคส [${newRecord.case_number}] ของ ${customerName} เปลี่ยนเป็น ${newRecord.status}`,
              newRecord.status === "เสร็จสิ้น" ? "success" : "info"
            );
          }
        })
        .subscribe(),
      db.channel('public:customers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload: any) => {
          if (!user) return;
          const actor = payload.new?.created_by || payload.new?.modified_by;
          if (!actor || actor === "System" || actor === user.name) return;

          fetchDataDebounced();
          if (payload.eventType === 'INSERT') {
            pushNotification(
              "👥 มีลูกค้าใหม่",
              `เพิ่มลูกค้า: ${payload.new.name} โดย ${actor || 'System'}`,
              "info"
            );
          }
        })
        .subscribe(),
      db.channel('public:installations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'installations' }, (payload: any) => {
          if (!user) return;
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const actor = newRecord?.created_by || newRecord?.modified_by;

          if (actor !== user.name) {
            fetchDataDebounced();
          }

          if (eventType === 'INSERT') {
            const customerName = customersRef.current.find(c => c.id === newRecord.customer_id)?.name || "ไม่ทราบชื่อลูกค้า";
            pushNotification(
              newRecord.installation_type === "new" ? "🚀 แจ้งติดตั้งลูกค้าใหม่" : "📍 แจ้งติดตั้งสาขาเพิ่ม",
              newRecord.installation_type === "new"
                ? `มีการแจ้งติดตั้งใหม่สำหรับ: ${customerName}`
                : `มีการแจ้งติดตั้งสาขาใหม่สำหรับ: ${customerName}`,
              "info"
            );
          } else if (eventType === 'UPDATE' && newRecord.status !== oldRecord.status) {
            const customerName = customersRef.current.find(c => c.id === newRecord.customer_id)?.name || "ไม่ทราบชื่อลูกค้า";
            pushNotification(
              "🛠️ อัปเดตงานติดตั้ง",
              `งานของ ${customerName} เปลี่ยนเป็น ${newRecord.status}`,
              newRecord.status === "Completed" ? "success" : "info"
            );
          }
        })
        .subscribe(),
      /*
      db.channel('public:activities')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload: any) => {
          fetchDataDebounced();

          if (!user) return;
          const { eventType, new: newRecord } = payload;
          const actor = newRecord?.created_by || newRecord?.modified_by;
          if (actor === user.name) return;

          if (eventType === 'INSERT') {
            pushNotification(
              "📅 กิจกรรม CS ใหม่",
              `${newRecord.customer_name}: ${newRecord.activity_type} โดย ${actor || 'System'}`,
              "info"
            );
          }
        })
        .subscribe()
      */
    ];

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      channels.forEach(channel => db.removeChannel(channel));
    };
  }, [user?.name]);

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
        setShowLoginTransition(true);
        const userToLogin = result.data;

        setUser(userToLogin);
        localStorage.setItem("crm_user_v2", JSON.stringify(result.data));

        setView("dashboard"); // Always open dashboard after login
        setToast({ message: "เข้าสู่ระบบสำเร็จ", type: "success" });
      } else {
        setToast({ message: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", type: "error" });
      }
    } catch (err) {
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now(),
      name: formData.get("name") as string,
      subdomain: formData.get("subdomain") as string,
      productType: formData.get("product") as any,
      package: formData.get("package") as string,
      usageStatus: modalUsageStatus,
      installationStatus: editingCustomer ? editingCustomer.installationStatus : "Pending",
      clientCode: editingCustomer ? editingCustomer.clientCode : undefined,
      branches: branchInputs,
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    // Optimistic UI Update
    const previousCustomers = [...customers];
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === data.id ? data : c));
    } else {
      setCustomers([data, ...customers]);
    }

    // Immediate Cache Sync
    localStorage.setItem("crm_customers_v2", JSON.stringify(editingCustomer
      ? customers.map(c => c.id === data.id ? data : c)
      : [data, ...customers]));

    setModalOpen(false);
    setEditingCustomer(null);
    setIsEditingName(false);
    setToast({ message: "บันทึกข้อมูลลูกค้าสำเร็จ", type: "success" });

    try {
      const result = await saveCustomer(data);
      if (!result.success) {
        // Rollback on error
        setCustomers(previousCustomers);
        setToast({ message: "เกิดข้อผิดพลาดในการบันทึก: " + result.error, type: "error" });
      }
      // Note: Real-time subscription will update state with official DB ID if it was a new record
    } catch (err) {
      console.error("Failed to save customer:", err);
      setCustomers(previousCustomers);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      const result = await deleteCustomer(id);
      if (result.success) {
        const updated = customers.filter(c => c.id !== id);
        setCustomers(updated);
        setToast({ message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err) {
      console.error("Failed to delete customer:", err);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleSaveLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      leadNumber: formData.get("leadNumber"),
      customerName: formData.get("customerName"),
      product: formData.get("product"),
      source: formData.get("source"),
      leadType: formData.get("leadType"),
      salesName: formData.get("salesName"),
      phone: formData.get("phone"),
      receivedDate: formData.get("receivedDate"),
      notes: formData.get("notes"),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    if (editingLead) {
      data.id = editingLead.id;
    } else {
      data.createdBy = user?.name;
      data.createdAt = new Date().toISOString();
    }

    // Optimistic UI
    const optimisticLead = { ...data, id: data.id || Date.now() };
    const previousLeads = [...leads];
    setLeads(prev => {
      const updated = editingLead ? prev.map(l => l.id === editingLead.id ? optimisticLead : l) : [optimisticLead, ...prev];
      localStorage.setItem("crm_leads_v2", JSON.stringify(updated));
      return updated;
    });

    setLeadModalOpen(false);
    setEditingLead(null);
    setToast({ message: "บันทึกข้อมูลลีดสำเร็จ", type: "success" });

    const res = await saveLead(data);
    if (res.success && res.data) {
      // Sync official ID back to state
      setLeads(prev => prev.map(l => l.leadNumber === data.leadNumber ? { ...res.data, id: res.data.id } : l));
    } else if (!res.success) {
      setLeads(previousLeads);
      setToast({ message: "ผิดพลาด: " + res.error, type: "error" });
      fetchDataDebounced();
    }
  };

  const handleImportLeads = async (data: any[]) => {
    try {
      setToast({ message: "กำลังนำเข้าข้อมูลลีด...", type: "info" });
      const result = await importLeads(data);
      if (result.success) {
        setToast({ message: `นำเข้าข้อมูลลีดสำเร็จ ${result.data.count} รายการ`, type: "success" });
        fetchData();
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล", type: "error" });
    }
  };

  const handleDeleteLead = async (id: number) => {
    const previousLeads = [...leads];
    const updatedLeads = leads.filter(l => l.id !== id);
    setLeads(updatedLeads);
    localStorage.setItem("crm_leads_v2", JSON.stringify(updatedLeads));
    setToast({ message: "ลบข้อมูลลีดเรียบร้อยแล้ว", type: "success" });

    const res = await deleteLead(id);
    if (!res.success) {
      setLeads(previousLeads);
      setToast({ message: "ผิดพลาด: " + res.error, type: "error" });
      fetchDataDebounced();
    }
  };

  const handleImportCSV = async (data: any[]) => {
    try {
      setToast({ message: "กำลังนำเข้าข้อมูล...", type: "info" });
      const result = await importCustomersFromCSV(data);
      if (result.success) {
        setToast({ message: `นำเข้าข้อมูลสำเร็จ ${result.data.count} รายการ`, type: "success" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล", type: "error" });
    }
  };

  const handleSaveIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: Issue = {
      id: editingIssue ? editingIssue.id : Date.now(),
      caseNumber: editingIssue ? editingIssue.caseNumber : `CASE-${Date.now().toString().slice(-6)}`,
      title: formData.get("title") as string,
      customerId: (selectedCustomerId && selectedCustomerId > 0) ? selectedCustomerId : null as any,
      customerName: selectedCustomerName,
      branchName: selectedBranchName,
      severity: formData.get("severity") as any,
      status: modalIssueStatus,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      attachments: selectedFiles,
      createdBy: editingIssue ? editingIssue.createdBy : user?.name,
      createdAt: editingIssue ? editingIssue.createdAt : new Date().toISOString(),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    // Optimistic UI Update
    const previousIssues = [...issues];
    if (editingIssue) {
      setIssues(issues.map(i => i.id === data.id ? data : i));
    } else {
      setIssues([data, ...issues]);
    }

    localStorage.setItem("crm_issues_v2", JSON.stringify(editingIssue
      ? issues.map(i => i.id === data.id ? data : i)
      : [data, ...issues]));

    setIssueModalOpen(false);
    setEditingIssue(null);

    // Trigger Notification & Confetti optimistically for instant feedback
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

    if (modalIssueStatus === "เสร็จสิ้น") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setToast({ message: "🎉 ยินดี! แก้ไขเคสเสร็จสิ้นแล้ว", type: "success" });
    } else {
      setToast({ message: "บันทึกข้อมูลเคสเรียบร้อยแล้ว", type: "success" });
    }

    try {
      // Remove id for new issues to let database handle auto-increment
      const { id, ...rest } = data;
      const result = await saveIssue(editingIssue ? data : rest);
      if (result.success && result.data) {
        // Sync server result (especially ID) back to state
        setIssues(prev => prev.map(iss => iss.id === data.id ? { ...iss, ...result.data, id: result.data.id } : iss));
      } else if (!result.success) {
        // Rollback on error
        setIssues(previousIssues);
        setToast({ message: "เกิดข้อผิดพลาดในการบันทึกเคส: " + result.error, type: "error" });
      }
    } catch (err) {
      console.error("Failed to save issue:", err);
      setIssues(previousIssues);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleDeleteIssue = async (id: number) => {
    try {
      const result = await deleteIssue(id);
      if (result.success) {
        const updated = issues.filter(i => i.id !== id);
        setIssues(updated);
        setToast({ message: "ลบเคสเรียบร้อยแล้ว", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + result.error, type: "error" });
      }
    } catch (err) {
      console.error("Failed to delete issue:", err);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
  };

  const handleAddInstallation = async (newInst: any) => {
    const previousInstallations = [...installations];
    const previousCustomers = [...customers];

    try {
      let finalCustomerId = newInst.customerId || 0;
      const nextCustId = Date.now();

      if (newInst.installationType === "new") {
        finalCustomerId = nextCustId;
      }

      let data: Installation = {
        id: undefined as any,
        customerId: finalCustomerId && finalCustomerId > 0 ? finalCustomerId : null as any,
        customerName: newInst.installationType === "new" ? newInst.newCustomerName : (newInst.customerName || ""),
        customerLink: newInst.installationType === "new" ? newInst.newCustomerLink : undefined,
        branchName: newInst.installationType === "branch" ? newInst.branchName : undefined,
        status: "Pending",
        requestedBy: user?.name || "System",
        requestedAt: new Date().toISOString(),
        notes: newInst.notes,
        installationType: newInst.installationType
      };

      // Optimistic UI Update (Immediate)
      setInstallations([data, ...installations]);
      setToast({ message: newInst.installationType === "new" ? "กำลังสร้างข้อมูลและเปิดงานติดตั้ง..." : "กำลังแจ้งงานติดตั้ง...", type: "info" });

      // If it's a new customer, create the customer record first
      if (newInst.installationType === "new") {
        const newCustomer: Customer = {
          id: nextCustId,
          clientCode: `DE${nextCustId.toString().slice(-4).padStart(4, "0")}`,
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

        const custResult = await saveCustomer(newCustomer);
        if (!custResult.success) throw new Error(custResult.error);

        // Update with actual database-generated ID to prevent FK violation
        finalCustomerId = custResult.data.id;

        // Immediate Customer State Update (Instant visibility in manage customers)
        const savedCustomer: Customer = {
          ...newCustomer,
          id: finalCustomerId,
          branches: typeof custResult.data.branches === 'string'
            ? JSON.parse(custResult.data.branches)
            : (custResult.data.branches || [])
        };
        setCustomers(prev => [savedCustomer, ...prev]);

        data = { ...data, customerId: finalCustomerId };

      } else if (newInst.installationType === "branch" && newInst.branchName) {
        // If it's a new branch for an existing customer, update the customer
        const targetCust = customers.find(c => c.id === finalCustomerId);
        if (targetCust) {
          const branches = targetCust.branches || [];
          if (!branches.some(b => b.name === newInst.branchName)) {
            const updatedCust = {
              ...targetCust,
              branches: [...branches, { name: newInst.branchName, isMain: false, status: "Pending" as const }]
            };
            const custResult = await saveCustomer(updatedCust);
            if (!custResult.success) throw new Error(custResult.error);
          }
        }
      }

      const result = await saveInstallation(data);
      if (!result.success) {
        setInstallations(previousInstallations);
        setCustomers(previousCustomers);
        setToast({ message: "เกิดข้อผิดพลาด: " + (result as any).error, type: "error" });
      } else if (result.data) {
        // Replace optimism with reality (Sync ID)
        setInstallations(prev => {
          const syncData = {
            ...data,
            id: result.data.id,
            customerId: finalCustomerId // Ensure it's the latest ID
          };
          return prev.map(inst => inst === data ? syncData : inst);
        });
      }
    } catch (err: any) {
      console.error("Failed to add installation:", err);
      // Robust Rollback
      setInstallations(previousInstallations);
      setCustomers(previousCustomers);
      setToast({ message: "เกิดข้อผิดพลาด: " + err.message, type: "error" });
    }
  };

  const handleUpdateInstallationStatus = async (id: number, status: Installation["status"]) => {
    try {
      if (!id || id >= 1000000000000) {
        setToast({ message: "กรุณารอสักครู่ กำลังเตรียมความพร้อมข้อมูล...", type: "info" });
        return;
      }

      const result = await updateInstallationStatus(id, status, user?.name);
      if (result.success && result.data) {
        const inst = result.data;

        // If installation completed, also update customer/branch status
        if (status === "Completed" || status === "Installing") {
          const targetCust = customers.find(c => c.id === inst.customerId);
          if (targetCust) {
            const updatedBranches = (targetCust.branches || []).map(b => {
              if (inst.installationType === "branch" && b.name === inst.branchName) {
                return { ...b, status: status as any };
              }
              if (inst.installationType === "new" && b.isMain) {
                return { ...b, status: status as any };
              }
              return b;
            });
            const updatedCust = {
              ...targetCust,
              installationStatus: status as any,
              branches: updatedBranches
            };
            await saveCustomer(updatedCust);
          }
        }

        // State will be synchronized via real-time subscription
        setToast({ message: "อัปเดตสถานะงานติดตั้งเรียบร้อยแล้ว", type: "success" });
      } else {
        setToast({ message: "เกิดข้อผิดพลาด: " + (result as any).error, type: "error" });
      }
    } catch (err: any) {
      console.error("Failed to update installation status:", err);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    }
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

  const handleSaveActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSavingActivity) return;

    const formData = new FormData(e.currentTarget);
    const data: CSActivity = {
      id: editingActivity ? editingActivity.id : Date.now(),
      customerId: selectedCustomerId || 0,
      customerName: selectedCustomerName,
      title: formData.get("title") as string,
      activityType: activityType,
      status: activityStatus,
      sentiment: activitySentiment,
      content: formData.get("content") as string,
      assignee: activityAssignee,
      followUpDate: activityFollowUp || undefined,
      createdBy: editingActivity ? editingActivity.createdBy : user?.name,
      createdAt: editingActivity ? editingActivity.createdAt : new Date().toISOString(),
      modifiedBy: user?.name,
      modifiedAt: new Date().toISOString()
    };

    const prevActivities = [...activities];
    const updatedActivities = editingActivity
      ? activities.map(a => a.id === data.id ? data : a)
      : [data, ...activities];

    setActivities(updatedActivities);
    localStorage.setItem("crm_activities_v2", JSON.stringify(updatedActivities));
    setIsSavingActivity(true);
    setActivityModalOpen(false);
    setEditingActivity(null);
    setToast({ message: "บันทึกข้อมูลกิจกรรมเรียบร้อยแล้ว", type: "success" });

    try {
      const result = await saveActivity(data);
      if (result.success && result.data) {
        // Sync ID from server
        setActivities(prev => prev.map(a => a.id === data.id ? (result.data as CSActivity) : a));
      } else if (!result.success) {
        setActivities(prevActivities);
        setToast({ message: "เกิดข้อผิดพลาดในการบันทึกกิจกรรม: " + result.error, type: "error" });
      }
    } catch (err) {
      console.error("Failed to save activity:", err);
      setActivities(prevActivities);
      setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = (id: number) => {
    setDeleteConfirm({
      type: 'activity',
      id,
      title: 'คุณต้องการลบบันทึกกิจกรรมนี้ใช่หรือไม่?'
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30">
      {showLoginTransition && (
        <LoginTransition
          onComplete={() => setShowLoginTransition(false)}
        />
      )}

      {!user ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
          <div className="glass-card w-full max-w-md p-8 border-indigo-500/20">
            <div className="flex flex-col items-center mb-8">
              <div className="mb-8 relative group animate-bounce">
                {/* Animated Glow Effect */}
                <div className="absolute inset-[-20px] bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-indigo-500/40 blur-2xl rounded-full animate-pulse" />
                <div className="absolute inset-[-10px] bg-indigo-400/30 blur-xl rounded-full animate-[pulse_2s_ease-in-out_infinite]" />

                {/* Logo Container */}
                <div className="relative z-10 w-28 h-28 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <img
                    src="/images/LOGO ATIZ-02.png"
                    alt="ATIZ Logo"
                    className="w-full h-full object-contain rounded-[32px] drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                  />
                </div>
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
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            currentView={currentView}
            setView={setView}
            onLogout={() => { setUser(null); localStorage.removeItem("crm_user_v2"); }}
            userRole={{ ...roles.find(r => r.id === user?.role), role: user?.role }}
          />
          <main className={`flex-1 relative bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] animate-in fade-in duration-300 ${currentView === 'dashboard' ? 'overflow-hidden' : 'overflow-auto'}`}>
            <div className={`p-4 lg:p-8 max-w-[1600px] mx-auto relative z-10 ${currentView === 'dashboard' ? 'h-full flex flex-col' : ''}`}>
              <div className="absolute top-4 lg:top-8 right-4 lg:right-8 z-[100] flex items-center gap-3">
                {notificationPermission !== "granted" && (
                  <button
                    onClick={async () => {
                      const granted = await requestPermission();
                      if (granted) setNotificationPermission("granted");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] font-bold transition-all animate-pulse"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    ENABLE NOTIFICATIONS
                  </button>
                )}
                <NotificationBell />
              </div>
              {currentView === "dashboard" ? (
                <Dashboard
                  customers={customers}
                  installations={installations}
                  issues={issues}
                  activities={activities}
                  leads={leads}
                  googleSheetLeads={googleSheetLeads}
                  googleSheetDemos={googleSheetDemos}
                  businessMetrics={businessMetrics}
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
                      : [{ name: "สำนักงานใหญ่", isMain: true, address: "", status: "Pending" } as const];
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
                <IssueManager issues={issues} customers={customers} onAdd={() => { setEditingIssue(null); setSelectedCustomerId(null); setSelectedCustomerName(""); setSelectedBranchName(""); setSelectedFiles([]); setModalMode('create'); setModalIssueStatus("แจ้งเคส"); setIssueModalOpen(true); }} onEdit={(issue) => { setEditingIssue(issue); setSelectedCustomerId(issue.customerId); setSelectedCustomerName(issue.customerName); setSelectedBranchName(issue.branchName || ""); setSelectedFiles(typeof issue.attachments === 'string' ? JSON.parse(issue.attachments || "[]") : (issue.attachments || [])); setModalMode('edit'); setModalIssueStatus(issue.status); setIssueModalOpen(true); }} onDelete={(id) => { const issue = issues.find(i => i.id === id); setDeleteConfirm({ type: 'issue', id, title: issue?.title || 'Issue' }); }} />
              ) : currentView === "cs_activity" ? (
                <ActivityManager
                  activities={activities}
                  customers={customers}
                  onAdd={() => {
                    setEditingActivity(null);
                    setSelectedCustomerId(null);
                    setSelectedCustomerName("");
                    setActivitySentiment("Neutral");
                    setActivityType("Other");
                    setActivityStatus("Open");
                    setActivityAssignee(user?.name || "");
                    setActivityFollowUp("");
                    setActivityModalOpen(true);
                  }}
                  onEdit={(act) => {
                    setEditingActivity(act);
                    setSelectedCustomerId(act.customerId);
                    setSelectedCustomerName(act.customerName);
                    setActivitySentiment(act.sentiment);
                    setActivityType(act.activityType);
                    setActivityStatus(act.status || "Open");
                    setActivityAssignee(act.assignee || "");
                    setActivityFollowUp(act.followUpDate || "");
                    setActivityModalOpen(true);
                  }}
                  onDelete={handleDeleteActivity}
                />
              ) : currentView === "installations" ? (
                <InstallationManager installations={installations} customers={customers} onAddInstallation={handleAddInstallation} onUpdateStatus={handleUpdateInstallationStatus} />
              ) : currentView === "leads" ? (
                <GoogleSheetLeadManager
                  leads={googleSheetLeads}
                  isLoading={isGoogleSheetLeadsLoading}
                  onRefresh={fetchGoogleSheetLeads}
                />
              ) : currentView === "demos" ? (
                <DemoManager
                  demos={googleSheetDemos}
                  isLoading={isGoogleSheetDemosLoading}
                  onRefresh={fetchGoogleSheetDemos}
                />
              ) : null}
            </div>
          </main>

          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

          {/* Simplified Customer Modal for types fix - in a real app would have full fields */}
          <ModalWrapper isOpen={isModalOpen} onClose={() => { setModalOpen(false); setIsEditingName(false); }} maxWidth="max-w-4xl">
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
                            <input type="hidden" name="name" value={editingCustomer?.name || ""} />
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
                          name="usageStatus"
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
          </ModalWrapper>

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
                      <textarea name="description" defaultValue={editingIssue?.description} className="input-field min-h-[100px] text-xs py-3 resize-none" />
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
                                <img
                                  src={file.data}
                                  alt={file.name}
                                  className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                                  onClick={() => setPreviewImage(file.data)}
                                />
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
                  <button onClick={async () => {
                    if (deleteConfirm.type === 'customer' && deleteConfirm.id) handleDeleteCustomer(deleteConfirm.id);
                    if (deleteConfirm.type === 'issue' && deleteConfirm.id) handleDeleteIssue(deleteConfirm.id);
                    if (deleteConfirm.type === 'branch' && deleteConfirm.index !== undefined) {
                      const filtered = branchInputs.filter((_, i) => i !== deleteConfirm.index);
                      setBranchInputs(filtered);
                      setActiveBranchIndex(Math.max(0, (deleteConfirm.index || 0) - 1));
                    }
                    if (deleteConfirm.type === 'activity' && deleteConfirm.id) {
                      if (isDeleting) return;
                      const prevActivities = [...activities];
                      const updatedActivities = activities.filter(a => a.id !== deleteConfirm.id);
                      setActivities(updatedActivities);
                      localStorage.setItem("crm_activities_v2", JSON.stringify(updatedActivities));
                      setToast({ message: "กำลังลบกิจกรรม...", type: "info" });
                      setIsDeleting(true);
                      const res = await deleteActivity(deleteConfirm.id);
                      setIsDeleting(false);
                      if (!res.success) {
                        setActivities(prevActivities);
                        setToast({ message: "เกิดข้อผิดพลาด: " + res.error, type: "error" });
                        fetchDataDebounced();
                      } else {
                        setToast({ message: "ลบกิจกรรมเรียบร้อยแล้ว", type: "success" });
                      }
                    }
                    if (!isDeleting) setDeleteConfirm(null);
                  }} disabled={isDeleting} className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 disabled:opacity-50">
                    {isDeleting ? "กำลังลบ..." : "ลบรายการ"}
                  </button>
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
          {/* Activity Modal */}
          {isActivityModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActivityModalOpen(false)} />
              <div className="glass-card w-full max-w-lg relative shadow-2xl border-indigo-500/20 flex flex-col h-[85vh] max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-white/5 shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                      <HistoryIcon className="w-5 h-5 text-indigo-400" />
                      {editingActivity ? "Edit Task" : "Add Task"}
                    </h2>
                    <button onClick={() => setActivityModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                      <X />
                    </button>
                  </div>
                </div>

                {/* Status Flow Bar */}
                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Status:</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActivityStatus("Open")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "Open"
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                          : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                          }`}
                      >
                        Open
                      </button>

                      <span className="text-slate-600">→</span>

                      <button
                        type="button"
                        onClick={() => setActivityStatus("In Progress")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "In Progress"
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                          : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                          }`}
                      >
                        In Progress
                      </button>

                      <span className="text-slate-600">→</span>

                      <button
                        type="button"
                        onClick={() => setActivityStatus("Success")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activityStatus === "Success"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          }`}
                      >
                        Success
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="task-form" onSubmit={handleSaveActivity} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ชื่อลูกค้า</label>
                      <SearchableCustomerSelect
                        customers={customers}
                        value={selectedCustomerId}
                        onChange={(id: number, name: string) => {
                          setSelectedCustomerId(id);
                          setSelectedCustomerName(name);
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Summary</label>
                      <input
                        name="title"
                        defaultValue={editingActivity?.title}
                        className="input-field text-xs py-2"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ประเภทงาน</label>
                      <CustomSelect
                        value={activityType}
                        onChange={(val) => setActivityType(val as ActivityType)}
                        options={[
                          { value: "Training", label: "Training" },
                          { value: "Onboarding", label: "Onboarding" },
                          { value: "Support", label: "Support" },
                          { value: "Call", label: "Call" },
                          { value: "Line", label: "Line" },
                          { value: "Visit", label: "Visit" },
                          { value: "Renewal", label: "Renewal" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">ผู้รับผิดชอบ (Assignee)</label>
                      <CustomSelect
                        value={activityAssignee}
                        onChange={(val) => setActivityAssignee(val)}
                        options={[
                          { value: "", label: "ไม่ระบุ" },
                          ...users.map(u => ({ value: u.name, label: u.name }))
                        ]}
                      />
                    </div>



                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Description</label>
                      <textarea
                        name="content"
                        defaultValue={editingActivity?.content}
                        className="input-field text-xs py-3 min-h-[100px] resize-none"
                      />
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                  <button type="button" onClick={() => setActivityModalOpen(false)} className="flex-1 btn btn-ghost py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5">Cancel</button>
                  <button form="task-form" type="submit" disabled={isSavingActivity} className="flex-1 btn btn-primary py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingActivity ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Task"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lead Modal */}
          {isLeadModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLeadModalOpen(false)} />
              <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{editingLead ? "แก้ไขข้อมูลลีด" : "เพิ่มลีดใหม่"}</h2>
                      <p className="text-xs text-slate-400">กรอกข้อมูลลีดให้ครบถ้วนเพื่อใช้ในการติดตาม</p>
                    </div>
                  </div>
                  <button onClick={() => setLeadModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
                  <form id="lead-form" onSubmit={handleSaveLead} className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เลขที่ลีด (Lead Number)</label>
                      <input
                        name="leadNumber"
                        defaultValue={editingLead?.leadNumber || `L${Date.now().toString().slice(-6)}`}
                        className="input-field text-sm font-bold text-indigo-400"
                        required
                        placeholder="L000000"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product</label>
                      <CustomSelect
                        name="product"
                        defaultValue={editingLead?.product || "Dr.Ease"}
                        options={[
                          { value: "Dr.Ease", label: "Dr.Ease" },
                          { value: "Ease POS", label: "Ease POS" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ชื่อลูกค้า / คลินิก / ร้าน</label>
                      <input
                        name="customerName"
                        defaultValue={editingLead?.customerName}
                        className="input-field text-sm font-semibold"
                        required
                        placeholder="ระบุชื่อลูกค้า"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</label>
                      <input
                        name="phone"
                        defaultValue={editingLead?.phone}
                        className="input-field text-sm font-mono"
                        required
                        placeholder="08X-XXXXXXX"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เซลล์ผู้ดูแล (Sales)</label>
                      <CustomSelect
                        name="salesName"
                        defaultValue={editingLead?.salesName || "Aoey"}
                        options={[
                          { value: "Aoey", label: "Aoey" },
                          { value: "Yo", label: "Yo" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ที่มาลีด (Lead Source)</label>
                      <CustomSelect
                        name="source"
                        defaultValue={editingLead?.source || "ยิงแอด"}
                        options={[
                          { value: "ยิงแอด", label: "ยิงแอด" },
                          { value: "เซลล์หา", label: "เซลล์หา" },
                          { value: "พาร์ทเนอร์", label: "พาร์ทเนอร์" },
                          { value: "บริษัทหา", label: "บริษัทหา" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันที่รับลีด (Received Date)</label>
                      <CustomDatePicker
                        value={modalLeadDate}
                        onChange={setModalLeadDate}
                        placeholder="เลือกวันที่รับลีด"
                        className="w-full"
                      />
                      <input type="hidden" name="receivedDate" value={modalLeadDate} />
                    </div>

                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ประเภทลีด (Lead Type)</label>
                      <CustomSelect
                        name="leadType"
                        defaultValue={editingLead?.leadType || "LINE"}
                        options={[
                          { value: "LINE", label: "LINE" },
                          { value: "Facebook", label: "Facebook" },
                          { value: "Call", label: "Call" },
                          { value: "ลีดจากสัมนา", label: "ลีดจากสัมนา" },
                          { value: "ลูกค้าเก่า ต่อสัญญา", label: "ลูกค้าเก่า ต่อสัญญา" },
                          { value: "ขบายสัญญาเพิ่ม", label: "ขบายสัญญาเพิ่ม" },
                          { value: "ลีดซ้ำ", label: "ลีดซ้ำ" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">หมายเหตุ (Notes)</label>
                      <textarea
                        name="notes"
                        defaultValue={editingLead?.notes}
                        className="input-field text-sm min-h-[100px] resize-none py-3"
                        placeholder="เพิ่มเติม..."
                      />
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                  <button type="button" onClick={() => setLeadModalOpen(false)} className="flex-1 btn btn-ghost py-3 rounded-xl font-bold">Cancel</button>
                  <button form="lead-form" type="submit" className="flex-1 btn btn-primary py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform">
                    {editingLead ? "Save Changes" : "Create Lead"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal for Activity & Leads */}
          {deleteConfirm?.type === 'activity' && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="glass-card w-full max-w-sm p-6 relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">ยืนยันการลบ</h3>
                    <p className="text-xs text-slate-400 leading-relaxed px-4">{deleteConfirm.title}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn btn-ghost py-2">ยกเลิก</button>
                    <button onClick={async () => {
                      console.log('Delete confirm clicked, id:', deleteConfirm.id, 'currentView:', currentView);
                      if (deleteConfirm.id) {
                        // Check if it's in leads view
                        if (currentView === 'leads') {
                          console.log('Calling handleDeleteLead with id:', deleteConfirm.id);
                          await handleDeleteLead(deleteConfirm.id);
                          setDeleteConfirm(null);
                        } else {
                          const prevActivities = [...activities];
                          const updated = activities.filter(a => a.id !== deleteConfirm.id);
                          setActivities(updated);
                          setDeleteConfirm(null);

                          try {
                            const result = await deleteActivity(deleteConfirm.id);
                            if (result.success) {
                              setToast({ message: "ลบกิจกรรมเรียบร้อยแล้ว", type: "success" });
                            } else {
                              setActivities(prevActivities);
                              setToast({ message: "เกิดข้อผิดพลาดในการลบ: " + result.error, type: "error" });
                            }
                          } catch (err) {
                            console.error("Failed to delete activity:", err);
                            setActivities(prevActivities);
                            setToast({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "error" });
                          }
                        }
                      }
                    }} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl transition-colors">ลบข้อมูล</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="absolute top-4 right-4 flex gap-2">
            <a
              href={previewImage}
              download={`image-${Date.now()}.png`}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              title="Download Image"
            >
              <Download className="w-6 h-6" />
            </a>
            <button
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
