"use server";

import { db } from "@/lib/db";
import { Customer, UsageStatus, ProductType } from "@/types";

export async function importCustomersFromCSV(data: any[]) {
    const customers: any[] = data.map((row) => {
        // Basic mapping based on column names from the CSV
        const name = row['ชื่อคลินิก/ร้าน (ไทย)'] || row['ชื่อคลินิก/ร้าน (English)'] || row['ชื่อคลินิก/ร้าน "สำหรับใช้ค้นหาตอนแจ้งเคส"'];

        // Map status
        let usageStatus: UsageStatus = "Active";
        if (row['สถานะ'] === "ยกเลิก") usageStatus = "Canceled";
        else if (row['สถานะ'] === "รอการใช้งาน") usageStatus = "Inactive";

        // Map product
        let productType: ProductType = "Dr.Ease";
        if (row['สินค้า'] === "EasePos") productType = "EasePos";

        return {
            name,
            client_code: row['Client Code'],
            subdomain: row['Sub-domain'],
            product_type: productType,
            package: row['Package'],
            usage_status: usageStatus,
            business_type: row['ประเภทธุรกิจ'],
            contract_number: row['เลขที่สัญญา'],
            contract_start: row['วันเริ่มสัญญา'],
            contract_end: row['วันหมดสัญญา'],
            sales_name: row['เซลล์'],
            contact_name: row['ชื่อผู้ทำสัญญา'],
            contact_phone: row['เบอร์โทร'],
            note: row['โน็ต'],
            installation_status: usageStatus === "Active" ? "Installed" : "Pending"
        };
    });

    // Simple batch insert logic for demonstration
    // In a real Turso setup, you might use a transaction or multiple stmt.execute()
    for (const c of customers) {
        if (!c.name) continue;

        await db.execute({
            sql: `INSERT INTO customers (
        name, client_code, subdomain, product_type, package, 
        usage_status, business_type, contract_number, 
        contract_start, contract_end, sales_name, 
        contact_name, contact_phone, note, installation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                c.name, c.client_code, c.subdomain, c.product_type, c.package,
                c.usage_status, c.business_type, c.contract_number,
                c.contract_start, c.contract_end, c.sales_name,
                c.contact_name, c.contact_phone, c.note, c.installation_status
            ]
        });
    }

    return { success: true, count: customers.length };
}
export async function getCustomers(): Promise<Customer[]> {
    const res = await db.execute("SELECT * FROM customers ORDER BY id DESC");
    return res.rows.map(row => ({
        id: Number(row.id),
        name: String(row.name),
        client_code: row.client_code ? String(row.client_code) : undefined,
        subdomain: row.subdomain ? String(row.subdomain) : undefined,
        productType: (row.product_type as ProductType) || "Dr.Ease",
        package: String(row.package),
        usageStatus: (row.usage_status as UsageStatus) || "Active",
        businessType: row.business_type ? String(row.business_type) : undefined,
        contractNumber: row.contract_number ? String(row.contract_number) : undefined,
        contractStart: row.contract_start ? String(row.contract_start) : undefined,
        contractEnd: row.contract_end ? String(row.contract_end) : undefined,
        salesName: row.sales_name ? String(row.sales_name) : undefined,
        contactName: row.contact_name ? String(row.contact_name) : undefined,
        contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
        note: row.note ? String(row.note) : undefined,
        installationStatus: row.installation_status ? String(row.installation_status) : undefined,
    })) as Customer[];
}

export async function getIssues(): Promise<any[]> {
    const res = await db.execute("SELECT * FROM issues ORDER BY id DESC");
    return res.rows.map(row => ({
        id: Number(row.id),
        customerId: Number(row.customer_id),
        customerName: String(row.customer_name), // From schema.sql, issues has customer_name
        branchName: row.branch_name ? String(row.branch_name) : undefined,
        caseNumber: String(row.case_number),
        title: String(row.title),
        description: row.description ? String(row.description) : undefined,
        type: String(row.type),
        severity: String(row.severity),
        status: String(row.status),
        reportedBy: String(row.reported_by),
        reportedAt: String(row.reported_at),
        modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
        modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
        attachments: row.attachments ? String(row.attachments) : "[]",
    }));
}

export async function getInstallations(): Promise<any[]> {
    const res = await db.execute("SELECT * FROM installations ORDER BY id DESC");
    return res.rows.map(row => ({
        id: Number(row.id),
        customerId: Number(row.customer_id),
        customerName: String(row.customer_name),
        branchName: row.branch_name ? String(row.branch_name) : undefined,
        status: String(row.status),
        requestedBy: String(row.requested_by),
        requestedAt: String(row.requested_at),
        assignedDev: row.assigned_dev ? String(row.assigned_dev) : undefined,
        completedAt: row.completed_at ? String(row.completed_at) : undefined,
        notes: row.notes ? String(row.notes) : undefined,
        installationType: String(row.installation_type),
        modifiedBy: row.modified_by ? String(row.modified_by) : undefined,
        modifiedAt: row.modified_at ? String(row.modified_at) : undefined,
    }));
}
