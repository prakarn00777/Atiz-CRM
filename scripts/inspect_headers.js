const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectSheets() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = '1UMc52UwDFsblLwEKb-NxA75EtituyIneC3tRqlawOgE';

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key.trim().replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response4 = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet4!A1:AB1',
        });
        const response5 = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet5!A1:AB1',
        });

        console.log('--- Sheet4 Headers ---');
        console.log(JSON.stringify(response4.data.values?.[0] || [], null, 2));

        console.log('--- Sheet5 Headers ---');
        console.log(JSON.stringify(response5.data.values?.[0] || [], null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

inspectSheets();
