import { google } from 'googleapis';

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

export interface RenewalRateRow {
    id: string;
    month: string;      // เดือน (Column B)
    year: string;       // ปี (Column C)
    product: string;    // ระบบ Dr.Ease / EasePos (Column D)
    renewed: number;    // ต่อสัญญา (Column E)
    notRenewed: number; // ไม่ต่อสัญญา (Column F)
    pending: number;    // รอคำตอบจากลูกค้า (Column G)
}

export async function getRenewalRate(): Promise<RenewalRateRow[]> {
    const spreadsheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID?.trim();
    const sheetName = (process.env.GOOGLE_RENEWAL_RATE_SHEET_NAME || 'Sheet8').trim();

    if (!spreadsheetId) {
        console.warn('GOOGLE_MASTER_SPREADSHEET_ID is missing, skipping fetch');
        return [];
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:G`,
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        // Skip header row
        const [, ...dataRows] = rows;

        return dataRows
            .filter(row => row[1] && row[3]) // Must have month (B) and product (D)
            .map((row, index) => ({
                id: `renewal-rate-${index + 2}`,
                month: String(row[1] || ''),
                year: String(row[2] || ''),
                product: String(row[3] || ''),
                renewed: parseFloat(String(row[4] || '0').replace(/,/g, '')) || 0,
                notRenewed: parseFloat(String(row[5] || '0').replace(/,/g, '')) || 0,
                pending: parseFloat(String(row[6] || '0').replace(/,/g, '')) || 0,
            }));
    } catch (error) {
        console.error('Error fetching renewal rate from Google Sheets:', error);
        return [];
    }
}
