import jsPDF from 'jspdf';

type LabSettings = {
  lab_name: string;
  lab_logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

type SampleData = {
  sample_code: string;
  sample_type: string;
  source: string;
  collection_date?: string;
  received_date?: string;
  status?: string;
  client?: any;
  test_result?: any;
  analyst?: any;
};

type PDFOptions = {
  download?: boolean;
  print?: boolean;
  reportType?: string;
  customData?: any;
};

export const generatePDFReport = async (
  sampleData: SampleData,
  labSettings: LabSettings,
  options: PDFOptions = {}
): Promise<void> => {
  const { download = true, print = false, reportType = 'meat', customData } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(labSettings.lab_name, pageWidth / 2, 20, { align: 'center' });

  if (labSettings.address) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(labSettings.address, pageWidth / 2, 26, { align: 'center' });
  }

  if (labSettings.phone || labSettings.email) {
    let contactInfo = '';
    if (labSettings.phone) contactInfo += `Tel: ${labSettings.phone}`;
    if (labSettings.phone && labSettings.email) contactInfo += ' | ';
    if (labSettings.email) contactInfo += `Email: ${labSettings.email}`;
    doc.text(contactInfo, pageWidth / 2, 32, { align: 'center' });
  }

  doc.setLineWidth(0.5);
  doc.line(margin, 38, pageWidth - margin, 38);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const reportTitle = getReportTitle(reportType);
  doc.text(reportTitle, pageWidth / 2, 46, { align: 'center' });

  let yPosition = 55;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Sample Information:', margin, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Sample Code: ${sampleData.sample_code}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Sample Type: ${sampleData.sample_type}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Source/Supplier: ${sampleData.source}`, margin, yPosition);
  yPosition += 5;

  if (sampleData.collection_date) {
    doc.text(`Collection Date: ${new Date(sampleData.collection_date).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }

  if (sampleData.received_date) {
    doc.text(`Received Date: ${new Date(sampleData.received_date).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }

  if (sampleData.status) {
    doc.text(`Status: ${sampleData.status.toUpperCase()}`, margin, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  if (customData) {
    renderCustomData(doc, customData, margin, yPosition, contentWidth, reportType);
  } else if (sampleData.test_result) {
    renderTestResults(doc, sampleData.test_result, margin, yPosition, contentWidth);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('No test results available', margin, yPosition);
  }

  const footerY = pageHeight - 20;
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const analystName = sampleData.analyst?.full_name || 'Lab Analyst';
  doc.text(`Analyzed by: ${analystName}`, margin, footerY + 5);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, footerY + 5, { align: 'right' });

  if (download) {
    const filename = `Report_${sampleData.sample_code}_${Date.now()}.pdf`;
    doc.save(filename);
  }

  if (print) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};

function getReportTitle(reportType: string): string {
  const titles: Record<string, string> = {
    meat: 'MICROBIOLOGICAL ANALYSIS REPORT - MEAT',
    air: 'AIR QUALITY MONITORING REPORT',
    water: 'WATER QUALITY ANALYSIS REPORT',
    foodhandler: 'FOOD HANDLER HYGIENE TEST REPORT',
    foodsurface: 'FOOD SURFACE HYGIENE TEST REPORT',
    deboning: 'DEBONING AREA HYGIENE TEST REPORT',
  };
  return titles[reportType] || 'LABORATORY TEST REPORT';
}

function renderTestResults(
  doc: jsPDF,
  testResult: any,
  x: number,
  y: number,
  width: number
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Test Results:', x, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const results = [
    { label: 'TPC (cfu/g)', value: testResult.tpc },
    { label: 'S. aureus (cfu/g)', value: testResult.s_aureus },
    { label: 'Coliforms', value: testResult.coliforms },
    { label: 'E. coli O157:H7', value: testResult.ecoli_o157 },
    { label: 'Salmonella', value: testResult.salmonella },
  ];

  const colWidth = width / 2;
  let col = 0;

  results.forEach((result) => {
    if (result.value !== undefined && result.value !== null) {
      const xPos = x + col * colWidth;
      doc.text(`${result.label}: ${result.value}`, xPos, y);
      col++;
      if (col >= 2) {
        col = 0;
        y += 5;
      }
    }
  });

  if (col > 0) y += 5;

  if (testResult.comments) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Comments:', x, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(testResult.comments, width);
    doc.text(lines, x, y);
  }
}

function renderCustomData(
  doc: jsPDF,
  customData: any,
  x: number,
  y: number,
  width: number,
  reportType: string
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  if (reportType === 'air' && customData.departments) {
    doc.text('Air Quality Measurements:', x, y);
    y += 7;

    doc.setFontSize(8);
    const headers = ['S.No', 'Department', 'Plate 1', 'Plate 2', 'Plate 3'];
    const colWidths = [15, 60, 25, 25, 25];
    let xPos = x;

    headers.forEach((header, i) => {
      doc.text(header, xPos, y);
      xPos += colWidths[i];
    });
    y += 5;

    doc.setFont('helvetica', 'normal');
    customData.departments.forEach((dept: any) => {
      xPos = x;
      const values = [dept.sNo, dept.name, dept.plate1, dept.plate2, dept.plate3];
      values.forEach((value, i) => {
        doc.text(String(value), xPos, y);
        xPos += colWidths[i];
      });
      y += 5;
    });

    if (customData.remarks) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Remarks:', x, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(customData.remarks, x, y);
    }
  } else if (reportType === 'water' && customData.samplingPoints) {
    doc.text('Water Quality Parameters:', x, y);
    y += 7;

    doc.setFontSize(7);
    customData.samplingPoints.forEach((point: any, index: number) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${point.location}`, x, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.text(`Color: ${point.color} | Odor: ${point.odor} | Clarity: ${point.clarity}`, x + 5, y);
      y += 4;
      doc.text(`pH: ${point.ph} | TDS: ${point.tds} ppm | APC: ${point.apc} cfu/ml`, x + 5, y);
      y += 4;
      doc.text(`Total Coliform: ${point.totalColiform} | Faecal Coliform: ${point.faecalColiform}`, x + 5, y);
      y += 6;
    });

    if (customData.remarks) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Remarks:', x, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(customData.remarks, x, y);
    }
  } else if ((reportType === 'foodhandler' || reportType === 'deboning') && customData.workers) {
    doc.text('Worker Hygiene Test Results:', x, y);
    y += 7;

    doc.setFontSize(8);
    const headers = ['S.No', 'Area', 'Name', 'APC', 'Coliform'];
    const colWidths = [15, 50, 40, 25, 25];
    let xPos = x;

    headers.forEach((header, i) => {
      doc.text(header, xPos, y);
      xPos += colWidths[i];
    });
    y += 5;

    doc.setFont('helvetica', 'normal');
    customData.workers.forEach((worker: any) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      xPos = x;
      const values = [worker.sNo, worker.area, worker.name, worker.apc, worker.coliform];
      values.forEach((value, i) => {
        const text = String(value || '');
        if (colWidths[i] < 30) {
          doc.text(text, xPos, y);
        } else {
          const lines = doc.splitTextToSize(text, colWidths[i] - 2);
          doc.text(lines[0] || '', xPos, y);
        }
        xPos += colWidths[i];
      });
      y += 5;
    });
  } else if (reportType === 'foodsurface' && customData.surfaces) {
    doc.text('Surface Hygiene Test Results:', x, y);
    y += 7;

    doc.setFontSize(8);
    const headers = ['S.No', 'Area/Location', 'APC', 'Coliform'];
    const colWidths = [15, 90, 25, 25];
    let xPos = x;

    headers.forEach((header, i) => {
      doc.text(header, xPos, y);
      xPos += colWidths[i];
    });
    y += 5;

    doc.setFont('helvetica', 'normal');
    customData.surfaces.forEach((surface: any) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      xPos = x;
      const values = [surface.sNo, surface.area, surface.apc, surface.coliform];
      values.forEach((value, i) => {
        const text = String(value || '');
        if (colWidths[i] < 50) {
          doc.text(text, xPos, y);
        } else {
          const lines = doc.splitTextToSize(text, colWidths[i] - 2);
          doc.text(lines[0] || '', xPos, y);
        }
        xPos += colWidths[i];
      });
      y += 5;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('Custom test data included in report', x, y);
  }
}
