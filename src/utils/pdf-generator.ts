import { companyInfo } from "@/constants/companyInfo";
import { formatDate, formatTime } from "@/lib/locale-format";

/** Escape user-supplied strings before embedding them in HTML templates. */
function escapeHtml(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export interface PDFContent {
  title?: string;
  subtitle?: string;
  sections?: PDFSection[];
  tables?: PDFTable[];
  summary?: PDFSummary[];
  userEmail?: string;
}

export interface PDFSection {
  title: string;
  items: Array<{ label: string; value: string | number }>;
}

export interface PDFTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface PDFSummary {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface OccupancyReportData {
  propertyName?: string;
  period: string;
  summary: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    averageRent: number;
    totalMonthlyRevenue: number;
    averageTenancy?: number;
  };
  tenants: Array<{
    name: string;
    unit: string;
    rent: number;
    moveIn: string;
    leaseEnd: string;
    status: string;
  }>;
  properties: Array<{
    name: string;
    units: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
  }>;
  trends: {
    previousMonth: number;
    change: number;
    averageTenancy?: number;
    turnoverRate: number;
  };
}

/**
 * Detects the current theme (dark or light mode)
 */
function detectTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  
  // Check if dark class is present on html element
  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  
  // Check localStorage for theme preference
  try {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
  } catch (e) {
    // localStorage might not be available
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Generates HTML content for occupancy report from data
 */
export function generateOccupancyReportHTML(data: OccupancyReportData): string {
  const now = new Date();
  const dateStr = formatDate(now, { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = formatTime(now, { hour: '2-digit', minute: '2-digit' });
  const generatedText = `${dateStr} at ${timeStr}`;

  const propertyName = data.propertyName || "Oak Street Apartments";
  const occupancyRate = data.summary.occupancyRate.toFixed(1);
  const changeSign = data.trends.change >= 0 ? '+' : '';
  const changeText = data.trends.change === 0 ? 'Flat' : `${changeSign}${data.trends.change.toFixed(1)}%`;

  const theme = detectTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#111827' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#1f2937';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const mutedText = isDark ? '#9ca3af' : '#6b7280';
  const headerBg = isDark ? '#1f2937' : '#ffffff';
  const headerText = isDark ? '#f9fafb' : '#1f2937';
  const tableHeaderBg = isDark ? '#374151' : '#f9fafb';
  const tableHeaderText = isDark ? '#f9fafb' : '#1f2937';
  const accentColor = '#f97316'; // Keep orange for accents only

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ondo Real Estate - Occupancy Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: letter;
            margin: 0.5in;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            background: ${headerBg};
            color: ${headerText};
            padding: 40px 20px;
            margin: 0 0 30px 0;
            border-radius: 0;
            border-bottom: 2px solid ${borderColor};
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.95;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .header .timestamp {
            font-size: 0.9em;
            opacity: 0.85;
            margin-top: 8px;
        }

        .header .website {
            font-size: 0.85em;
            opacity: 0.9;
            margin-top: 4px;
        }

        .company-info {
            background: ${cardBg};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid ${borderColor};
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .info-item {
            border-left: 4px solid ${accentColor};
            padding-left: 16px;
        }

        .info-label {
            font-size: 0.75em;
            color: ${mutedText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 600;
        }

        .info-value {
            font-size: 0.95em;
            font-weight: 600;
            color: ${textColor};
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }

        .metric-card {
            background: ${cardBg};
            padding: 20px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
            box-shadow: 0 2px 4px rgba(0, 0, 0, ${isDark ? '0.3' : '0.08'});
            text-align: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-label {
            font-size: 0.8em;
            color: ${mutedText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .metric-value {
            font-size: 2.2em;
            font-weight: 700;
            color: ${accentColor};
            margin-bottom: 6px;
        }

        .metric-subtext {
            font-size: 0.8em;
            color: ${mutedText};
        }

        .section {
            background: ${cardBg};
            padding: 25px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 1.3em;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid ${accentColor};
        }

        .trend-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid ${borderColor};
        }

        .trend-item:last-child {
            border-bottom: none;
        }

        .trend-label {
            font-size: 0.95em;
            color: ${textColor};
            font-weight: 500;
        }

        .trend-value {
            font-size: 1.1em;
            font-weight: 600;
            color: ${accentColor};
        }

        .status-active {
            color: #22c55e;
            font-weight: 600;
        }

        .status-vacant {
            color: #ef4444;
            font-weight: 600;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.9em;
            background: ${cardBg};
        }

        thead {
            background: ${tableHeaderBg};
            color: ${tableHeaderText};
        }

        th {
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        th:first-child {
            border-top-left-radius: 6px;
        }

        th:last-child {
            border-top-right-radius: 6px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid ${borderColor};
            color: ${textColor};
        }

        tbody tr {
            transition: background-color 0.2s;
        }

        tbody tr:hover {
            background: ${isDark ? '#374151' : '#f9fafb'};
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .property-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .property-card {
            background: ${isDark ? '#374151' : '#f8f9fa'};
            padding: 18px;
            border-radius: 8px;
            border-left: 4px solid ${accentColor};
            border: 1px solid ${borderColor};
        }

        .property-name {
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 12px;
            font-size: 1.05em;
        }

        .property-stat {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 0.9em;
        }

        .property-stat-label {
            color: ${mutedText};
        }

        .property-stat-value {
            font-weight: 600;
            color: ${textColor};
        }

        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid ${borderColor};
            text-align: center;
            font-size: 0.85em;
            color: ${mutedText};
        }

        .footer p {
            margin: 4px 0;
        }

        .footer .company-name {
            font-weight: 600;
            color: ${textColor};
            margin-top: 8px;
        }

        @media print {
            body {
                background: ${bgColor};
            }

            .header {
                margin: 0;
                padding: 20px;
                page-break-after: avoid;
            }

            .section {
                page-break-inside: avoid;
            }

            .metrics-grid {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }

            thead {
                display: table-header-group;
            }

            tfoot {
                display: table-footer-group;
            }
        }

        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .property-section {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyInfo.name.toUpperCase()}</h1>
            <div class="subtitle">${escapeHtml(propertyName)} - Occupancy Report</div>
            <div class="timestamp">Generated: ${generatedText}</div>
            <div class="website">${companyInfo.urls.website}</div>
        </div>

        <div class="company-info">
            <div class="info-item">
                <div class="info-label">Address</div>
                <div class="info-value">${companyInfo.address.streetAddress}</div>
                <div class="info-value" style="font-size: 0.9em; margin-top: 4px; font-weight: 400;">${companyInfo.address.addressLocality}, ${companyInfo.address.addressRegion} ${companyInfo.address.postalCode}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${companyInfo.phoneDisplay}</div>
                <div class="info-value" style="font-size: 0.9em; margin-top: 4px; font-weight: 400;">${companyInfo.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Website</div>
                <div class="info-value">${companyInfo.urls.website}</div>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Occupied Units</div>
                <div class="metric-value">${data.summary.occupiedUnits}</div>
                <div class="metric-subtext">Out of ${data.summary.totalUnits} total units</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Vacant Units</div>
                <div class="metric-value">${data.summary.vacantUnits}</div>
                <div class="metric-subtext">Available for lease</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Occupancy Rate</div>
                <div class="metric-value">${occupancyRate}%</div>
                <div class="metric-subtext">Current month trend: ${changeText}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Rent</div>
                <div class="metric-value">$${data.summary.averageRent.toLocaleString()}</div>
                <div class="metric-subtext">Per unit per month</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Monthly Revenue</div>
                <div class="metric-value">$${data.summary.totalMonthlyRevenue.toLocaleString()}</div>
                <div class="metric-subtext">${data.period}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Tenancy</div>
                <div class="metric-value">${data.trends.averageTenancy || data.summary.averageTenancy || 'N/A'}</div>
                <div class="metric-subtext">Months of tenure</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Occupancy Trends</div>
            <div class="trend-item">
                <span class="trend-label">Current Rate</span>
                <span class="trend-value">${occupancyRate}%</span>
            </div>
            <div class="trend-item">
                <span class="trend-label">Previous Month</span>
                <span class="trend-value">${data.trends.previousMonth.toFixed(1)}%</span>
            </div>
            <div class="trend-item">
                <span class="trend-label">Month-over-Month Change</span>
                <span class="trend-value" style="color: #666;">${changeSign}${data.trends.change.toFixed(1)}%</span>
            </div>
            ${data.trends.averageTenancy || data.summary.averageTenancy ? `
            <div class="trend-item">
                <span class="trend-label">Average Tenancy</span>
                <span class="trend-value">${data.trends.averageTenancy || data.summary.averageTenancy} months</span>
            </div>
            ` : ''}
            <div class="trend-item">
                <span class="trend-label">Turnover Rate</span>
                <span class="trend-value">${data.trends.turnoverRate.toFixed(1)}%</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Current Tenants</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Unit</th>
                        <th>Monthly Rent</th>
                        <th>Move-In</th>
                        <th>Lease End</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.tenants.map(tenant => `
                    <tr>
                        <td>${escapeHtml(tenant.name)}</td>
                        <td>${escapeHtml(tenant.unit)}</td>
                        <td>$${tenant.rent.toLocaleString()}</td>
                        <td>${escapeHtml(tenant.moveIn)}</td>
                        <td>${escapeHtml(tenant.leaseEnd)}</td>
                        <td><span class="status-active">${escapeHtml(tenant.status)}</span></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Property Breakdown</div>
            <div class="property-section">
                ${data.properties.map(property => `
                <div class="property-card">
                    <div class="property-name">${escapeHtml(property.name)}</div>
                    <div class="property-stat">
                        <span class="property-stat-label">Total Units:</span>
                        <span class="property-stat-value">${property.units}</span>
                    </div>
                    <div class="property-stat">
                        <span class="property-stat-label">Occupied:</span>
                        <span class="property-stat-value">${property.occupied}</span>
                    </div>
                    <div class="property-stat">
                        <span class="property-stat-label">Vacant:</span>
                        <span class="property-stat-value">${property.vacant}</span>
                    </div>
                    <div class="property-stat">
                        <span class="property-stat-label">Occupancy Rate:</span>
                        <span class="property-stat-value">${property.occupancyRate}%</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>End of Report: Occupancy Report</p>
            <p>This report was generated by ${companyInfo.name}</p>
            <div class="company-name">${companyInfo.name}</div>
            <p>${companyInfo.address.streetAddress}</p>
            <p>${companyInfo.address.addressLocality}, ${companyInfo.address.addressRegion} ${companyInfo.address.postalCode}</p>
            <p>Phone: ${companyInfo.phoneDisplay} | Email: ${companyInfo.email}</p>
            <p>${companyInfo.urls.website}</p>
            <p style="margin-top: 12px;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generates and downloads a PDF from HTML content using the browser's print functionality
 * This is a fallback method that works without external libraries
 * @param useCurrentWindow - If true, uses current window instead of opening new one
 */
export async function generatePDFFromHTML(htmlContent: string, _fileName: string = 'report', useCurrentWindow: boolean = false): Promise<void> {
  if (useCurrentWindow) {
    // Use current window - replace content and trigger print
    document.open();
    document.write(htmlContent);
    document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Trigger print dialog in current window
    window.print();
  } else {
    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups for this site.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Trigger print dialog
    printWindow.print();
  }
}

/**
 * Generates and downloads a PDF from HTML content using html2pdf.js
 * Requires html2pdf.js to be installed: npm install html2pdf.js
 */
/**
 * Generates and downloads a PDF from HTML content using html2pdf.js
 * Requires html2pdf.js to be installed: npm install html2pdf.js
 * 
 * Note: This function will fall back to the print method if html2pdf.js is not available
 */
export async function generatePDFFromHTMLWithLibrary(
  htmlContent: string,
  fileName: string = 'report',
  options?: {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
  }
): Promise<void> {
  // Check if html2pdf.js is available in the global scope
  // Note: For build compatibility, we only check window.html2pdf
  // To use html2pdf.js, load it via script tag or install and configure Vite to handle it
  let html2pdf: any = null;
  
  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    html2pdf = (window as any).html2pdf;
  } else {
    // Library not available, fall back to print method
    console.warn('html2pdf.js not available. Load it via script tag or use print method. Falling back to print method.');
    return generatePDFFromHTML(htmlContent, fileName);
  }

  const element = document.createElement('div');
  try {
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    const opt = {
      margin: options?.margin || [0.5, 0.5, 0.5, 0.5],
      filename: options?.filename || `${fileName}.pdf`,
      image: options?.image || { type: 'jpeg', quality: 0.98 },
      html2canvas: options?.html2canvas || { scale: 2, useCORS: true },
      jsPDF: options?.jsPDF || { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error generating PDF with library:', error);
    // Fallback to print method
    await generatePDFFromHTML(htmlContent, fileName);
  } finally {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
  }
}

/**
 * Generates a professional HTML-based PDF from generic content
 * This is the main function used by ExportPDFButton and other components
 */
export function generateGenericPDFHTML(data: PDFContent, fileName: string = 'report'): string {
  const now = new Date();
  const dateStr = formatDate(now, { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = formatTime(now, { hour: '2-digit', minute: '2-digit' });
  const generatedText = `${dateStr} at ${timeStr}`;
  const userEmail = data.userEmail || '';

  const theme = detectTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#111827' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#1f2937';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const mutedText = isDark ? '#9ca3af' : '#6b7280';
  const headerBg = isDark ? '#1f2937' : '#ffffff';
  const headerText = isDark ? '#f9fafb' : '#1f2937';
  const tableHeaderBg = isDark ? '#374151' : '#f9fafb';
  const tableHeaderText = isDark ? '#f9fafb' : '#1f2937';
  const accentColor = '#f97316'; // Keep orange for accents only

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${companyInfo.name} - ${data.title || fileName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: letter;
            margin: 0.5in;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
        }

        .header {
            text-align: center;
            background: ${headerBg};
            color: ${headerText};
            padding: 40px 20px;
            margin: 0 0 30px 0;
            border-radius: 0;
            border-bottom: 2px solid ${borderColor};
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.95;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .header .user-info {
            font-size: 0.95em;
            opacity: 0.9;
            margin-bottom: 8px;
        }

        .header .timestamp {
            font-size: 0.9em;
            opacity: 0.85;
            margin-top: 8px;
        }

        .header .website {
            font-size: 0.85em;
            opacity: 0.9;
            margin-top: 4px;
        }

        .company-info {
            background: ${cardBg};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid ${borderColor};
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .info-item {
            border-left: 4px solid ${accentColor};
            padding-left: 16px;
        }

        .info-label {
            font-size: 0.75em;
            color: ${mutedText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 600;
        }

        .info-value {
            font-size: 0.95em;
            font-weight: 600;
            color: ${textColor};
        }

        .summary-section {
            background: ${cardBg};
            padding: 25px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .summary-title {
            font-size: 1.3em;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid ${accentColor};
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .summary-item {
            padding: 15px;
            background: ${isDark ? '#374151' : '#f8f9fa'};
            border-radius: 6px;
            border-left: 4px solid ${accentColor};
        }

        .summary-label {
            font-size: 0.8em;
            color: ${mutedText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .summary-value {
            font-size: 1.4em;
            font-weight: 700;
            color: ${accentColor};
        }

        .section {
            background: ${cardBg};
            padding: 25px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 1.3em;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid ${accentColor};
        }

        .section-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid ${borderColor};
        }

        .section-item:last-child {
            border-bottom: none;
        }

        .section-label {
            font-size: 0.95em;
            color: ${textColor};
            font-weight: 500;
        }

        .section-value {
            font-size: 1em;
            font-weight: 600;
            color: ${textColor};
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.9em;
            background: ${cardBg};
        }

        thead {
            background: ${tableHeaderBg};
            color: ${tableHeaderText};
        }

        th {
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        th:first-child {
            border-top-left-radius: 6px;
        }

        th:last-child {
            border-top-right-radius: 6px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid ${borderColor};
            color: ${textColor};
        }

        tbody tr {
            transition: background-color 0.2s;
        }

        tbody tr:hover {
            background: ${isDark ? '#374151' : '#f9fafb'};
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .table-section {
            background: ${cardBg};
            padding: 25px;
            border-radius: 8px;
            border: 1px solid ${borderColor};
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .table-title {
            font-size: 1.3em;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid ${accentColor};
        }

        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid ${borderColor};
            text-align: center;
            font-size: 0.85em;
            color: ${mutedText};
        }

        .footer p {
            margin: 4px 0;
        }

        .footer .company-name {
            font-weight: 600;
            color: ${textColor};
            margin-top: 8px;
        }

        @media print {
            body {
                background: ${bgColor};
            }

            .header {
                margin: 0;
                padding: 30px 20px;
                page-break-after: avoid;
            }

            .section, .summary-section, .table-section {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }

            thead {
                display: table-header-group;
            }

            tfoot {
                display: table-footer-group;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyInfo.name.toUpperCase()}</h1>
            ${userEmail ? `<div class="user-info">${escapeHtml(userEmail)}</div>` : ''}
            <div class="timestamp">Generated: ${generatedText}</div>
            <div class="website">${companyInfo.urls.website}</div>
        </div>

        <div class="company-info">
            <div class="info-item">
                <div class="info-label">Address</div>
                <div class="info-value">${companyInfo.address.streetAddress}</div>
                <div class="info-value" style="font-size: 0.85em; margin-top: 4px; font-weight: 400;">${companyInfo.address.addressLocality}, ${companyInfo.address.addressRegion} ${companyInfo.address.postalCode}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${companyInfo.phoneDisplay}</div>
                <div class="info-value" style="font-size: 0.85em; margin-top: 4px; font-weight: 400;">${companyInfo.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Website</div>
                <div class="info-value">${companyInfo.urls.website}</div>
            </div>
        </div>

        ${data.title ? `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 2em; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${escapeHtml(data.title?.toUpperCase())}</h2>
            ${data.subtitle ? `<p style="font-size: 1.1em; color: #6b7280;">${escapeHtml(data.subtitle)}</p>` : ''}
        </div>
        ` : ''}

        ${data.summary && data.summary.length > 0 ? `
        <div class="summary-section">
            <div class="summary-title">Executive Summary</div>
            <div class="summary-grid">
                ${data.summary.map(item => {
                  const value = typeof item.value === 'number'
                    ? (item.value.toLocaleString ? `$${item.value.toLocaleString()}` : item.value.toString())
                    : escapeHtml(item.value);
                  return `
                <div class="summary-item">
                    <div class="summary-label">${escapeHtml(item.label)}</div>
                    <div class="summary-value">${value}</div>
                </div>
                `;
                }).join('')}
            </div>
        </div>
        ` : ''}

        ${data.sections && data.sections.length > 0 ? data.sections.map(section => `
        <div class="section">
            <div class="section-title">${escapeHtml(section.title)}</div>
            ${section.items.map(item => {
              const value = typeof item.value === 'number'
                ? (item.value.toLocaleString ? `$${item.value.toLocaleString()}` : item.value.toString())
                : escapeHtml(item.value);
              return `
            <div class="section-item">
                <span class="section-label">${escapeHtml(item.label)}</span>
                <span class="section-value">${value}</span>
            </div>
            `;
            }).join('')}
        </div>
        `).join('') : ''}

        ${data.tables && data.tables.length > 0 ? data.tables.map(table => `
        <div class="table-section">
            <div class="table-title">${escapeHtml(table.title)}</div>
            <table>
                <thead>
                    <tr>
                        ${table.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${table.rows.map(row => `
                    <tr>
                        ${row.map(cell => {
                          const cellValue = typeof cell === 'number'
                            ? (cell.toLocaleString ? cell.toLocaleString() : cell.toString())
                            : escapeHtml(cell);
                          return `<td>${cellValue}</td>`;
                        }).join('')}
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `).join('') : ''}

        <div class="footer">
            <p>End of Report: ${data.title || fileName}</p>
            <p>This report was generated by ${companyInfo.name}</p>
            <div class="company-name">${companyInfo.name}</div>
            <p>${companyInfo.address.streetAddress}</p>
            <p>${companyInfo.address.addressLocality}, ${companyInfo.address.addressRegion} ${companyInfo.address.postalCode}</p>
            <p>Phone: ${companyInfo.phoneDisplay} | Email: ${companyInfo.email}</p>
            <p>${companyInfo.urls.website}</p>
            <p style="margin-top: 12px;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generates and downloads a generic PDF from content data
 */
export async function generateGenericPDF(
  data: PDFContent,
  fileName: string = 'report',
  useLibrary: boolean = false,
  useCurrentWindow: boolean = false
): Promise<void> {
  const htmlContent = generateGenericPDFHTML(data, fileName);

  if (useLibrary) {
    await generatePDFFromHTMLWithLibrary(htmlContent, fileName);
  } else {
    await generatePDFFromHTML(htmlContent, fileName, useCurrentWindow);
  }
}

/**
 * Generates occupancy report PDF from data
 * @param useCurrentWindow - If true, uses current window instead of opening new one
 */
export async function generateOccupancyReportPDF(
  data: OccupancyReportData,
  fileName: string = 'occupancy-report',
  useLibrary: boolean = false,
  useCurrentWindow: boolean = false
): Promise<void> {
  const htmlContent = generateOccupancyReportHTML(data);

  if (useLibrary) {
    await generatePDFFromHTMLWithLibrary(htmlContent, fileName);
  } else {
    await generatePDFFromHTML(htmlContent, fileName, useCurrentWindow);
  }
}

