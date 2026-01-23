import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Ensure GOOGLE_SPREADSHEET_ID is set BEFORE anything else
process.env.GOOGLE_SPREADSHEET_ID = '1UMc52UwDFsblLwEKb-NxA75EtituyIneC3tRqlawOgE';

async function checkLeads() {
    try {
        // Dynamic import to ensure process.env is set before the module evaluates its top-level constants
        const { getLeads } = await import('./src/lib/google-sheets');
        const { parseSheetDate } = await import('./src/components/Dashboard');

        const leads = await getLeads();
        console.log(`Total leads fetched: ${leads.length}`);

        const getFixedWeekRange = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        };

        const now = new Date();
        const currentWeekResource = getFixedWeekRange(now);

        console.log(`Current Week Range: ${currentWeekResource.start.toISOString()} to ${currentWeekResource.end.toISOString()}`);

        const spamLeads: any[] = [];
        const duplicateLeads: any[] = [];
        const seen = new Map();

        leads.forEach(l => {
            if (!l.date) return;
            const rDate = parseSheetDate(l.date);
            if (!rDate) return;

            // Check if in current week
            if (rDate >= currentWeekResource.start && rDate <= currentWeekResource.end) {
                const hasName = l.customerName && l.customerName.trim() !== '';
                const isNotSpam = !l.leadType?.toLowerCase().includes('spam') && !l.customerName?.toLowerCase().includes('test');

                if (!hasName || !isNotSpam) {
                    spamLeads.push(l);
                } else {
                    seen.set(l.id, l); // Just use ID to collect all valid entries
                }
            }
        });

        console.log(`\nValid leads in current week (after deduplication): ${seen.size}`);

        console.log('\n--- ALL VALID LEADS (This Week) ---');
        const sortedLeads = Array.from(seen.values()).sort((a, b) => a.id - b.id);
        sortedLeads.forEach(l => console.log(`ID: ${l.id}, Name: ${l.customerName}, Date: ${l.date}`));

        console.log('\n--- SPAM / INVALID LEADS (This Week) ---');
        spamLeads.forEach(l => console.log(`ID: ${l.id}, Name: ${l.customerName}, Type: ${l.leadType}, Date: ${l.date}`));

        console.log('\n--- DUPLICATE LEADS (This Week) ---');
        duplicateLeads.forEach(d => {
            console.log(`Duplicate found!`);
            console.log(`  Original:  ID: ${d.original.id}, Name: ${d.original.customerName}, Phone: ${d.original.phone}, Date: ${d.original.date}, Type: ${d.original.leadType}, Notes: ${d.original.notes}`);
            console.log(`  Duplicate: ID: ${d.duplicate.id}, Name: ${d.duplicate.customerName}, Phone: ${d.duplicate.phone}, Date: ${d.duplicate.date}, Type: ${d.duplicate.leadType}, Notes: ${d.duplicate.notes}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkLeads();
