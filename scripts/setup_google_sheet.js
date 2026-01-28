const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupSheet() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = '1UMc52UwDFsblLwEKb-NxA75EtituyIneC3tRqlawOgE'; // The one you provided

    if (!email || !key) {
        console.error('Credentials missing in .env.local');
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key.trim().replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Final Verified Layout (Sheet3): 9 columns
    // 1:Index, 2:Lead#, 3:Date, 4:Product, 5:Sales, 6:Customer, 7:Phone, 8:DemoStatus, 9:Clinic

    // Sheet4 (Aoey) Data Inspection: Demo at P(16), Clinic at U(21), Phone at I(9)
    // Sheet5 (Yo) Data Inspection: Demo at M(13), Clinic at Q(17), Phone at I(9)
    const formula = `=QUERY({
  QUERY('Sheet4'!A2:AB, "select Col1, Col2, Col3, Col4, Col7, Col8, Col9, Col16, Col21");
  QUERY('Sheet5'!A2:AB, "select Col1, Col2, Col3, Col4, Col7, Col8, Col9, Col13, Col17")
}, "where Col1 is not null")`;

    try {
        console.log('Sending request to Google Sheets...');

        // 1. Set the headers for the 9 columns in Sheet3!A1
        const customHeaders = [["ลีดที่", "เลขที่ลีด", "วันที่", "Product", "เซลล์", "ชื่อลูกค้า", "เบอร์โทร", "สถานะ Demo", "ชื่อคลินิก/ร้าน"]];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet3!A1:I1',
            valueInputOption: 'RAW',
            requestBody: {
                values: customHeaders,
            },
        });
        console.log('Headers updated in Sheet3!A1');

        // 2. Insert the formula in Sheet3!A2
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet3!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[formula]],
            },
        });

        console.log('Formula successfully inserted into Sheet3!A2');
        console.log('Done!');
    } catch (err) {
        if (err.message.includes('permission')) {
            console.error('Error: Permission Denied.');
            console.error('Please make sure to share the sheet with:', email);
        } else {
            console.error('Error:', err.message);
        }
    }
}

setupSheet();
