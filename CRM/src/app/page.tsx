"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import CustomerTable from "@/components/CustomerTable";
import { Layers, X } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  link: string;
  package: string;
  status: string;
}

export default function CRMPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentView, setView] = useState("dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Initial Data
  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("crm_user_v2");
    const savedCustomers = localStorage.getItem("crm_customers_v2");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      const initial = [
        { id: 1, name: "คลินิกความงาม ออร่า", link: "https://aura.example.com", package: "Elite", status: "ใช้งาน" },
        { id: 2, name: "สไมล์ เดนทัล", link: "https://smile.example.com", package: "Standard", status: "รอการใช้งาน" },
        { id: 3, name: "เพ็ท แอนด์ มี", link: "https://petme.example.com", package: "Starter", status: "ยกเลิก" }
      ];
      setCustomers(initial);
      localStorage.setItem("crm_customers_v2", JSON.stringify(initial));
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

  const handleDelete = (id: number) => {
    if (confirm("ยืนยันการลบลูกค้านี้?")) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem("crm_customers_v2", JSON.stringify(updated));
    }
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Customer = {
      id: editingCustomer ? editingCustomer.id : Date.now(),
      name: formData.get("name") as string,
      link: formData.get("link") as string,
      package: formData.get("package") as string,
      status: formData.get("status") as string,
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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar
        currentView={currentView}
        setView={setView}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 lg:p-8">
        {currentView === "dashboard" ? (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "ลูกค้าทั้งหมด", value: customers.length, color: "text-white" },
                { label: "ใช้งานอยู่", value: customers.filter(c => c.status === "ใช้งาน").length, color: "text-emerald-400" },
                { label: "แพ็คเกจ Elite", value: customers.filter(c => c.package === "Elite").length, color: "text-indigo-400" },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 border-white/5">
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card overflow-hidden border-white/5">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-lg">ลูกค้าล่าสุด</h3>
                <button onClick={() => setView("customers")} className="text-sm text-indigo-400 hover:underline">ดูทั้งหมด</button>
              </div>
              <TableSummary customers={customers.slice(0, 5)} />
            </div>
          </div>
        ) : (
          <CustomerTable
            customers={customers}
            onAdd={() => { setEditingCustomer(null); setModalOpen(true); }}
            onEdit={(c) => { setEditingCustomer(c); setModalOpen(true); }}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="glass-card w-full max-w-lg p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6">{editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}</h2>
            <form onSubmit={handleSaveCustomer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">ชื่อคลินิก/ร้าน</label>
                <input name="name" defaultValue={editingCustomer?.name} className="input-field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">ลิงก์เข้าสู่ระบบ</label>
                <input name="link" type="url" defaultValue={editingCustomer?.link} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">แพ็คเกจ</label>
                  <select name="package" defaultValue={editingCustomer?.package || "Standard"} className="input-field bg-slate-900">
                    <option value="Starter">Starter</option>
                    <option value="Standard">Standard</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">สถานะ</label>
                  <select name="status" defaultValue={editingCustomer?.status || "ใช้งาน"} className="input-field bg-slate-900">
                    <option value="ใช้งาน">ใช้งาน</option>
                    <option value="รอการใช้งาน">รอการใช้งาน</option>
                    <option value="ยกเลิก">ยกเลิก</option>
                  </select>
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

function TableSummary({ customers }: { customers: Customer[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
          <th className="px-6 py-3 font-semibold">ชื่อร้าน/คลินิก</th>
          <th className="px-6 py-3 font-semibold">แพ็คเกจ</th>
          <th className="px-6 py-3 font-semibold">สถานะ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {customers.map((c) => (
          <tr key={c.id}>
            <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
            <td className="px-6 py-4 text-sm text-slate-400">{c.package}</td>
            <td className="px-6 py-4">
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
