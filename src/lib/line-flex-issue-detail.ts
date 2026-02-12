// LINE Flex Message builder for Issue Detail — Compact kilo

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
            size: 'kilo',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    // Row 1: case number + status
                    {
                        type: 'box', layout: 'horizontal',
                        contents: [
                            { type: 'text', text: `🎫 ${data.caseNumber}`, size: 'sm', color: BRAND, weight: 'bold', flex: 0 },
                            { type: 'text', text: data.status, size: 'xs', color: statColor, weight: 'bold', align: 'end' },
                        ],
                    },
                    // Row 2: title
                    { type: 'text', text: data.title, size: 'xs', color: TEXT_DARK, weight: 'bold', margin: 'sm', wrap: true, maxLines: 2 },
                    // Row 3: customer + severity
                    {
                        type: 'box', layout: 'horizontal', margin: 'sm',
                        contents: [
                            { type: 'text', text: customer, size: 'xs', color: TEXT_SUB, flex: 3, wrap: true, maxLines: 1 },
                            { type: 'text', text: `${sevIcon} ${data.severity}`, size: 'xs', color: TEXT_SUB, align: 'end', flex: 0 },
                        ],
                    },
                    // Buttons
                    {
                        type: 'box', layout: 'horizontal', margin: 'lg', spacing: 'sm',
                        contents: buttons,
                    },
                ],
                paddingAll: '14px',
                spacing: 'none',
            },
        },
    };
}
