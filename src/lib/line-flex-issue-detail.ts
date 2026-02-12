// LINE Flex Message builder for Issue Detail — Minimal compact

const BRAND = '#7053E1';
const TEXT_DARK = '#2D2D2D';
const TEXT_SUB = '#888888';

const SEVERITY_ICON: Record<string, string> = {
    Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢',
};

const STATUS_COLOR: Record<string, string> = {
    'แจ้งเคส': '#e74c3c',
    'กำลังดำเนินการ': '#f39c12',
    'เสร็จสิ้น': '#27ae60',
};

export interface IssueDetailData {
    caseNumber: string;
    title: string;
    customerName: string;
    branchName?: string;
    severity: string;
    status: string;
    assignedTo?: string;
    createdAt?: string;
    customerSubdomain?: string;
    crmBaseUrl: string;
    issueId: number;
}

export function buildIssueDetailFlex(data: IssueDetailData): object {
    const sevIcon = SEVERITY_ICON[data.severity] || '';
    const statColor = STATUS_COLOR[data.status] || TEXT_SUB;

    const customer = data.branchName
        ? `${data.customerName} (${data.branchName})`
        : data.customerName;

    // Build buttons row
    const buttons: object[] = [{
        type: 'button',
        action: { type: 'uri', label: 'ดูเคส', uri: `${data.crmBaseUrl}?tab=issues&issueId=${data.issueId}` },
        style: 'primary', color: BRAND, height: 'sm', flex: 1,
    }];

    if (data.customerSubdomain) {
        const url = data.customerSubdomain.startsWith('http')
            ? data.customerSubdomain
            : `https://${data.customerSubdomain}`;
        buttons.push({
            type: 'button',
            action: { type: 'uri', label: 'ระบบลูกค้า', uri: url },
            style: 'secondary', height: 'sm', flex: 1,
        });
    }

    return {
        type: 'flex',
        altText: `🎫 ${data.caseNumber} ${data.title}`,
        contents: {
            type: 'bubble',
            size: 'nano',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    // Line 1: case number + severity + status
                    {
                        type: 'box', layout: 'horizontal',
                        contents: [
                            { type: 'text', text: `🎫 ${data.caseNumber}`, size: 'xs', color: BRAND, weight: 'bold', flex: 0 },
                            { type: 'text', text: `${sevIcon} ${data.severity}`, size: 'xxs', color: TEXT_SUB, align: 'end', flex: 0, margin: 'md' },
                            { type: 'text', text: data.status, size: 'xxs', color: statColor, weight: 'bold', align: 'end', flex: 0, margin: 'sm' },
                        ],
                    },
                    // Line 2: title
                    { type: 'text', text: data.title, size: 'xxs', color: TEXT_DARK, weight: 'bold', margin: 'xs', wrap: true, maxLines: 2 },
                    // Line 3: customer
                    { type: 'text', text: customer, size: 'xxs', color: TEXT_SUB, margin: 'xs', wrap: true, maxLines: 1 },
                    // Buttons
                    {
                        type: 'box', layout: 'horizontal', margin: 'md', spacing: 'xs',
                        contents: buttons,
                    },
                ],
                paddingAll: '12px',
                spacing: 'none',
            },
        },
    };
}
