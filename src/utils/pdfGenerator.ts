import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  content?: string;
  generatedBy: string;
  department?: string;
  date: string;
  institutionName?: string;
  institutionLogo?: string;
  charts: {
    attendance?: { name: string; attendance: number }[];
    grades?: { name: string; value: number; color: string }[];
    performance?: { month: string; score: number }[];
    comparison?: { subject: string; avg: number }[];
  };
  students?: {
    name: string;
    email?: string;
    attendance?: number;
    guardian_name?: string;
  }[];
  summary?: {
    totalStudents: number;
    avgAttendance: number;
    highPerformers: number;
    lowAttendance: number;
  };
}

export interface SingleStudentReportData {
  title: string;
  generatedBy: string;
  date: string;
  institutionName?: string;
  description?: string;
  student: {
    name: string;
    studentId?: string;
    year?: number;
    email?: string;
    attendance?: number;
    contact?: number;
    guardianName?: string;
    guardianPhone?: string;
  };
  customFields?: { label: string; value: string }[];
  subjectMarks?: { subject: string; marks: number; outOf: number }[];
  monthlyAttendance?: { month: string; attendance: number }[];
  progressData?: { month: string; score: number }[];
  selectedCharts: string[];
}

// Primary color (navy blue theme)
const PRIMARY_COLOR = { r: 30, g: 58, b: 138 };
const ACCENT_COLOR = { r: 217, g: 119, b: 6 };
const SUCCESS_COLOR = { r: 34, g: 197, b: 94 };
const DANGER_COLOR = { r: 239, g: 68, b: 68 };

// Helper to draw rounded rectangles
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

// Draw a styled header
function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  institutionName?: string,
  margin: number = 15
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background with gradient effect
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Accent stripe
  doc.setFillColor(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
  doc.rect(0, 50, pageWidth, 3, 'F');
  
  // Institution name (if provided)
  let titleY = 18;
  if (institutionName) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(institutionName.toUpperCase(), margin, 12);
    titleY = 28;
  }
  
  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, titleY);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, margin, titleY + 8);
  
  return 60; // Return Y position after header
}

// Draw a section title
function drawSectionTitle(doc: jsPDF, title: string, y: number, margin: number = 15): number {
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(margin, y, 4, 8, 'F');
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 8, y + 6);
  
  return y + 14;
}

// Draw a bar chart
function drawBarChart(
  doc: jsPDF,
  data: { name: string; value: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  color: { r: number; g: number; b: number } = { r: 59, g: 130, b: 246 }
) {
  const padding = 10;
  const chartHeight = height - 40;
  const chartWidth = width - padding * 2;
  
  // Background
  doc.setFillColor(248, 250, 252);
  roundedRect(doc, x, y, width, height, 4);
  
  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text(title, x + width / 2, y + 15, { align: 'center' });
  
  if (data.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' });
    return;
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = (chartWidth - (data.length - 1) * 5) / data.length;
  
  data.forEach((item, i) => {
    const barHeight = (item.value / maxValue) * (chartHeight - 20);
    const barX = x + padding + i * (barWidth + 5);
    const barY = y + 25 + (chartHeight - 20 - barHeight);
    
    // Bar with color
    doc.setFillColor(color.r, color.g, color.b);
    roundedRect(doc, barX, barY, barWidth, barHeight, 2);
    
    // Value label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(String(Math.round(item.value)), barX + barWidth / 2, barY - 3, { align: 'center' });
    
    // X-axis label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const label = item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name;
    doc.text(label, barX + barWidth / 2, y + height - 5, { align: 'center' });
  });
}

// Draw a pie chart with legend
function drawPieChart(
  doc: jsPDF,
  data: { name: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) {
  const centerX = x + width * 0.35;
  const centerY = y + height / 2 + 5;
  const radius = Math.min(width * 0.35, height / 2) - 20;
  
  // Background
  doc.setFillColor(248, 250, 252);
  roundedRect(doc, x, y, width, height, 4);
  
  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text(title, x + width / 2, y + 15, { align: 'center' });
  
  if (data.length === 0 || data.every(d => d.value === 0)) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' });
    return;
  }
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = -Math.PI / 2;
  
  // Draw slices
  data.forEach((item) => {
    if (item.value === 0) return;
    
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Convert hex color to RGB
    const hex = item.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 100;
    const g = parseInt(hex.substring(2, 4), 16) || 100;
    const b = parseInt(hex.substring(4, 6), 16) || 100;
    
    doc.setFillColor(r, g, b);
    
    // Draw pie slice using triangles
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const angle1 = startAngle + (sliceAngle * i) / steps;
      const angle2 = startAngle + (sliceAngle * (i + 1)) / steps;
      
      doc.triangle(
        centerX, centerY,
        centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1),
        centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2),
        'F'
      );
    }
    
    startAngle += sliceAngle;
  });
  
  // Draw legend on the right side
  const legendX = x + width * 0.65;
  let legendY = y + 30;
  
  doc.setFontSize(8);
  data.forEach((item) => {
    const hex = item.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 100;
    const g = parseInt(hex.substring(2, 4), 16) || 100;
    const b = parseInt(hex.substring(4, 6), 16) || 100;
    
    doc.setFillColor(r, g, b);
    doc.rect(legendX, legendY - 3, 8, 8, 'F');
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
    doc.text(`${item.name}: ${percent}%`, legendX + 12, legendY + 2);
    
    legendY += 12;
  });
}

// Draw a line chart
function drawLineChart(
  doc: jsPDF,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  color: { r: number; g: number; b: number } = { r: 139, g: 92, b: 246 }
) {
  const padding = 20;
  const chartHeight = height - 50;
  const chartWidth = width - padding * 2;
  
  // Background
  doc.setFillColor(248, 250, 252);
  roundedRect(doc, x, y, width, height, 4);
  
  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text(title, x + width / 2, y + 15, { align: 'center' });
  
  if (data.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' });
    return;
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const stepX = chartWidth / (data.length - 1 || 1);
  
  // Y-axis labels
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  for (let i = 0; i <= 4; i++) {
    const val = minValue + (range * (4 - i)) / 4;
    const gridY = y + 25 + (chartHeight * i) / 4;
    doc.text(String(Math.round(val)), x + padding - 5, gridY + 2, { align: 'right' });
    
    // Grid line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(x + padding, gridY, x + width - padding, gridY);
  }
  
  // Draw area fill
  const points: [number, number][] = data.map((item, i) => [
    x + padding + i * stepX,
    y + 25 + chartHeight - ((item.value - minValue) / range) * chartHeight,
  ]);
  
  // Area gradient effect (lighter version of color)
  doc.setFillColor(color.r, color.g, color.b, 0.1);
  doc.setDrawColor(color.r, color.g, color.b);
  
  // Draw line
  doc.setLineWidth(2);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  
  // Draw points and labels
  doc.setFillColor(color.r, color.g, color.b);
  points.forEach((point, i) => {
    // Point
    doc.circle(point[0], point[1], 2.5, 'F');
    
    // White inner circle
    doc.setFillColor(255, 255, 255);
    doc.circle(point[0], point[1], 1.2, 'F');
    doc.setFillColor(color.r, color.g, color.b);
    
    // Value above point
    doc.setFontSize(7);
    doc.setTextColor(51, 51, 51);
    doc.text(String(Math.round(data[i].value)), point[0], point[1] - 5, { align: 'center' });
    
    // X-axis label
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(data[i].label, point[0], y + height - 8, { align: 'center' });
  });
}

// Draw info card/box
function drawInfoCard(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number } = PRIMARY_COLOR
) {
  // Background
  doc.setFillColor(248, 250, 252);
  roundedRect(doc, x, y, width, height, 3);
  
  // Left accent bar
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(x, y + 4, 3, height - 8, 'F');
  
  // Label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(label, x + 8, y + height / 2 - 3);
  
  // Value
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color.r, color.g, color.b);
  doc.text(value, x + 8, y + height / 2 + 6);
}

export function generateAnnualReportPDF(reportData: ReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Draw header
  let currentY = drawHeader(
    doc,
    reportData.title,
    `Generated by: ${reportData.generatedBy} | ${reportData.date}`,
    reportData.institutionName,
    margin
  );
  
  // Summary section
  if (reportData.summary) {
    currentY = drawSectionTitle(doc, 'Executive Summary', currentY, margin);
    
    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 24;
    
    const summaryItems = [
      { label: 'Total Students', value: String(reportData.summary.totalStudents), color: PRIMARY_COLOR },
      { label: 'Avg Attendance', value: `${reportData.summary.avgAttendance.toFixed(1)}%`, color: SUCCESS_COLOR },
      { label: 'High Performers', value: String(reportData.summary.highPerformers), color: { r: 139, g: 92, b: 246 } },
      { label: 'Low Attendance', value: String(reportData.summary.lowAttendance), color: DANGER_COLOR },
    ];
    
    summaryItems.forEach((item, i) => {
      drawInfoCard(doc, item.label, item.value, margin + i * (cardWidth + 3), currentY, cardWidth, cardHeight, item.color);
    });
    
    currentY += cardHeight + 10;
  }
  
  // Description
  if (reportData.content) {
    currentY = drawSectionTitle(doc, 'Report Overview', currentY, margin);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    
    const lines = doc.splitTextToSize(reportData.content, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 10;
  }
  
  // Charts section
  currentY = drawSectionTitle(doc, 'Data Visualizations', currentY, margin);
  
  const chartWidth = (contentWidth - 8) / 2;
  const chartHeight = 65;
  let chartX = margin;
  let chartCount = 0;
  
  // Attendance chart
  if (reportData.charts.attendance && reportData.charts.attendance.length > 0) {
    drawBarChart(
      doc,
      reportData.charts.attendance.map(d => ({ name: d.name, value: d.attendance })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Attendance Analysis',
      { r: 59, g: 130, b: 246 }
    );
    
    chartCount++;
    chartX = margin + chartWidth + 8;
  }
  
  // Grades chart
  if (reportData.charts.grades && reportData.charts.grades.length > 0) {
    drawPieChart(
      doc,
      reportData.charts.grades,
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Grade Distribution'
    );
    
    chartCount++;
    if (chartCount % 2 === 0) {
      chartX = margin;
      currentY += chartHeight + 8;
    } else {
      chartX = margin + chartWidth + 8;
    }
  }
  
  // Performance chart
  if (reportData.charts.performance && reportData.charts.performance.length > 0) {
    if (chartCount % 2 !== 0) {
      chartX = margin;
      currentY += chartHeight + 8;
    }
    
    drawLineChart(
      doc,
      reportData.charts.performance.map(d => ({ label: d.month, value: d.score })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Performance Trend',
      { r: 139, g: 92, b: 246 }
    );
    
    chartCount++;
    chartX = margin + chartWidth + 8;
  }
  
  // Comparison chart
  if (reportData.charts.comparison && reportData.charts.comparison.length > 0) {
    drawBarChart(
      doc,
      reportData.charts.comparison.map(d => ({ name: d.subject, value: d.avg })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Subject Comparison',
      { r: 16, g: 185, b: 129 }
    );
    
    chartCount++;
    if (chartCount % 2 === 0) {
      currentY += chartHeight + 8;
    }
  }
  
  // Adjust Y position after charts
  if (chartCount % 2 !== 0) currentY += chartHeight + 8;
  
  // Student data table
  if (reportData.students && reportData.students.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = drawSectionTitle(doc, 'Student Records', currentY, margin);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Name', 'Email', 'Attendance %', 'Guardian']],
      body: reportData.students.slice(0, 25).map(s => [
        s.name,
        s.email || '-',
        s.attendance !== undefined ? `${s.attendance}%` : '-',
        s.guardian_name || '-',
      ]),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Generated on ${reportData.date}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Bottom border
    doc.setDrawColor(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
    doc.setLineWidth(1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  }
  
  // Save the PDF
  const fileName = `${reportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Generate Single Student Report PDF with all details and visuals
export function generateSingleStudentReportPDF(reportData: SingleStudentReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Draw header
  let currentY = drawHeader(
    doc,
    reportData.title,
    `Generated by: ${reportData.generatedBy} | ${reportData.date}`,
    reportData.institutionName,
    margin
  );
  
  // Student Information Section
  currentY = drawSectionTitle(doc, 'Student Information', currentY, margin);
  
  // Student info cards in 2 columns
  const infoCardWidth = (contentWidth - 6) / 2;
  const infoCardHeight = 18;
  
  const studentInfoItems = [
    { label: 'Student Name', value: reportData.student.name },
    { label: 'Student ID', value: reportData.student.studentId || 'N/A' },
    { label: 'Academic Year', value: reportData.student.year ? `Year ${reportData.student.year}` : 'N/A' },
    { label: 'Attendance', value: `${reportData.student.attendance || 0}%` },
    { label: 'Email', value: reportData.student.email || 'N/A' },
    { label: 'Contact', value: reportData.student.contact ? String(reportData.student.contact) : 'N/A' },
  ];
  
  // Add guardian info if available
  if (reportData.student.guardianName) {
    studentInfoItems.push({ label: 'Guardian Name', value: reportData.student.guardianName });
  }
  if (reportData.student.guardianPhone) {
    studentInfoItems.push({ label: 'Guardian Phone', value: reportData.student.guardianPhone });
  }
  
  studentInfoItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (infoCardWidth + 6);
    const y = currentY + row * (infoCardHeight + 4);
    
    drawInfoCard(doc, item.label, item.value, x, y, infoCardWidth, infoCardHeight, PRIMARY_COLOR);
  });
  
  const infoRows = Math.ceil(studentInfoItems.length / 2);
  currentY += infoRows * (infoCardHeight + 4) + 8;
  
  // Custom fields section
  if (reportData.customFields && reportData.customFields.length > 0) {
    currentY = drawSectionTitle(doc, 'Additional Information', currentY, margin);
    
    reportData.customFields.forEach((field, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (infoCardWidth + 6);
      const y = currentY + row * (infoCardHeight + 4);
      
      drawInfoCard(doc, field.label, field.value, x, y, infoCardWidth, infoCardHeight, ACCENT_COLOR);
    });
    
    const customRows = Math.ceil(reportData.customFields.length / 2);
    currentY += customRows * (infoCardHeight + 4) + 8;
  }
  
  // Description/Notes
  if (reportData.description) {
    currentY = drawSectionTitle(doc, 'Notes & Observations', currentY, margin);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    
    const lines = doc.splitTextToSize(reportData.description, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 10;
  }
  
  // Performance Visualizations Section - Structured like the preview
  if (reportData.selectedCharts.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = drawSectionTitle(doc, 'Performance Visualizations', currentY, margin);
    
    const halfWidth = (contentWidth - 8) / 2;
    const chartHeight = 70;
    
    // Attendance Section: Pie Chart (left) + Monthly Bar Chart (right) - Same as preview
    if (reportData.selectedCharts.includes('attendance_pie')) {
      const attendanceData = [
        { name: 'Present', value: reportData.student.attendance || 0, color: '#22c55e' },
        { name: 'Absent', value: 100 - (reportData.student.attendance || 0), color: '#ef4444' },
      ];
      
      // Draw section background
      doc.setFillColor(248, 250, 252);
      roundedRect(doc, margin, currentY, contentWidth, chartHeight + 10, 4);
      
      // Section title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('Attendance', margin + 8, currentY + 10);
      
      // Pie chart on left - Overall Attendance
      drawPieChart(doc, attendanceData, margin + 4, currentY + 8, halfWidth - 8, chartHeight - 4, 'Overall Attendance');
      
      // Monthly bar chart on right
      if (reportData.monthlyAttendance && reportData.monthlyAttendance.length > 0) {
        drawBarChart(
          doc,
          reportData.monthlyAttendance.map(m => ({ name: m.month, value: m.attendance })),
          margin + halfWidth + 4,
          currentY + 8,
          halfWidth - 4,
          chartHeight - 4,
          'Monthly Attendance',
          SUCCESS_COLOR
        );
      } else {
        // Show empty state for monthly if no data
        doc.setFillColor(248, 250, 252);
        roundedRect(doc, margin + halfWidth + 4, currentY + 8, halfWidth - 4, chartHeight - 4, 4);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text('No monthly data', margin + halfWidth + (halfWidth / 2), currentY + chartHeight / 2 + 8, { align: 'center' });
      }
      
      currentY += chartHeight + 18;
    }
    
    // Subject Marks Section - Full width bar chart like preview
    if (reportData.selectedCharts.includes('marks_bar') && reportData.subjectMarks && reportData.subjectMarks.length > 0) {
      // Check page break
      if (currentY > pageHeight - 90) {
        doc.addPage();
        currentY = 20;
      }
      
      // Draw section background
      doc.setFillColor(248, 250, 252);
      roundedRect(doc, margin, currentY, contentWidth, chartHeight + 10, 4);
      
      // Section title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('Subject Marks', margin + 8, currentY + 10);
      
      drawBarChart(
        doc,
        reportData.subjectMarks.map(s => ({ name: s.subject, value: s.marks })),
        margin + 4,
        currentY + 8,
        contentWidth - 8,
        chartHeight - 4,
        '',
        { r: 59, g: 130, b: 246 }
      );
      
      currentY += chartHeight + 18;
    }
    
    // Progress Trend Section - Full width line chart like preview
    if (reportData.selectedCharts.includes('progress_line') && reportData.progressData && reportData.progressData.length > 0) {
      // Check page break
      if (currentY > pageHeight - 90) {
        doc.addPage();
        currentY = 20;
      }
      
      // Draw section background
      doc.setFillColor(248, 250, 252);
      roundedRect(doc, margin, currentY, contentWidth, chartHeight + 10, 4);
      
      // Section title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('Progress Trend', margin + 8, currentY + 10);
      
      drawLineChart(
        doc,
        reportData.progressData.map(d => ({ label: d.month, value: d.score })),
        margin + 4,
        currentY + 8,
        contentWidth - 8,
        chartHeight - 4,
        '',
        { r: 139, g: 92, b: 246 }
      );
      
      currentY += chartHeight + 18;
    }
  }
  
  // Subject Marks Table
  if (reportData.subjectMarks && reportData.subjectMarks.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = drawSectionTitle(doc, 'Subject-wise Performance', currentY, margin);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Subject', 'Marks Obtained', 'Out Of', 'Percentage', 'Grade', 'Remarks']],
      body: reportData.subjectMarks.map(s => {
        const percentage = Math.round((s.marks / s.outOf) * 100);
        let grade = 'F';
        let remarks = 'Needs Improvement';
        if (percentage >= 90) { grade = 'A+'; remarks = 'Excellent'; }
        else if (percentage >= 80) { grade = 'A'; remarks = 'Very Good'; }
        else if (percentage >= 70) { grade = 'B+'; remarks = 'Good'; }
        else if (percentage >= 60) { grade = 'B'; remarks = 'Satisfactory'; }
        else if (percentage >= 50) { grade = 'C'; remarks = 'Average'; }
        else if (percentage >= 40) { grade = 'D'; remarks = 'Below Average'; }
        
        return [s.subject, String(s.marks), String(s.outOf), `${percentage}%`, grade, remarks];
      }),
      foot: [(() => {
        const totalMarks = reportData.subjectMarks!.reduce((sum, s) => sum + s.marks, 0);
        const totalOutOf = reportData.subjectMarks!.reduce((sum, s) => sum + s.outOf, 0);
        const avgPercentage = Math.round((totalMarks / totalOutOf) * 100);
        const highestPercentage = Math.max(...reportData.subjectMarks!.map(s => Math.round((s.marks / s.outOf) * 100)));
        const lowestPercentage = Math.min(...reportData.subjectMarks!.map(s => Math.round((s.marks / s.outOf) * 100)));
        return ['Total', String(totalMarks), String(totalOutOf), `${avgPercentage}%`, `High: ${highestPercentage}%`, `Low: ${lowestPercentage}%`];
      })()],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Student Report: ${reportData.student.name} | ${reportData.date}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Bottom border
    doc.setDrawColor(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
    doc.setLineWidth(1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  }
  
  // Save the PDF
  const fileName = `student_report_${reportData.student.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
