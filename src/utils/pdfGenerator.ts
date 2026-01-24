import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  content?: string;
  generatedBy: string;
  department?: string;
  date: string;
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

// Draw a bar chart
function drawBarChart(
  doc: jsPDF,
  data: { name: string; value: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  color: string = '#3b82f6'
) {
  const padding = 10;
  const chartHeight = height - 40;
  const chartWidth = width - padding * 2;
  
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
    
    // Bar
    doc.setFillColor(color);
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
    const label = item.name.length > 6 ? item.name.substring(0, 6) : item.name;
    doc.text(label, barX + barWidth / 2, y + height - 5, { align: 'center' });
  });
}

// Draw a pie chart
function drawPieChart(
  doc: jsPDF,
  data: { name: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2 + 5;
  const radius = Math.min(width, height) / 2 - 25;
  
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
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = -Math.PI / 2;
  
  // Draw slices
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Convert hex color to RGB
    const hex = item.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 100;
    const g = parseInt(hex.substring(2, 4), 16) || 100;
    const b = parseInt(hex.substring(4, 6), 16) || 100;
    
    doc.setFillColor(r, g, b);
    
    // Draw pie slice using lines
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    
    const points: [number, number][] = [[centerX, centerY]];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sliceAngle * i) / steps;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle),
      ]);
    }
    
    // Draw the slice
    doc.setFillColor(r, g, b);
    const path = points.map((p, i) => (i === 0 ? `${p[0]} ${p[1]} m` : `${p[0]} ${p[1]} l`)).join(' ');
    
    // Simple approximation using triangles
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(
        centerX, centerY,
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        'F'
      );
    }
    
    startAngle = endAngle;
  });
  
  // Draw legend
  let legendY = y + height - 18;
  const legendX = x + 5;
  doc.setFontSize(6);
  data.slice(0, 5).forEach((item, i) => {
    const hex = item.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 100;
    const g = parseInt(hex.substring(2, 4), 16) || 100;
    const b = parseInt(hex.substring(4, 6), 16) || 100;
    
    doc.setFillColor(r, g, b);
    doc.rect(legendX + i * 35, legendY, 4, 4, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text(`${item.name}`, legendX + i * 35 + 6, legendY + 3.5);
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
  color: string = '#8b5cf6'
) {
  const padding = 15;
  const chartHeight = height - 45;
  const chartWidth = width - padding * 2;
  
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
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const stepX = chartWidth / (data.length - 1 || 1);
  
  // Grid lines
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gridY = y + 25 + (chartHeight * i) / 4;
    doc.line(x + padding, gridY, x + width - padding, gridY);
  }
  
  // Draw line
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(1.5);
  
  const points: [number, number][] = data.map((item, i) => [
    x + padding + i * stepX,
    y + 25 + chartHeight - ((item.value - minValue) / range) * chartHeight,
  ]);
  
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  
  // Draw points
  doc.setFillColor(r, g, b);
  points.forEach((point, i) => {
    doc.circle(point[0], point[1], 2, 'F');
    
    // Labels
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(data[i].label, point[0], y + height - 5, { align: 'center' });
  });
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
  
  // Header background
  doc.setFillColor(37, 99, 235); // Primary blue
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.title, margin, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by: ${reportData.generatedBy}`, margin, 32);
  doc.text(`Date: ${reportData.date}`, margin, 38);
  
  if (reportData.department) {
    doc.text(`Department: ${reportData.department}`, pageWidth - margin, 32, { align: 'right' });
  }
  
  let currentY = 55;
  
  // Summary section
  if (reportData.summary) {
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, currentY);
    currentY += 8;
    
    const summaryBoxWidth = (contentWidth - 10) / 4;
    const summaryItems = [
      { label: 'Total Students', value: String(reportData.summary.totalStudents), color: '#3b82f6' },
      { label: 'Avg Attendance', value: `${reportData.summary.avgAttendance.toFixed(1)}%`, color: '#10b981' },
      { label: 'High Performers', value: String(reportData.summary.highPerformers), color: '#8b5cf6' },
      { label: 'Low Attendance', value: String(reportData.summary.lowAttendance), color: '#ef4444' },
    ];
    
    summaryItems.forEach((item, i) => {
      const boxX = margin + i * (summaryBoxWidth + 3);
      
      // Box background
      doc.setFillColor(248, 250, 252);
      roundedRect(doc, boxX, currentY, summaryBoxWidth, 22, 3);
      
      // Value
      const hex = item.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setTextColor(r, g, b);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, boxX + summaryBoxWidth / 2, currentY + 10, { align: 'center' });
      
      // Label
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, boxX + summaryBoxWidth / 2, currentY + 17, { align: 'center' });
    });
    
    currentY += 30;
  }
  
  // Description
  if (reportData.content) {
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Overview', margin, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    const lines = doc.splitTextToSize(reportData.content, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 8;
  }
  
  // Charts section
  const chartWidth = (contentWidth - 5) / 2;
  const chartHeight = 55;
  let chartX = margin;
  let chartCount = 0;
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Visualizations', margin, currentY);
  currentY += 8;
  
  // Attendance chart
  if (reportData.charts.attendance && reportData.charts.attendance.length > 0) {
    doc.setFillColor(248, 250, 252);
    roundedRect(doc, chartX, currentY, chartWidth, chartHeight, 3);
    
    drawBarChart(
      doc,
      reportData.charts.attendance.map(d => ({ name: d.name, value: d.attendance })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Attendance Analysis',
      '#3b82f6'
    );
    
    chartCount++;
    chartX = chartCount % 2 === 0 ? margin : margin + chartWidth + 5;
    if (chartCount % 2 === 0) currentY += chartHeight + 5;
  }
  
  // Grades chart
  if (reportData.charts.grades && reportData.charts.grades.length > 0) {
    doc.setFillColor(248, 250, 252);
    roundedRect(doc, chartX, currentY, chartWidth, chartHeight, 3);
    
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
    chartX = chartCount % 2 === 0 ? margin : margin + chartWidth + 5;
    if (chartCount % 2 === 0) currentY += chartHeight + 5;
  }
  
  // Performance chart
  if (reportData.charts.performance && reportData.charts.performance.length > 0) {
    if (chartCount % 2 !== 0) {
      chartX = margin;
      currentY += chartHeight + 5;
    }
    
    doc.setFillColor(248, 250, 252);
    roundedRect(doc, chartX, currentY, chartWidth, chartHeight, 3);
    
    drawLineChart(
      doc,
      reportData.charts.performance.map(d => ({ label: d.month, value: d.score })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Performance Trend',
      '#8b5cf6'
    );
    
    chartCount++;
    chartX = chartCount % 2 === 0 ? margin : margin + chartWidth + 5;
    if (chartCount % 2 === 0) currentY += chartHeight + 5;
  }
  
  // Comparison chart
  if (reportData.charts.comparison && reportData.charts.comparison.length > 0) {
    doc.setFillColor(248, 250, 252);
    roundedRect(doc, chartX, currentY, chartWidth, chartHeight, 3);
    
    drawBarChart(
      doc,
      reportData.charts.comparison.map(d => ({ name: d.subject, value: d.avg })),
      chartX,
      currentY,
      chartWidth,
      chartHeight,
      'Subject Comparison',
      '#10b981'
    );
    
    chartCount++;
    if (chartCount % 2 === 0) currentY += chartHeight + 5;
  }
  
  // Adjust Y position after charts
  if (chartCount % 2 !== 0) currentY += chartHeight + 5;
  
  // Student data table
  if (reportData.students && reportData.students.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Records', margin, currentY);
    currentY += 5;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Name', 'Email', 'Attendance %', 'Guardian']],
      body: reportData.students.slice(0, 20).map(s => [
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
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }
  
  // Footer
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
  }
  
  // Save the PDF
  const fileName = `${reportData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
