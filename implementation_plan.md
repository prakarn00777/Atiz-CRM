# Status Separation Strategy - Implementation Plan

## Analysis: Usage Status vs. Operational Status
Separating these two types of statuses is highly recommended for clarity and operational efficiency. Currently, the `status` field in the `Customer` model is overloaded with both business and technical meanings.

### 1. Usage Status (Account Level)
This represents the **Business Relationship** with the customer. 
*   **Target Group**: Sales, Accounting, Management.
*   **Values**: `Active` (ใช้งาน), `Trial` (ทดลองใช้), `Inactive` (ปิดปรับปรุง), `Canceled` (ยกเลิก).

### 2. Operational Status (Setup/Technical Level)
This represents the **Installation & Support Progress**.
*   **Target Group**: Tech Team, Admin, Support.
*   **Values**: `Pending` (รอติดตั้ง), `In Progress` (กำลังติดตั้ง), `Installed` (ติดตั้งแล้ว).

---

## Proposed Changes

### [Data Model Update]

#### [MODIFY] [page.tsx](file:///c:/Users/admin/Documents/New%20folder/CRM%20Management/CRM/src/app/page.tsx)
-   **Customer Interface**:
    -   Rename `status` to `usageStatus`.
    -   Add `installationStatus`.
-   **Initial Data**: Map existing statuses to the new fields.
-   **Handers**: Update `handleSaveCustomer` and `handleUpdateInstallationStatus` to update the correct fields.

### [UI Components]

#### [MODIFY] [CustomerTable.tsx](file:///c:/Users/admin/Documents/New%20folder/CRM%20Management/CRM/src/components/CustomerTable.tsx)
-   Display **2 distinct badges** in the status column:
    -   Badge 1: Usage (e.g., Green for Active).
    -   Badge 2: Installation (e.g., Blue for Installed).
-   Update filters to allow filtering by both types.

#### [MODIFY] [InstallationManager.tsx](file:///c:/Users/admin/Documents/New%20folder/CRM%20Management/CRM/src/components/InstallationManager.tsx)
-   Focus exclusively on the `installationStatus`.
-   Provide a clearer link to the customer's `usageStatus` if needed for prioritization.

---

## Verification Plan
1.  Verify that a customer can be `Active` but `In Progress` (installing additional branches).
2.  Verify that a `Canceled` customer correctly shows as `Canceled` regardless of setup status.
3.  Ensure filters in `CustomerTable` correctly narrow down results based on both status types.
