import { jsPDF } from 'jspdf';

interface ApplicationData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  employment: string;
  position: string;
  degrees: string;
  honors: string;
  organizations: string;
  priorKnowledge: string;
  essay1: string;
  essay2: string;
  essay3: string;
  essay4: string;
  essay5: string;
  isFraternityMember: string;
  fraternityDetails: string;
  hasAkaFamily: string;
  akaFamilyDetails: string;
  previousApplied: string;
  previousAppliedDetails: string;
  socialUrls: string;
}

export function generateApplicationPDF(data: ApplicationData, email: string) {
  // Create a new PDF document in Letter size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageHeight = 792;
  const pageWidth = 612;
  const margin = 45;
  const contentWidth = pageWidth - (margin * 2); // 522 pt
  let y = 50;

  // Primary colors
  const rIvy = 20;
  const gIvy = 59;
  const bIvy = 43;

  const rGold = 197;
  const gGold = 160;
  const bGold = 89;

  const rCharcoal = 51;
  const gCharcoal = 51;
  const bCharcoal = 51;

  // Helper: check page overflow and add footer/header on new page
  function checkOverflow(neededHeight: number): number {
    if (y + neededHeight > pageHeight - margin - 20) {
      // Draw footer before adding a new page
      drawFooter();
      doc.addPage();
      y = margin + 35; // reset y for the new page
      drawHeaderOnLaterPages();
    }
    return y;
  }

  // Draw header on the first page
  function drawFirstPageHeader() {
    // Top colored bars
    doc.setFillColor(rIvy, gIvy, bIvy);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFillColor(rGold, gGold, bGold);
    doc.rect(0, 15, pageWidth, 5, 'F');

    y = 45;
    // Main Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(rIvy, gIvy, bIvy);
    doc.text('KAPPA PI FRATERNITY', pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Subtitle
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(rGold, gGold, bGold);
    doc.text('NATIONAL MEMBERSHIP APPLICATION PORTFOLIO', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Intake class metadata
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('FY27 INTAKE CLASS — OFFICIAL SUBMISSION', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Divider
    doc.setDrawColor(rGold, gGold, bGold);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 25;
  }

  // Header on subsequent pages
  function drawHeaderOnLaterPages() {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(rIvy, gIvy, bIvy);
    doc.text('KAPPA PI FRATERNITY — MEMBERSHIP APPLICATION PORTFOLIO', margin, margin - 15);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Candidate: ${data.firstName} ${data.lastName}`, pageWidth - margin, margin - 15, { align: 'right' });

    doc.setDrawColor(rGold, gGold, bGold);
    doc.setLineWidth(0.5);
    doc.line(margin, margin - 10, pageWidth - margin, margin - 10);
  }

  // Draw Footer on all pages
  function drawFooter() {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Left: timestamp
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    doc.text(`Generated on ${dateStr}`, margin, pageHeight - margin + 15);
    
    // Center: Confidentiality notice
    doc.text('STRICTLY CONFIDENTIAL — COMMITTEE USE ONLY', pageWidth / 2, pageHeight - margin + 15, { align: 'center' });
    
    // Right: Page number
    doc.text(`Page ${pageCount}`, pageWidth - margin, pageHeight - margin + 15, { align: 'right' });
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - margin + 5, pageWidth - margin, pageHeight - margin + 5);
  }

  // Section heading drawer
  function drawSectionHeader(title: string) {
    y = checkOverflow(45);
    
    // Background bar
    doc.setFillColor(rIvy, gIvy, bIvy);
    doc.rect(margin, y, contentWidth, 22, 'F');
    
    // Accent gold tab on the left
    doc.setFillColor(rGold, gGold, bGold);
    doc.rect(margin, y, 6, 22, 'F');

    // Section title text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 15, y + 14);
    
    y += 32;
  }

  // Field Drawer (2-column layout helper)
  function drawField(label: string, value: string, xPos: number, width: number) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(rIvy, gIvy, bIvy);
    doc.text(label.toUpperCase(), xPos, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(rCharcoal, gCharcoal, bCharcoal);
    
    const textVal = value || 'Not provided';
    const lines = doc.splitTextToSize(textVal, width);
    
    let textY = y + 14;
    for (const line of lines) {
      doc.text(line, xPos, textY);
      textY += 13;
    }
    
    return textY;
  }

  // Rich Paragraph / Essay Drawer
  function drawEssay(question: string, answer: string) {
    y = checkOverflow(60);

    // Question label
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(rIvy, gIvy, bIvy);
    const qLines = doc.splitTextToSize(question, contentWidth);
    for (const line of qLines) {
      y = checkOverflow(15);
      doc.text(line, margin, y);
      y += 14;
    }

    y = checkOverflow(20);
    // Left visual margin border in gold
    const answerStartY = y - 4;
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(rCharcoal, gCharcoal, bCharcoal);
    
    const ansText = answer || 'Not provided';
    const ansLines = doc.splitTextToSize(ansText, contentWidth - 15);
    
    for (const line of ansLines) {
      y = checkOverflow(15);
      doc.text(line, margin + 15, y);
      y += 13.5;
    }

    const answerEndY = y - 6;
    doc.setDrawColor(rGold, gGold, bGold);
    doc.setLineWidth(1.5);
    doc.line(margin + 4, answerStartY, margin + 4, answerEndY);

    y += 18;
  }

  // Initialize page and draw elements
  drawFirstPageHeader();

  // --- 1. PERSONAL INFORMATION ---
  drawSectionHeader('Personal Information');
  
  y = checkOverflow(35);
  const col1X = margin;
  const col2X = margin + 180;
  const col3X = margin + 360;
  const colWidth = 160;

  const yFirstRowEnd1 = drawField('First Name', data.firstName, col1X, colWidth);
  const yFirstRowEnd2 = drawField('Middle Name', data.middleName, col2X, colWidth);
  const yFirstRowEnd3 = drawField('Last Name', data.lastName, col3X, colWidth);
  y = Math.max(yFirstRowEnd1, yFirstRowEnd2, yFirstRowEnd3) + 12;

  y = checkOverflow(35);
  const ySecondRowEnd1 = drawField('Date of Birth', data.dateOfBirth, col1X, colWidth);
  const ySecondRowEnd2 = drawField('Phone Number', data.phone, col2X, colWidth);
  const ySecondRowEnd3 = drawField('Email Address', email, col3X, colWidth);
  y = Math.max(ySecondRowEnd1, ySecondRowEnd2, ySecondRowEnd3) + 12;

  y = checkOverflow(45);
  y = drawField('Permanent Address / City / State / Zip', data.address, col1X, contentWidth) + 18;

  // --- 2. PROFESSIONAL & ACADEMIC PROFILE ---
  drawSectionHeader('Professional & Academic Profile');

  y = checkOverflow(35);
  const yProfRowEnd1 = drawField('Place of Employment', data.employment, col1X, contentWidth / 2 - 10);
  const yProfRowEnd2 = drawField('Position / Title', data.position, margin + (contentWidth / 2) + 10, contentWidth / 2 - 10);
  y = Math.max(yProfRowEnd1, yProfRowEnd2) + 15;

  y = checkOverflow(45);
  y = drawField('Degrees Earned, Dates, and Institutions', data.degrees, col1X, contentWidth) + 15;

  y = checkOverflow(45);
  y = drawField('Academic Honors & Achievements', data.honors, col1X, contentWidth) + 20;

  // --- 3. COMMUNITY INVOLVEMENT & BACKGROUND ---
  drawSectionHeader('Community & Organization Profile');

  y = checkOverflow(45);
  y = drawField('Current and Past Organization Involvements', data.organizations, col1X, contentWidth) + 15;

  y = checkOverflow(45);
  y = drawField('Prior Knowledge of Kappa Pi Fraternity', data.priorKnowledge, col1X, contentWidth) + 20;

  // --- 4. ADDITIONAL DISCLOSURES & SOCIALS ---
  drawSectionHeader('Disclosures & Presence');

  y = checkOverflow(35);
  const yDiscRow1_1 = drawField('Fraternity Member?', data.isFraternityMember, col1X, colWidth);
  const yDiscRow1_2 = drawField('Fraternity Details', data.fraternityDetails, col2X, contentWidth - colWidth - 20);
  y = Math.max(yDiscRow1_1, yDiscRow1_2) + 15;

  y = checkOverflow(35);
  const yDiscRow2_1 = drawField('Sorority AKA Family?', data.hasAkaFamily, col1X, colWidth);
  const yDiscRow2_2 = drawField('Sorority AKA Family Details', data.akaFamilyDetails, col2X, contentWidth - colWidth - 20);
  y = Math.max(yDiscRow2_1, yDiscRow2_2) + 15;

  y = checkOverflow(35);
  const yDiscRow3_1 = drawField('Previously Applied/Pledged?', data.previousApplied, col1X, colWidth);
  const yDiscRow3_2 = drawField('Previous Discontinue Explanation', data.previousAppliedDetails, col2X, contentWidth - colWidth - 20);
  y = Math.max(yDiscRow3_1, yDiscRow3_2) + 15;

  y = checkOverflow(45);
  y = drawField('Social Media & Professional Website URLs', data.socialUrls, col1X, contentWidth) + 20;

  // --- 5. WRITTEN ESSAY ANSWERS ---
  drawSectionHeader('Written Application Questions');

  drawEssay(
    'Question 1: In your own words, describe the purpose of Kappa Pi and how it aligns with your personal journey.',
    data.essay1
  );

  drawEssay(
    'Question 2: How have you served as a role model or advocate for young people in your community? Give a specific example.',
    data.essay2
  );

  drawEssay(
    'Question 3: How have you actively participated in community service projects that address local or societal issues?',
    data.essay3
  );

  drawEssay(
    'Question 4: What have you done to encourage positive self-esteem and involvement among Black and Brown Queer & Trans Communities?',
    data.essay4
  );

  drawEssay(
    'Question 5: What unique talents, experiences, and professional skills do you possess to contribute to Kappa Pi’s premier status?',
    data.essay5
  );

  // Draw final page's footer
  drawFooter();

  // Save the generated PDF
  const filename = `Kappa_Pi_Application_${data.firstName}_${data.lastName}.pdf`;
  doc.save(filename);
}
