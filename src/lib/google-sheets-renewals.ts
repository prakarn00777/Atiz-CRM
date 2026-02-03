import { google } from 'googleapis';

// Initialize Google Sheets API client
const getGoogleSheetsClient = async () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !key) {
        throw new Error('Google Sheets credentials not configured.');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key
                .trim()
                .replace(/^"(.*)"$/, '$1')
                .replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
};

export interface RenewalsRow {
    id: string;
    index: string;              // ลำดับ (Column A)
    month: string;              // เดือน (Column B)
    year: string;               // ปี (Column C)
    renewedAmount: number;      // ยอดต่อสัญญา (Column D)
    notRenewedAmount: number;   // ไม่ต่อสัญญา (Column E)
    pendingAmount: number;      // รอคำตอบจากลูกค้า (Column F)
}

export async function getRenewals(): Promise<RenewalsRow[]> {
    const spreadsheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID?.trim();
    const sheetName = (process.env.GOOGLE_RENEWALS_SHEET_NAME || 'Sheet7').trim();

    if (!spreadsheetId) {
        console.warn('GOOGLE_MASTER_SPREADSHEET_ID is missing, skipping fetch');
        return [];
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:F`, // Column A to F
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        // Skip header row
        const [, ...dataRows] = rows;

        return dataRows
            .filter(row => row.some(cell => cell)) // Filter empty rows
            .map((row, index) => ({
                id: `renewal-${index + 2}`,
                index: String(row[0] || ''),
                month: String(row[1] || ''),
                year: String(row[2] || ''),
                renewedAmount: parseFloat(String(row[3] || '0').replace(/,/g, '')) || 0,
                notRenewedAmount: parseFloat(String(row[4] || '0').replace(/,/g, '')) || 0,
                pendingAmount: parseFloat(String(row[5] || '0').replace(/,/g, '')) || 0,
            }));
    } catch (error) {
        console.error('Error fetching renewals from Google Sheets:', error);
        return [];
    }
}
