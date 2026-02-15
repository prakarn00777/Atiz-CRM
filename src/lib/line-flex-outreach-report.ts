// LINE Flex Message builder for Monthly Outreach Report

const BRAND = '#7053E1';    // Dr.Ease indigo
const EASEPOS = '#F76D85';  // EasePos rose
const TEXT_DARK = '#2D2D2D';
const TEXT_SUB = '#888888';
const TEXT_LIGHT = '#AAAAAA';

export interface OutreachDayData {
    day: number;
    drContacted: number;
    drQualified: number;
    easeContacted: number;
    easeQualified: number;
}

export interface OutreachReportData {
    monthLabel: string;          // "กุมภาพันธ์ 2569"
    days: OutreachDayData[];
    summary: {
        drContacted: number;
        drQualified: number;
        easeContacted: number;
        easeQualified: number;
    };
    demos: { name: string; count: number }[];
    totalLeads: number;
}

export function buildOutreachReportFlex(data: OutreachReportData): object {
    const body: object[] = [];

    // --- Daily rows ---
    // Table header
    body.push({
        type: 'box', layout: 'horizontal', margin: 'md',
        contents: [
            { type: 'text', text: 'วัน', size: 'xxs', color: TEXT_SUB, weight: 'bold', flex: 1, align: 'center' },
            { type: 'text', text: 'Dr ทัก/ลีด', size: 'xxs', color: BRAND, weight: 'bold', flex: 2, align: 'center' },
            { type: 'text', text: 'Ease ทัก/ลีด', size: 'xxs', color: EASEPOS, weight: 'bold', flex: 2, align: 'center' },
        ],
    });
    body.push(sep());

    // Daily data rows
    for (const d of data.days) {
        body.push({
            type: 'box', layout: 'horizontal', margin: 'xs',
            contents: [
                { type: 'text', text: String(d.day), size: 'xxs', color: TEXT_SUB, flex: 1, align: 'center' },
                { type: 'text', text: `${d.drContacted} / ${d.drQualified}`, size: 'xxs', color: TEXT_DARK, weight: 'bold', flex: 2, align: 'center' },
                { type: 'text', text: `${d.easeContacted} / ${d.easeQualified}`, size: 'xxs', color: TEXT_DARK, weight: 'bold', flex: 2, align: 'center' },
            ],
        });
    }

    body.push(sep());

    // --- Summary ---
    body.push(sectionTitle('📌 รวมยอดเดือน'));
    body.push(summaryRow('Dr.Ease', `${data.summary.drContacted} ทัก, ${data.summary.drQualified} ลีด`, BRAND));
    body.push(summaryRow('Ease', `${data.summary.easeContacted} ทัก, ${data.summary.easeQualified} ลีด`, EASEPOS));

    // --- Demos (always show all salespeople) ---
    body.push(sep());
    body.push(sectionTitle('🎯 เดโม่เดือนนี้'));
    for (const d of data.demos) {
        body.push(summaryRow(d.name, `${d.count}`, TEXT_DARK));
    }

    // --- Company Leads ---
    body.push(sep());
    body.push(summaryRow('🏢 ลีดบริษัทเดือนนี้', `${data.totalLeads} ลีด`, TEXT_DARK));

    return {
        type: 'flex',
        altText: `📊 Lead Report ${data.monthLabel}`,
        contents: {
            type: 'bubble',
            size: 'kilo',
            header: {
                type: 'box', layout: 'vertical',
                backgroundColor: '#7053E1',
                paddingAll: 'lg',
                contents: [
                    { type: 'text', text: '📊 Lead Report', color: '#FFFFFF', weight: 'bold', size: 'md' },
                    { type: 'text', text: data.monthLabel, color: '#FFFFFFCC', size: 'xs', margin: 'xs' },
                ],
            },
            body: {
                type: 'box', layout: 'vertical',
                paddingAll: 'lg',
                contents: body,
            },
        },
    };
}

function sep(): object {
    return { type: 'separator', margin: 'md', color: '#E8E8E8' };
}

function sectionTitle(text: string): object {
    return { type: 'text', text, size: 'xs', color: TEXT_DARK, weight: 'bold', margin: 'md' };
}

function summaryRow(label: string, value: string, valueColor: string): object {
    return {
        type: 'box', layout: 'horizontal', margin: 'xs',
        contents: [
            { type: 'text', text: label, size: 'xs', color: TEXT_SUB, flex: 3 },
            { type: 'text', text: value, size: 'xs', color: valueColor, align: 'end', weight: 'bold', flex: 3 },
        ],
    };
}
