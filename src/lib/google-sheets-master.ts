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

export interface MasterDemoRow {
    id: string;
    leadNumber: string;
    date: string;
    product: string;
    source: string;
    leadType: string;
    salesName: string;
    customerName: string;
    phone: string;
    demoStatus: string;
    clinicName: string;
    notes: string;
}

export async function getMasterDemos(): Promise<MasterDemoRow[]> {
    const spreadsheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID?.trim();
    const sheetName = (process.env.GOOGLE_MASTER_SHEET_NAME || 'MasterDemos').trim();

    if (!spreadsheetId) {
        console.warn('GOOGLE_MASTER_SPREADSHEET_ID is missing correctly skipping fetch');
        return [];
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:I`, // Simplified to A:I (9 columns)
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        // Skip header row
        const [, ...dataRows] = rows;

        return dataRows
            .map((row, index) => ({
                id: `master-${index + 2}`,
                leadNumber: String(row[1] || ''),    // Col B
                date: String(row[2] || ''),          // Col C
                product: String(row[3] || ''),       // Col D
                source: '',                          // Simplified out
                leadType: '',                        // Simplified out
                salesName: String(row[4] || ''),     // Col E
                salesperson: String(row[4] || ''),   // Col E (same as salesName for graph)
                customerName: String(row[5] || ''),  // Col F
                phone: String(row[6] || ''),         // Col G (NEW: Phone Number)
                demoStatus: String(row[7] || ''),    // Col H (Merged Demo Status)
                clinicName: String(row[8] || ''),    // Col I (Clinic Name)
                notes: '',                           // Simplified out
            }));
    } catch (error) {
        console.error('Error fetching master demos:', error);
        return [];
    }
}
