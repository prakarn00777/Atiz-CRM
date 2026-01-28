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

export interface NewSalesRow {
    id: string;
    index: string;      // ลำดับ (Column A)
    month: string;      // เดือน (Column B)
    year: string;       // ปี (Column C)
    salesName: string;  // เซลล์ (Column D)
    amount: number;     // ยอด (Column E)
}

export async function getNewSales(): Promise<NewSalesRow[]> {
    const spreadsheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID?.trim();
    const sheetName = (process.env.GOOGLE_SALES_SHEET_NAME || 'Sheet6').trim();

    if (!spreadsheetId) {
        console.warn('GOOGLE_MASTER_SPREADSHEET_ID is missing, skipping fetch');
        return [];
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:E`, // Column A to E
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        // Skip header row
        const [, ...dataRows] = rows;

        return dataRows
            .filter(row => row.some(cell => cell)) // Filter empty rows
            .map((row, index) => ({
                id: `sales-${index + 2}`,
                index: String(row[0] || ''),
                month: String(row[1] || ''),
                year: String(row[2] || ''),
                salesName: String(row[3] || ''),
                amount: parseFloat(String(row[4] || '0').replace(/,/g, '')) || 0,
            }));
    } catch (error) {
        console.error('Error fetching new sales from Google Sheets:', error);
        return [];
    }
}
