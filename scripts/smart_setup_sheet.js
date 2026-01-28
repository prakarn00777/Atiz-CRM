const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupSmartSheet() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = '1UMc52UwDFsblLwEKb-NxA75EtituyIneC3tRqlawOgE';

    if (!email || !key) return;

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key.trim().replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        console.log('Fetching headers to build smart mapping...');
        const h4 = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sheet4!A1:AZ1' });
        const h5 = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sheet5!A1:AZ1' });

        const headers4 = h4.data.values?.[0] || [];
        const headers5 = h5.data.values?.[0] || [];

        const targetColumns = ["ลีดที่", "เลขที่ลีด", "วันที่", "Product", "เซลล์", "ชื่อลูกค้า", "สถานะ Demo", "ชื่อคลินิก/ร้าน"];

        const findCol = (headers, name) => {
            const idx = headers.findIndex(h => h && h.trim().includes(name));
            return idx !== -1 ? `Col${idx + 1}` : 'null';
        };

        const cols4 = targetColumns.map(name => findCol(headers4, name)).join(', ');
        const cols5 = targetColumns.map(name => findCol(headers5, name)).join(', ');

        const formula = `=QUERY({
  QUERY('Sheet4'!A2:AZ, "select ${cols4}");
  QUERY('Sheet5'!A2:AZ, "select ${cols5}")
}, "where Col1 is not null")`;

        console.log('Generated Formula:', formula);

        // Update Headers
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet3!A1:H1',
            valueInputOption: 'RAW',
            requestBody: { values: [targetColumns] },
        });

        // Update Formula
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet3!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[formula]] },
        });

        console.log('Smart setup complete! Sheet3 is now perfectly aligned.');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

setupSmartSheet();
