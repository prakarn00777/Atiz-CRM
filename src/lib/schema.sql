-- Database Schema for CRM

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT -- JSON string array
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role_id TEXT REFERENCES roles(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  client_code TEXT,
  subdomain TEXT,
  product_type TEXT, -- Dr.Ease, EasePos
  package TEXT, -- Starter, Standard, Elite, Pro, Demo
  usage_status TEXT, -- Active, Trial, Inactive, Canceled
  business_type TEXT,
  contract_number TEXT,
  contract_start DATE,
  contract_end DATE,
  sales_name TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  note TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT,
  modified_at DATETIME
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_main BOOLEAN DEFAULT 0,
  address TEXT,
  status TEXT -- รอการติดตั้ง, กำลังติดตั้ง, ติดตั้งเสร็จ
);

CREATE TABLE IF NOT EXISTS installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  branch_name TEXT,
  status TEXT, -- Pending, Installing, Completed
  requested_by TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_dev TEXT,
  completed_at DATETIME,
  notes TEXT,
  installation_type TEXT, -- new, branch
  modified_by TEXT,
  modified_at DATETIME
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  branch_name TEXT,
  severity TEXT, -- ต่ำ, ปานกลาง, สูง, วิกฤต
  status TEXT, -- แจ้งเคส, กำลังดำเนินการ, เสร็จสิ้น
  type TEXT,
  description TEXT,
  attachments TEXT, -- JSON string array of metadata
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT,
  modified_at DATETIME
);
