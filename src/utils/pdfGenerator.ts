import jsPDF from 'jspdf';

type SampleData = {
  sample_code: string;
  sample_type: string;
  source: string;
  collection_date: string;
  received_date: string;
  status: string;
  client: {
    name: string;
    company: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  test_result?: {
    tpc: number | null;
    coliforms: string | null;
    ecoli_o157: string | null;
    salmonella: string | null;
    ph: number | null;
    tds: number | null;
    remarks: string | null;
    tested_at: string;
  } | null;
  analyst?: {
    full_name: string;
  } | null;
};

type LabSettings = {
  lab_name: string;
  lab_logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export const generatePDFReport = async (
  sample: SampleData,
  labSettings: LabSettings,
  options: { download?: boolean; print?: boolean; reportType?: string; customData?: any } = { download: true, print: false }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setDrawColor(139, 69, 19);
  doc.setLineWidth(1);
  doc.line(margin, margin, pageWidth - margin, margin);

  let yPos = margin + 8;

  try {
    const logoPath = '/logo png.png';
    const response = await fetch(logoPath);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const logoSize = 25;
    const logoX = margin + 3;
    doc.addImage(base64, 'PNG', logoX, yPos, logoSize, logoSize);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('THE ORGANIC MEAT COMPANY LTD', logoX + logoSize + 6, yPos + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Survey # 310, Deh Shah Mureed, Gadap, Karachi, Pakistan', pageWidth / 2, yPos + 16, { align: 'center' });

    yPos += logoSize + 5;
  } catch (error) {
    console.error('Logo load error:', error);
    const logoSize = 25;
    const logoX = margin + 3;

    doc.setFillColor(139, 69, 19);
    doc.circle(logoX + logoSize / 2, yPos + logoSize / 2, logoSize / 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OM', logoX + logoSize / 2, yPos + logoSize / 2 + 3, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('THE ORGANIC MEAT COMPANY LTD', logoX + logoSize + 6, yPos + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Survey # 310, Deh Shah Mureed, Gadap, Karachi, Pakistan', pageWidth / 2, yPos + 16, { align: 'center' });

    yPos += logoSize + 5;
  }

  yPos += 5;
  doc.setDrawColor(139, 69, 19);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('LABORATORY TEST REPORT', pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('SAMPLE INFORMATION', margin + 3, yPos + 5.5);

  yPos += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const col1X = margin + 3;
  const col2X = pageWidth / 2 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Sample Type:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sample.sample_type, col1X + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Sample Code:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sample.sample_code, col2X + 35, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Collection Date:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(sample.collection_date).toLocaleDateString('en-GB'), col1X + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Report Date:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(sample.received_date).toLocaleDateString('en-GB'), col2X + 35, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Supplier:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sample.client.name, col1X + 35, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sample.status.toUpperCase(), col2X + 35, yPos);

  yPos += 10;
  doc.setFillColor(139, 69, 19);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TEST RESULTS', margin + 3, yPos + 5.5);

  yPos += 12;
  doc.setTextColor(33, 33, 33);

  if (sample.test_result || options.customData) {
    const results = sample.test_result;
    const reportType = options.reportType || 'meat';

    let testData: any[] = [];

    if (reportType === 'meat' && results) {
      testData = [
        {
          test: 'Total Plate Count (TPC)',
          method: 'FDA BAM Ch.3',
          value: results.tpc ? `${results.tpc} CFU/g` : 'Not Tested',
          limit: '<100000',
          status: results.tpc !== null && results.tpc !== undefined ? (results.tpc <= 100000 ? 'Pass' : 'Fail') : '-'
        },
        {
          test: 'Total Coliforms',
          method: 'FDA BAM Ch.4',
          value: results.coliforms ? results.coliforms.toUpperCase() : 'Not Tested',
          limit: '<1000',
          status: results.coliforms ? ((results.coliforms.toLowerCase() === 'nil' || results.coliforms.toLowerCase() === 'negative') ? 'Pass' : 'Fail') : '-'
        },
        {
          test: 'Staphylococcus aureus',
          method: 'FDA BAM Ch.12',
          value: results.s_aureus ? `${results.s_aureus} CFU/g` : 'Not Tested',
          limit: '<3 - 100',
          status: results.s_aureus ? (parseInt(results.s_aureus) <= 100 ? 'Pass' : 'Fail') : '-'
        },
        {
          test: 'E. coli O157:H7',
          method: 'FDA BAM Ch.4A',
          value: results.ecoli_o157 ? results.ecoli_o157.toUpperCase() : 'Not Tested',
          limit: 'Nil',
          status: results.ecoli_o157 ? ((results.ecoli_o157.toLowerCase() === 'nil' || results.ecoli_o157.toLowerCase() === 'negative' || results.ecoli_o157.toLowerCase() === 'not detected') ? 'Pass' : 'Fail') : '-'
        },
        {
          test: 'Salmonella spp.',
          method: 'FDA BAM Ch.5',
          value: results.salmonella ? results.salmonella.toUpperCase() : 'Not Tested',
          limit: 'Nil',
          status: results.salmonella ? ((results.salmonella.toLowerCase() === 'nil' || results.salmonella.toLowerCase() === 'negative' || results.salmonella.toLowerCase() === 'not detected') ? 'Pass' : 'Fail') : '-'
        },
      ];
    } else if (reportType === 'air' && options.customData) {
      const data = options.customData;
      testData = [];

      data.departments.forEach((dept: any) => {
        const avg = Math.round((parseInt(dept.plate1 || 0) + parseInt(dept.plate2 || 0) + parseInt(dept.plate3 || 0)) / 3);
        testData.push({
          test: `Air Sample (${dept.name}) - Total Plate Count (TPC)`,
          method: 'FDA BAM Ch.3',
          value: `${avg} CFU/plate`,
          limit: '<25 CFU/plate',
          status: avg < 25 ? 'Pass' : 'Fail'
        });
      });

      testData.push({
        test: 'Air Sample (All Areas) - Total Coliforms',
        method: 'FDA BAM Ch.4',
        value: 'Nil',
        limit: 'Nil',
        status: 'Pass'
      });
    } else if (reportType === 'water' && options.customData) {
      const data = options.customData;
      testData = [];

      data.samplingPoints.forEach((point: any) => {
        testData.push({
          test: `Water (${point.location}) - Total Plate Count (TPC)`,
          method: 'FDA BAM Ch.3',
          value: point.location,
          limit: `${point.apc} CFU/mL`,
          status: parseInt(point.apc || 0) < 100 ? 'Pass' : 'Fail'
        });
      });

      testData.push({
        test: 'Water (All Points) - Total Coliforms',
        method: 'FDA BAM Ch.4',
        value: 'All Sampling Points',
        limit: 'Nil',
        status: 'Pass'
      });
    } else if (reportType === 'foodhandler' && options.customData) {
      const data = options.customData;
      testData = [];

      data.workers.forEach((worker: any) => {
        testData.push({
          test: 'Total Plate Count (TPC)',
          method: 'FDA BAM Ch.3',
          value: `${worker.name} (${worker.area})`,
          limit: `${worker.apc} CFU/glove`,
          status: parseInt(worker.apc || 0) < 100 ? 'Pass' : 'Fail'
        });
      });

      data.workers.forEach((worker: any) => {
        testData.push({
          test: 'Total Coliforms',
          method: 'FDA BAM Ch.4',
          value: `${worker.name} (${worker.area})`,
          limit: worker.coliform || 'Nil',
          status: (worker.coliform || '').toLowerCase() === 'nil' || (worker.coliform || '').toLowerCase() === 'negative' ? 'Pass' : 'Fail'
        });
      });
    } else if (reportType === 'foodsurface' && options.customData) {
      const data = options.customData;
      testData = [];

      data.surfaces.forEach((surface: any) => {
        testData.push({
          test: 'Total Plate Count (TPC)',
          method: 'FDA BAM Ch.3',
          value: surface.area,
          limit: `${surface.apc} CFU/swab`,
          status: parseInt(surface.apc || 0) < 100 ? 'Pass' : 'Fail'
        });
      });

      data.surfaces.forEach((surface: any) => {
        testData.push({
          test: 'Total Coliforms',
          method: 'FDA BAM Ch.4',
          value: surface.area,
          limit: surface.coliform || 'Nil',
          status: (surface.coliform || '').toLowerCase() === 'nil' || (surface.coliform || '').toLowerCase() === 'negative' ? 'Pass' : 'Fail'
        });
      });
    } else if (reportType === 'deboning' && options.customData) {
      const data = options.customData;
      testData = [];

      data.workers.forEach((worker: any) => {
        const apcStatus = parseInt(worker.apc || 0) < 100 ? 'Pass' : 'Fail';
        const coliformStatus = (worker.coliform || '').toLowerCase() === 'nil' || (worker.coliform || '').toLowerCase() === 'negative' ? 'Pass' : 'Fail';
        const overallStatus = apcStatus === 'Pass' && coliformStatus === 'Pass' ? 'Pass' : 'Fail';

        testData.push({
          test: `${worker.area}`,
          method: 'FDA BAM',
          value: `${worker.name}\nAPC: ${worker.apc} CFU/glove\nColiform: ${worker.coliform || 'Nil'}`,
          limit: 'APC: <100 CFU/glove\nColiform: Nil',
          status: overallStatus
        });
      });
    }

    const tableStartY = yPos;
    const baseRowHeight = 8;
    const colWidths = [55, 28, 45, 30, 22];
    const lineHeight = 4;

    doc.setFillColor(200, 200, 200);
    doc.rect(margin, tableStartY, pageWidth - 2 * margin, baseRowHeight, 'F');

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(margin, tableStartY, pageWidth - 2 * margin, baseRowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(33, 33, 33);
    doc.text('Test Parameter', margin + 2, tableStartY + 5.5);
    doc.text('Method', margin + colWidths[0] + 2, tableStartY + 5.5);

    const resultLabel = reportType === 'foodhandler'
      ? 'Worker (Area)'
      : reportType === 'foodsurface'
      ? 'Equipment/Surface'
      : reportType === 'water'
      ? 'Sampling Point'
      : reportType === 'deboning'
      ? 'Worker (Area)'
      : 'Result';

    const limitsLabel = reportType === 'meat' || reportType === 'air' || reportType === 'deboning'
      ? 'Limits'
      : 'Results';

    doc.text(resultLabel, margin + colWidths[0] + colWidths[1] + 2, tableStartY + 5.5);
    doc.text(limitsLabel, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, tableStartY + 5.5);
    doc.text('Status', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, tableStartY + 5.5);

    let col1X = margin + colWidths[0];
    let col2X = col1X + colWidths[1];
    let col3X = col2X + colWidths[2];
    let col4X = col3X + colWidths[3];

    doc.line(col1X, tableStartY, col1X, tableStartY + baseRowHeight);
    doc.line(col2X, tableStartY, col2X, tableStartY + baseRowHeight);
    doc.line(col3X, tableStartY, col3X, tableStartY + baseRowHeight);
    doc.line(col4X, tableStartY, col4X, tableStartY + baseRowHeight);

    yPos = tableStartY + baseRowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    testData.forEach((item, idx) => {
      const testLines = doc.splitTextToSize(item.test, colWidths[0] - 4);
      const methodLines = doc.splitTextToSize(item.method, colWidths[1] - 4);
      const valueLines = doc.splitTextToSize(item.value, colWidths[2] - 4);
      const limitLines = doc.splitTextToSize(item.limit, colWidths[3] - 4);

      const maxLines = Math.max(
        testLines.length,
        methodLines.length,
        valueLines.length,
        limitLines.length
      );
      const rowHeight = Math.max(baseRowHeight, maxLines * lineHeight + 2);

      if (yPos + rowHeight > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 10;

        doc.setFillColor(200, 200, 200);
        doc.rect(margin, yPos, pageWidth - 2 * margin, baseRowHeight, 'F');
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, pageWidth - 2 * margin, baseRowHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(33, 33, 33);
        doc.text('Test Parameter', margin + 2, yPos + 5.5);
        doc.text('Method', margin + colWidths[0] + 2, yPos + 5.5);
        doc.text(resultLabel, margin + colWidths[0] + colWidths[1] + 2, yPos + 5.5);
        doc.text(limitsLabel, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos + 5.5);
        doc.text('Status', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5.5);

        doc.line(col1X, yPos, col1X, yPos + baseRowHeight);
        doc.line(col2X, yPos, col2X, yPos + baseRowHeight);
        doc.line(col3X, yPos, col3X, yPos + baseRowHeight);
        doc.line(col4X, yPos, col4X, yPos + baseRowHeight);

        yPos += baseRowHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
      }

      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(testLines, margin + 2, yPos + 4);

      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text(methodLines, margin + colWidths[0] + 2, yPos + 4);

      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(valueLines, margin + colWidths[0] + colWidths[1] + 2, yPos + 4);

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(limitLines, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos + 4);

      if (item.status === 'Pass') {
        doc.setTextColor(22, 163, 74);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('Satisfactory', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5);
      } else if (item.status === 'Fail') {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('Unsatisfactory', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('-', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5);
      }

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      doc.line(col1X, yPos, col1X, yPos + rowHeight);
      doc.line(col2X, yPos, col2X, yPos + rowHeight);
      doc.line(col3X, yPos, col3X, yPos + rowHeight);
      doc.line(col4X, yPos, col4X, yPos + rowHeight);

      yPos += rowHeight;
    });

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.line(margin, tableStartY, margin, yPos);
    doc.line(pageWidth - margin, tableStartY, pageWidth - margin, yPos);

    if (reportType === 'water' && options.customData) {
      yPos += 12;

      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text('Chemical & Physical Analysis', margin + 2, yPos + 5.5);

      yPos += 10;

      const chemTableStartY = yPos;
      const chemColWidths = [40, 28, 28, 28, 28, 28];

      doc.setFillColor(200, 200, 200);
      doc.rect(margin, chemTableStartY, pageWidth - 2 * margin, baseRowHeight, 'F');

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(margin, chemTableStartY, pageWidth - 2 * margin, baseRowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(33, 33, 33);
      doc.text('Sampling Point', margin + 2, chemTableStartY + 5.5);
      doc.text('Color', margin + chemColWidths[0] + 2, chemTableStartY + 5.5);
      doc.text('Odor', margin + chemColWidths[0] + chemColWidths[1] + 2, chemTableStartY + 5.5);
      doc.text('Clarity', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + 2, chemTableStartY + 5.5);
      doc.text('pH', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + 2, chemTableStartY + 5.5);
      doc.text('TDS (ppm)', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + chemColWidths[4] + 2, chemTableStartY + 5.5);

      let chemCol1X = margin + chemColWidths[0];
      let chemCol2X = chemCol1X + chemColWidths[1];
      let chemCol3X = chemCol2X + chemColWidths[2];
      let chemCol4X = chemCol3X + chemColWidths[3];
      let chemCol5X = chemCol4X + chemColWidths[4];

      doc.line(chemCol1X, chemTableStartY, chemCol1X, chemTableStartY + baseRowHeight);
      doc.line(chemCol2X, chemTableStartY, chemCol2X, chemTableStartY + baseRowHeight);
      doc.line(chemCol3X, chemTableStartY, chemCol3X, chemTableStartY + baseRowHeight);
      doc.line(chemCol4X, chemTableStartY, chemCol4X, chemTableStartY + baseRowHeight);
      doc.line(chemCol5X, chemTableStartY, chemCol5X, chemTableStartY + baseRowHeight);

      yPos = chemTableStartY + baseRowHeight;

      const data = options.customData;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      data.samplingPoints.forEach((point: any, idx: number) => {
        const chemRowHeight = baseRowHeight;

        if (yPos + chemRowHeight > pageHeight - 30) {
          doc.addPage();
          yPos = margin + 10;

          doc.setFillColor(200, 200, 200);
          doc.rect(margin, yPos, pageWidth - 2 * margin, baseRowHeight, 'F');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.rect(margin, yPos, pageWidth - 2 * margin, baseRowHeight);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(33, 33, 33);
          doc.text('Sampling Point', margin + 2, yPos + 5.5);
          doc.text('Color', margin + chemColWidths[0] + 2, yPos + 5.5);
          doc.text('Odor', margin + chemColWidths[0] + chemColWidths[1] + 2, yPos + 5.5);
          doc.text('Clarity', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + 2, yPos + 5.5);
          doc.text('pH', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + 2, yPos + 5.5);
          doc.text('TDS (ppm)', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + chemColWidths[4] + 2, yPos + 5.5);

          doc.line(chemCol1X, yPos, chemCol1X, yPos + baseRowHeight);
          doc.line(chemCol2X, yPos, chemCol2X, yPos + baseRowHeight);
          doc.line(chemCol3X, yPos, chemCol3X, yPos + baseRowHeight);
          doc.line(chemCol4X, yPos, chemCol4X, yPos + baseRowHeight);
          doc.line(chemCol5X, yPos, chemCol5X, yPos + baseRowHeight);

          yPos += baseRowHeight;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        if (idx % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPos, pageWidth - 2 * margin, chemRowHeight, 'F');
        }

        doc.setTextColor(33, 33, 33);
        const locLines = doc.splitTextToSize(point.location, chemColWidths[0] - 4);
        doc.text(locLines, margin + 2, yPos + 5);

        doc.text(point.color || 'N/A', margin + chemColWidths[0] + 2, yPos + 5);
        doc.text(point.odor || 'N/A', margin + chemColWidths[0] + chemColWidths[1] + 2, yPos + 5);
        doc.text(point.clarity || 'N/A', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + 2, yPos + 5);
        doc.text(point.ph || 'N/A', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + 2, yPos + 5);
        doc.text(point.tds || 'N/A', margin + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3] + chemColWidths[4] + 2, yPos + 5);

        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        doc.line(chemCol1X, yPos, chemCol1X, yPos + chemRowHeight);
        doc.line(chemCol2X, yPos, chemCol2X, yPos + chemRowHeight);
        doc.line(chemCol3X, yPos, chemCol3X, yPos + chemRowHeight);
        doc.line(chemCol4X, yPos, chemCol4X, yPos + chemRowHeight);
        doc.line(chemCol5X, yPos, chemCol5X, yPos + chemRowHeight);

        yPos += chemRowHeight;
      });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      doc.line(margin, chemTableStartY, margin, yPos);
      doc.line(pageWidth - margin, chemTableStartY, pageWidth - margin, yPos);
    }

    if (reportType === 'water') {
      if (yPos + 30 > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 20;
      }

      yPos += 10;
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text('Chemical & Physical Limits', margin + 2, yPos + 5.5);

      yPos += 10;
      const baseRowHeight = 8;
      const chemLimitsColWidths = [90, 90];
      const chemLimitsStartY = yPos;

      doc.setFillColor(200, 200, 200);
      doc.rect(margin, chemLimitsStartY, pageWidth - 2 * margin, baseRowHeight, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(margin, chemLimitsStartY, pageWidth - 2 * margin, baseRowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(33, 33, 33);
      doc.text('Parameter', margin + 2, chemLimitsStartY + 5.5);
      doc.text('Acceptable Limit', margin + chemLimitsColWidths[0] + 2, chemLimitsStartY + 5.5);

      const chemLimitsCol1X = margin + chemLimitsColWidths[0];
      doc.line(chemLimitsCol1X, chemLimitsStartY, chemLimitsCol1X, chemLimitsStartY + baseRowHeight);

      yPos = chemLimitsStartY + baseRowHeight;

      const chemLimits = [
        { param: 'Color', limit: 'Colorless' },
        { param: 'Odor', limit: 'Odorless' },
        { param: 'Clarity (visual)', limit: 'No turbidity' },
        { param: 'pH', limit: '6.5 - 8.5' },
        { param: 'TDS (ppm)', limit: '<1000' }
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      chemLimits.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, yPos, pageWidth - 2 * margin, baseRowHeight, 'F');
        }

        doc.setTextColor(33, 33, 33);
        doc.text(item.param, margin + 2, yPos + 5.5);
        doc.text(item.limit, margin + chemLimitsColWidths[0] + 2, yPos + 5.5);

        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        doc.line(chemLimitsCol1X, yPos, chemLimitsCol1X, yPos + baseRowHeight);

        yPos += baseRowHeight;
      });

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      doc.line(margin, chemLimitsStartY, margin, yPos);
      doc.line(pageWidth - margin, chemLimitsStartY, pageWidth - margin, yPos);

      if (yPos + 30 > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 20;
      }

      yPos += 10;
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text('Microbiological Limits', margin + 2, yPos + 5.5);

      yPos += 12;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('APC: < 100 CFU/100ml | Total Coliforms: Nil per 100ml | Faecal Coliforms: Nil per 100ml', margin + 2, yPos);
      yPos += 6;
    } else if (reportType === 'foodhandler' || reportType === 'foodsurface') {
      if (yPos + 30 > pageHeight - 30) {
        doc.addPage();
        yPos = margin + 20;
      }

      yPos += 10;
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text('Microbiological Limits', margin + 2, yPos + 5.5);

      yPos += 12;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const limitsText = reportType === 'foodhandler'
        ? 'Total Plate Count (TPC): < 100 CFU/glove | Total Coliforms: Nil per glove'
        : 'Total Plate Count (TPC): < 100 CFU/swab | Total Coliforms: Nil per swab';

      doc.text(limitsText, margin + 2, yPos);
      yPos += 6;
    }

    if (yPos + 40 > pageHeight - 30) {
      doc.addPage();
      yPos = margin + 20;
    }

    yPos += 8;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Test Methodology & Standards', margin + 2, yPos + 5.5);

    yPos += 11;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const methodText = 'All microbiological tests were performed in accordance with FDA Bacteriological Analytical Manual (BAM) standard methods. Microbiological acceptance criteria are based on USDA AMS specifications for frozen beef and meat products.';
    const methodLines = doc.splitTextToSize(methodText, pageWidth - 2 * margin - 4);
    doc.text(methodLines, margin + 2, yPos);
    yPos += methodLines.length * 4.5;

    yPos += 8;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('References', margin + 2, yPos + 5.5);

    yPos += 11;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const references = [
      '1. FDA Bacteriological Analytical Manual (BAM), U.S. Food and Drug Administration',
      '2. USDA AMS Specifications for Frozen Beef and Meat Products',
      '3. ISO 17025:2017 - General Requirements for the Competence of Testing and Calibration Laboratories'
    ];
    references.forEach((ref, idx) => {
      doc.text(ref, margin + 2, yPos + (idx * 4.5));
    });
    yPos += references.length * 4.5;

    yPos += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Remarks:', margin + 2, yPos);
    doc.setFont('helvetica', 'normal');

    const allPassed = testData.every(item => item.status === 'Pass');
    const remarksText = allPassed ? 'Acceptable' : 'Not Acceptable';
    const remarksColor = allPassed ? [22, 163, 74] : [220, 38, 38];

    doc.setTextColor(remarksColor[0], remarksColor[1], remarksColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(remarksText, margin + 24, yPos);
    yPos += 4.5;

    yPos += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Test Completion Date: ${new Date(results.tested_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}`, margin + 2, yPos);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No test results available for this sample.', margin + 3, yPos);
    yPos += 10;
  }

  yPos += 15;

  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin + 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('AUTHORIZED SIGNATURE', margin + 3, yPos);

  const signatureStartY = yPos;

  try {
    const signaturePath = '/1000487471-Photoroom copy.png';
    const signatureResponse = await fetch(signaturePath);
    const signatureBlob = await signatureResponse.blob();
    const signatureBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(signatureBlob);
    });

    doc.addImage(signatureBase64, 'PNG', margin + 3, yPos + 2, 35, 20);
    yPos += 22;
  } catch (error) {
    console.error('Error loading signature:', error);
    yPos += 15;
    doc.setLineWidth(0.5);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin + 3, yPos, margin + 60, yPos);
    yPos += 5;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Junaid Gabol', margin + 3, yPos);

  yPos += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Laboratory Analyst', margin + 3, yPos);

  yPos += 4;
  doc.text('Senior Microbiologist', margin + 3, yPos);

  // Add authorized stamp label and organic stamp
  const stampSize = 35;
  const stampX = pageWidth - margin - stampSize - 10;
  const stampY = signatureStartY + 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('AUTHORIZED STAMP', stampX + stampSize / 2, signatureStartY, { align: 'center' });

  try {
    const stampPath = '/organic stamp.png';
    const stampResponse = await fetch(stampPath);
    const stampBlob = await stampResponse.blob();
    const stampBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(stampBlob);
    });

    doc.addImage(stampBase64, 'PNG', stampX, stampY, stampSize, stampSize);
  } catch (error) {
    console.error('Stamp load error:', error);
  }

  const footerY = pageHeight - 20;
  doc.setDrawColor(139, 69, 19);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `This is a computer-generated report. Generated on ${new Date().toLocaleString('en-GB')}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.text(
    `Report ID: ${sample.sample_code} | Page 1 of 1`,
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );

  if (options.print) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  if (options.download) {
    const fileName = `${sample.sample_code}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  return doc;
};
