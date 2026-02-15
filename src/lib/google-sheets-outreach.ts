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

export interface OutreachRow {
    id: string;
    index: string;          // ลำดับ (Column A)
    date: string;           // วันที่ (Column B)
    month: string;          // เดือน (Column C)
    contactedDr: number;    // ทัก Dr.Ease (Column D)
    qualifiedDr: number;    // ลืด Dr.Ease (Column E)
    contactedEase: number;  // ทัก EasePOS (Column F)
    qualifiedEase: number;  // ลืด EasePOS (Column G)
}

export async function getOutreach(): Promise<OutreachRow[]> {
    const spreadsheetId = process.env.GOOGLE_MASTER_SPREADSHEET_ID?.trim();
    const sheetName = (process.env.GOOGLE_OUTREACH_SHEET_NAME || 'Sheet9').trim();

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
            .filter(row => row.some(cell => cell))
            .filter(row => {
                // Skip rows without numeric data in D-G columns
                const hasData = [row[3], row[4], row[5], row[6]].some(
                    cell => cell && !isNaN(parseFloat(String(cell)))
                );
                return hasData;
            })
            .map((row, index) => ({
                id: `outreach-${index + 2}`,
                index: String(row[0] || ''),
                date: String(row[1] || ''),
                month: String(row[2] || ''),
                contactedDr: parseFloat(String(row[3] || '0').replace(/,/g, '')) || 0,
                qualifiedDr: parseFloat(String(row[4] || '0').replace(/,/g, '')) || 0,
                contactedEase: parseFloat(String(row[5] || '0').replace(/,/g, '')) || 0,
                qualifiedEase: parseFloat(String(row[6] || '0').replace(/,/g, '')) || 0,
            }));
    } catch (error) {
        console.error('Error fetching outreach from Google Sheets:', error);
        return [];
    }
}
