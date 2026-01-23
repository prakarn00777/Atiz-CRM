import { google } from 'googleapis';

// Initialize Google Sheets API client
const getGoogleSheetsClient = async () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    const missing = [];
    if (!email) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!key) missing.push('GOOGLE_PRIVATE_KEY');
    console.error(`Missing Google Service Account credentials: ${missing.join(', ')}`);
    throw new Error(`Google Sheets credentials not configured. Missing: ${missing.join(', ')}`);
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error: any) {
    console.error('Error initializing Google Sheets client:', error.message);
    throw new Error(`Google Auth initialization failed: ${error.message}`);
  }
};

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

// Lead interface matching the actual Google Sheet structure
export interface LeadRow {
  id?: string;           // Row number (for reference)
  leadIndex: string;     // ลีดที่ (Column A)
  leadNumber: string;    // เลขที่ลีด (Column B)
  date: string;          // วันที่ (Column C)
  product: string;       // Product (Column D)
  source: string;        // ลีด (Column E) - Lead source
  leadType: string;      // ประเภทลีด (Column F)
  salesName: string;     // เซลล์ (Column G)
  customerName: string;  // ชื่อลูกค้า (Column H)
  phone: string;         // เบอร์โทร (Column I)
  quotationStatus: string; // สถานะใบเสนอราคา (Column J)
  quotation: string;     // ใบเสนอราคา (Column K)
  clinicName: string;    // ชื่อคลินิก/ธุรกิจ (Column L)
  notes: string;         // Note (Column M)
}

// Get all leads from the sheet (READ ONLY)
export async function getLeads(): Promise<LeadRow[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    if (!SPREADSHEET_ID) {
      console.error('GOOGLE_SPREADSHEET_ID is missing');
      throw new Error('GOOGLE_SPREADSHEET_ID is not defined in environment variables');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:M`, // Columns A to M (13 columns)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // First row is header, skip it
    const [, ...dataRows] = rows;

    return dataRows
      .filter(row => row.some(cell => cell)) // Filter out completely empty rows
      .map((row, index) => ({
        id: String(index + 2), // Row number (2-based since row 1 is header)
        leadIndex: row[0] || '',      // ลีดที่
        leadNumber: row[1] || '',     // เลขที่ลีด
        date: row[2] || '',           // วันที่
        product: row[3] || '',        // Product
        source: row[4] || '',         // ลีด
        leadType: row[5] || '',       // ประเภทลีด
        salesName: row[6] || '',      // เซลล์
        customerName: row[7] || '',   // ชื่อลูกค้า
        phone: row[8] || '',          // เบอร์โทร
        quotationStatus: row[9] || '',// สถานะใบเสนอราคา
        quotation: row[10] || '',     // ใบเสนอราคา
        clinicName: row[11] || '',    // ชื่อคลินิก/ธุรกิจ
        notes: row[12] || '',         // Note
      }));
  } catch (error) {
    console.error('Error fetching leads from Google Sheets:', error);
    throw error;
  }
}
