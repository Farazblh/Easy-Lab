import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileDown, Printer, Plus, Trash2, FileCheck } from 'lucide-react';
import { generatePDFReport } from '../utils/pdfGenerator';

type SampleRow = {
  id: string;
  supplierCode: string;
  collectionDate: string;
  reportDate: string;
  sampleNo: string;
  species: string;
  tpc: string;
  sAureus: string;
  coliforms: string;
  ecoliO157: string;
  salmonella: string;
  comments: string;
};

type CreateReportProps = {
  onReportGenerated?: () => void;
};

const CreateReport = ({ onReportGenerated }: CreateReportProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('Frozen Beef Meat');
  const [supplierName, setSupplierName] = useState('');
  const [totalSamples, setTotalSamples] = useState('1 Beef Meat Sample');
  const [issueNo, setIssueNo] = useState('02');
  const [revNo, setRevNo] = useState('01');
  const [meatStatus, setMeatStatus] = useState('COMPLETED');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'meat' | 'air' | 'water' | 'foodhandler' | 'foodsurface' | 'deboning'>('meat');

  const [airQualityData, setAirQualityData] = useState({
    sampleType: 'Air Quality Monitoring',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    issueNo: '02',
    revNo: '01',
    activity: 'Monitoring of Air Bioburden Setting Agar Plate Technique',
    sampleTechnique: 'Settle Plate Technique',
    departments: [
      { sNo: '1', name: 'Beef 1', plate1: '12', plate2: '14', plate3: '13' },
      { sNo: '2', name: 'Beef 2', plate1: '22', plate2: '17', plate3: '11' },
      { sNo: '3', name: 'Debone', plate1: '15', plate2: '17', plate3: '18' },
    ],
    remarks: 'Results are Satisfactory',
  });

  const [waterQualityData, setWaterQualityData] = useState({
    sampleType: 'Water Quality Analysis',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    issueNo: '02',
    revNo: '01',
    activity: 'Physical, Chemical, and Microbiological Analysis of water quality',
    sampleCollectedIn: 'Sterile Flasks',
    samplingPoints: [
      { sNo: '1', location: 'RO Plant Outlet', date: '', color: 'Colorless', odor: 'Odorless', clarity: 'No turbidity', ph: '7.8', tds: '370', apc: '4', totalColiform: 'Nil', faecalColiform: 'Nil' },
      { sNo: '2', location: 'Showers 1 (Beef)', date: '', color: 'Colorless', odor: 'Odorless', clarity: 'No turbidity', ph: '8.3', tds: '550', apc: '15', totalColiform: 'Nil', faecalColiform: 'Nil' },
      { sNo: '3', location: 'Showers 2 (Beef)', date: '', color: 'Colorless', odor: 'Odorless', clarity: 'No turbidity', ph: '7.5', tds: '480', apc: '22', totalColiform: 'Nil', faecalColiform: 'Nil' },
    ],
    remarks: 'All parameters within acceptable limits',
  });

  const [foodHandlerData, setFoodHandlerData] = useState({
    sampleType: 'Food Handler Testing',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    issueNo: '02',
    revNo: '01',
    activity: 'Microbiological Testing of Food Handling Person\'s Hands that comes in contact with Food.',
    department: 'Beef Plant 1',
    samplingTechnique: 'Finger Print Technique/ Swab Technique',
    workers: [
      { sNo: '1', area: 'Cattle Box Area', name: 'rizwan', apc: '16', coliform: 'NIL' },
      { sNo: '2', area: 'Fore Hook Cutting Lift 1', name: 'adil', apc: '12', coliform: 'NIL' },
      { sNo: '3', area: 'Hind Hook Cutting Lift 2', name: 'hamid', apc: '14', coliform: 'NIL' },
      { sNo: '4', area: 'Skin Removing Lift 3', name: 'iftikhar', apc: '18', coliform: 'NIL' },
      { sNo: '5', area: 'Dehiding Area Lift 4', name: 'iqbal', apc: '28', coliform: 'NIL' },
      { sNo: '6', area: 'Dehiding Area Lift 5', name: 'irtiza', apc: '32', coliform: 'NIL' },
      { sNo: '7', area: 'Evisceration Area Lift 6', name: 'ahsan', apc: '17', coliform: 'NIL' },
      { sNo: '8', area: 'Evisceration Area', name: 'rehan', apc: '22', coliform: 'NIL' },
      { sNo: '9', area: 'Splitting Cutter Area Lift 7', name: 'shahid', apc: '25', coliform: 'NIL' },
      { sNo: '10', area: 'Brisket Saw Area Lift 8', name: 'ali', apc: '35', coliform: 'NIL' },
    ],
  });

  const [foodSurfaceData, setFoodSurfaceData] = useState({
    sampleType: 'Food Surface Testing',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    issueNo: '02',
    revNo: '01',
    activity: 'Microbiological Testing of Food Handling Person\'s Hands that comes in contact with Food.',
    department: 'Beef Plant 1',
    samplingTechnique: 'Finger Print Technique/ Swab Technique',
    surfaces: [
      { sNo: '1', area: 'Cattle Box Area', apc: '18', coliform: 'Nil' },
      { sNo: '2', area: 'Fore Hook Cutting Lift 1', apc: '22', coliform: 'Nil' },
      { sNo: '3', area: 'Hind Hook Cutting Lift 2', apc: '23', coliform: 'Nil' },
      { sNo: '4', area: 'Skin Removing Lift 3', apc: '16', coliform: 'Nil' },
      { sNo: '5', area: 'Dehiding Area Lift 4', apc: '31', coliform: 'Nil' },
      { sNo: '6', area: 'Dehiding Area Lift 5', apc: '32', coliform: 'Nil' },
      { sNo: '7', area: 'Evisceration Area Lift 6', apc: '18', coliform: 'Nil' },
      { sNo: '8', area: 'Evisceration Area', apc: '19', coliform: 'Nil' },
      { sNo: '9', area: 'Splitting Cutter Area Lift 7', apc: '12', coliform: 'Nil' },
      { sNo: '10', area: 'Brisket Saw Area Lift 8', apc: '22', coliform: 'Nil' },
      { sNo: '11', area: 'Fat Trimming Area', apc: '21', coliform: 'Nil' },
    ],
  });

  const [deboningData, setDeboningData] = useState({
    sampleType: 'Deboning Testing',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    issueNo: '02',
    revNo: '01',
    activity: 'Microbiological Testing of Food Handling Person\'s Hands that comes in contact with Food.',
    department: 'Deboning',
    samplingTechnique: 'Finger Print Technique/ Swab Technique',
    workers: [
      { sNo: '1', area: 'Deboning Tray # 1', name: 'shameer', apc: '22', coliform: 'NIL' },
      { sNo: '2', area: 'Deboning Tray # 2', name: 'naveed', apc: '15', coliform: 'NIL' },
      { sNo: '3', area: 'Deboning Tray # 3', name: 'ahsan', apc: '19', coliform: 'NIL' },
      { sNo: '4', area: 'Deboning Tray # 4', name: 'ghulam nabi', apc: '32', coliform: 'NIL' },
      { sNo: '5', area: 'Deboning Tray # 5', name: 'zakir', apc: '23', coliform: 'NIL' },
      { sNo: '6', area: 'Deboning Tray # 6', name: 'saadullah', apc: '24', coliform: 'NIL' },
      { sNo: '7', area: 'Deboning Tray # 7', name: 'abrar', apc: '28', coliform: 'NIL' },
      { sNo: '8', area: 'Deboning Tray # 8', name: 'khan', apc: '32', coliform: 'NIL' },
      { sNo: '9', area: 'Deboning Tray # 9', name: 'waqas', apc: '30', coliform: 'NIL' },
      { sNo: '5', area: 'Deboning Tray # 10', name: 'rae', apc: '34', coliform: 'NIL' },
      { sNo: '6', area: 'Deboning Tray # 11', name: 'salah', apc: '15', coliform: 'NIL' },
      { sNo: '7', area: 'Boneless Meat Care Packing Trays (Random)', name: 'saadullah', apc: '22', coliform: 'NIL' },
    ],
  });

  const [sampleRows, setSampleRows] = useState<SampleRow[]>([
    {
      id: '1',
      supplierCode: '',
      collectionDate: '',
      reportDate: '',
      sampleNo: '1',
      species: 'Frozen Beef withBone',
      tpc: '5000',
      sAureus: '80',
      coliforms: 'Nil',
      ecoliO157: 'Nil',
      salmonella: 'Nil',
      comments: 'Acceptable',
    },
  ]);

  const addRow = () => {
    const newRow: SampleRow = {
      id: Date.now().toString(),
      supplierCode: '',
      collectionDate: '',
      reportDate: '',
      sampleNo: (sampleRows.length + 1).toString(),
      species: 'Frozen Beef withBone',
      tpc: '5000',
      sAureus: '80',
      coliforms: 'Nil',
      ecoliO157: 'Nil',
      salmonella: 'Nil',
      comments: 'Acceptable',
    };
    setSampleRows([...sampleRows, newRow]);
  };

  const removeRow = (id: string) => {
    if (sampleRows.length > 1) {
      setSampleRows(sampleRows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof SampleRow, value: string) => {
    setSampleRows(sampleRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const addAirQualityRow = () => {
    const newDept = {
      sNo: (airQualityData.departments.length + 1).toString(),
      name: '',
      plate1: '0',
      plate2: '0',
      plate3: '0'
    };
    setAirQualityData({...airQualityData, departments: [...airQualityData.departments, newDept]});
  };

  const removeAirQualityRow = (index: number) => {
    if (airQualityData.departments.length > 1) {
      const newDepts = airQualityData.departments.filter((_, idx) => idx !== index);
      setAirQualityData({...airQualityData, departments: newDepts});
    }
  };

  const addWaterQualityRow = () => {
    const newPoint = {
      sNo: (waterQualityData.samplingPoints.length + 1).toString(),
      location: '',
      date: '',
      color: 'Colorless',
      odor: 'Odorless',
      clarity: 'No turbidity',
      ph: '7.0',
      tds: '0',
      apc: '0',
      totalColiform: 'Nil',
      faecalColiform: 'Nil'
    };
    setWaterQualityData({...waterQualityData, samplingPoints: [...waterQualityData.samplingPoints, newPoint]});
  };

  const removeWaterQualityRow = (index: number) => {
    if (waterQualityData.samplingPoints.length > 1) {
      const newPoints = waterQualityData.samplingPoints.filter((_, idx) => idx !== index);
      setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
    }
  };

  const addFoodHandlerRow = () => {
    const newWorker = {
      sNo: (foodHandlerData.workers.length + 1).toString(),
      area: '',
      name: '',
      apc: '0',
      coliform: 'NIL'
    };
    setFoodHandlerData({...foodHandlerData, workers: [...foodHandlerData.workers, newWorker]});
  };

  const removeFoodHandlerRow = (index: number) => {
    if (foodHandlerData.workers.length > 1) {
      const newWorkers = foodHandlerData.workers.filter((_, idx) => idx !== index);
      setFoodHandlerData({...foodHandlerData, workers: newWorkers});
    }
  };

  const addFoodSurfaceRow = () => {
    const newSurface = {
      sNo: (foodSurfaceData.surfaces.length + 1).toString(),
      area: '',
      apc: '0',
      coliform: 'Nil'
    };
    setFoodSurfaceData({...foodSurfaceData, surfaces: [...foodSurfaceData.surfaces, newSurface]});
  };

  const removeFoodSurfaceRow = (index: number) => {
    if (foodSurfaceData.surfaces.length > 1) {
      const newSurfaces = foodSurfaceData.surfaces.filter((_, idx) => idx !== index);
      setFoodSurfaceData({...foodSurfaceData, surfaces: newSurfaces});
    }
  };

  const addDeboningRow = () => {
    const newWorker = {
      sNo: (deboningData.workers.length + 1).toString(),
      area: '',
      name: '',
      apc: '0',
      coliform: 'NIL'
    };
    setDeboningData({...deboningData, workers: [...deboningData.workers, newWorker]});
  };

  const removeDeboningRow = (index: number) => {
    if (deboningData.workers.length > 1) {
      const newWorkers = deboningData.workers.filter((_, idx) => idx !== index);
      setDeboningData({...deboningData, workers: newWorkers});
    }
  };

  const handleGenerateReport = async () => {
    if (reportType === 'meat') {
      if (!supplierName.trim()) {
        alert('Please enter supplier name');
        return;
      }

      if (!sampleRows[0].supplierCode || !sampleRows[0].supplierCode.trim()) {
        alert('Please enter supplier code');
        return;
      }

      if (!sampleRows[0].collectionDate) {
        alert('Please enter collection date');
        return;
      }

      if (!sampleRows[0].reportDate) {
        alert('Please enter report date');
        return;
      }
    } else if (reportType === 'air') {
      if (!airQualityData.collectionDate) {
        alert('Please enter collection date');
        return;
      }
      if (!airQualityData.reportDate) {
        alert('Please enter report date');
        return;
      }
    } else if (reportType === 'water') {
      if (!waterQualityData.collectionDate) {
        alert('Please enter collection date');
        return;
      }
      if (!waterQualityData.reportDate) {
        alert('Please enter report date');
        return;
      }
    } else if (reportType === 'foodhandler') {
      if (!foodHandlerData.collectionDate) {
        alert('Please enter collection date');
        return;
      }
      if (!foodHandlerData.reportDate) {
        alert('Please enter report date');
        return;
      }
    } else if (reportType === 'foodsurface') {
      if (!foodSurfaceData.collectionDate) {
        alert('Please enter collection date');
        return;
      }
      if (!foodSurfaceData.reportDate) {
        alert('Please enter report date');
        return;
      }
    } else if (reportType === 'deboning') {
      if (!deboningData.collectionDate) {
        alert('Please enter collection date');
        return;
      }
      if (!deboningData.reportDate) {
        alert('Please enter report date');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('User not logged in. Please login again.');
        return;
      }

      const sampleCode = reportType === 'meat'
        ? (sampleRows[0].supplierCode || `SAMPLE-${Date.now()}`)
        : reportType === 'air' ? (airQualityData.sampleCode || `AIR-${Date.now()}`)
        : reportType === 'water' ? (waterQualityData.sampleCode || `WATER-${Date.now()}`)
        : reportType === 'foodhandler' ? (foodHandlerData.sampleCode || `FH-${Date.now()}`)
        : reportType === 'foodsurface' ? (foodSurfaceData.sampleCode || `FS-${Date.now()}`)
        : (deboningData.sampleCode || `DB-${Date.now()}`);

      const { data: existingSample } = await supabase
        .from('samples')
        .select('id')
        .eq('sample_code', sampleCode)
        .maybeSingle();

      let sampleData;

      const getSampleTypeTitle = () => {
        if (reportType === 'meat') return reportTitle;
        if (reportType === 'air') return airQualityData.sampleType;
        if (reportType === 'water') return waterQualityData.sampleType;
        if (reportType === 'foodhandler') return foodHandlerData.sampleType;
        if (reportType === 'foodsurface') return foodSurfaceData.sampleType;
        if (reportType === 'deboning') return deboningData.sampleType;
        return 'Unknown';
      };

      const getSourceName = () => {
        if (reportType === 'meat') return supplierName;
        if (reportType === 'air') return airQualityData.supplier;
        if (reportType === 'water') return waterQualityData.supplier;
        if (reportType === 'foodhandler') return foodHandlerData.supplier;
        if (reportType === 'foodsurface') return foodSurfaceData.supplier;
        if (reportType === 'deboning') return deboningData.supplier;
        return 'Unknown';
      };

      const getCollectionDate = () => {
        if (reportType === 'meat') return sampleRows[0].collectionDate;
        if (reportType === 'air') return airQualityData.collectionDate;
        if (reportType === 'water') return waterQualityData.collectionDate;
        if (reportType === 'foodhandler') return foodHandlerData.collectionDate;
        if (reportType === 'foodsurface') return foodSurfaceData.collectionDate;
        if (reportType === 'deboning') return deboningData.collectionDate;
        return new Date().toISOString();
      };

      const getReportDate = () => {
        if (reportType === 'meat') return sampleRows[0].reportDate;
        if (reportType === 'air') return airQualityData.reportDate;
        if (reportType === 'water') return waterQualityData.reportDate;
        if (reportType === 'foodhandler') return foodHandlerData.reportDate;
        if (reportType === 'foodsurface') return foodSurfaceData.reportDate;
        if (reportType === 'deboning') return deboningData.reportDate;
        return new Date().toISOString();
      };

      if (existingSample) {
        const { data: updated, error: updateError } = await supabase
          .from('samples')
          .update({
            sample_type: getSampleTypeTitle(),
            source: getSourceName(),
            collection_date: getCollectionDate(),
            received_date: getReportDate(),
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSample.id)
          .select()
          .single();

        if (updateError) throw updateError;
        sampleData = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('samples')
          .insert({
            sample_code: sampleCode,
            user_id: user.id,
            sample_type: getSampleTypeTitle(),
            source: getSourceName(),
            collection_date: getCollectionDate(),
            received_date: getReportDate(),
            status: 'completed',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        sampleData = inserted;
      }

      const { data: existingTest } = await supabase
        .from('test_results')
        .select('id')
        .eq('sample_id', sampleData.id)
        .maybeSingle();

      let testResult;

      const getTestData = () => {
        const reportDate = getReportDate();

        if (reportType === 'meat') {
          return {
            tpc: parseInt(sampleRows[0].tpc) || 5000,
            coliforms: sampleRows[0].coliforms.toLowerCase(),
            listeria: 'nil',
            ecoli_o157: sampleRows[0].ecoliO157.toLowerCase(),
            salmonella: sampleRows[0].salmonella.toLowerCase(),
            s_aureus: sampleRows[0].sAureus,
            ph: null,
            tds: null,
            remarks: sampleRows[0].comments,
            tested_by: user.id,
            tested_at: reportDate,
          };
        } else if (reportType === 'air') {
          return {
            tpc: null,
            coliforms: null,
            listeria: null,
            ecoli_o157: null,
            salmonella: null,
            s_aureus: null,
            ph: null,
            tds: null,
            remarks: airQualityData.remarks,
            tested_by: user.id,
            tested_at: reportDate,
            custom_data: JSON.stringify(airQualityData),
          };
        } else if (reportType === 'water') {
          return {
            tpc: null,
            coliforms: null,
            listeria: null,
            ecoli_o157: null,
            salmonella: null,
            s_aureus: null,
            ph: waterQualityData.samplingPoints[0]?.ph ? parseFloat(waterQualityData.samplingPoints[0].ph) : null,
            tds: waterQualityData.samplingPoints[0]?.tds ? parseFloat(waterQualityData.samplingPoints[0].tds) : null,
            remarks: waterQualityData.remarks,
            tested_by: user.id,
            tested_at: reportDate,
            custom_data: JSON.stringify(waterQualityData),
          };
        } else if (reportType === 'foodhandler') {
          return {
            tpc: null,
            coliforms: null,
            listeria: null,
            ecoli_o157: null,
            salmonella: null,
            s_aureus: null,
            ph: null,
            tds: null,
            remarks: 'Food Handler Testing Report',
            tested_by: user.id,
            tested_at: reportDate,
            custom_data: JSON.stringify(foodHandlerData),
          };
        } else if (reportType === 'foodsurface') {
          return {
            tpc: null,
            coliforms: null,
            listeria: null,
            ecoli_o157: null,
            salmonella: null,
            s_aureus: null,
            ph: null,
            tds: null,
            remarks: 'Food Contact Surface Testing Report',
            tested_by: user.id,
            tested_at: reportDate,
            custom_data: JSON.stringify(foodSurfaceData),
          };
        } else if (reportType === 'deboning') {
          return {
            tpc: null,
            coliforms: null,
            listeria: null,
            ecoli_o157: null,
            salmonella: null,
            s_aureus: null,
            ph: null,
            tds: null,
            remarks: 'Deboning Food Handler Testing Report',
            tested_by: user.id,
            tested_at: reportDate,
            custom_data: JSON.stringify(deboningData),
          };
        }
        return {};
      };

      const testData = getTestData();

      if (existingTest) {
        const { data: updated, error: updateError } = await supabase
          .from('test_results')
          .update(testData)
          .eq('id', existingTest.id)
          .select()
          .single();

        if (updateError) throw updateError;
        testResult = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('test_results')
          .insert({
            sample_id: sampleData.id,
            ...testData,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        testResult = inserted;
      }

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          sample_id: sampleData.id,
          pdf_url: `${sampleCode}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
          generated_by: user.id,
        })
        .select(`
          *,
          sample:sample_id(
            *,
            test_result:test_results(*)
          ),
          generator:generated_by(full_name)
        `)
        .single();

      if (reportError) throw reportError;

      const enrichedReportData = {
        ...reportData,
        reportType,
        airQualityData: reportType === 'air' ? airQualityData : null,
        waterQualityData: reportType === 'water' ? waterQualityData : null,
        foodHandlerData: reportType === 'foodhandler' ? foodHandlerData : null,
        foodSurfaceData: reportType === 'foodsurface' ? foodSurfaceData : null,
        deboningData: reportType === 'deboning' ? deboningData : null,
        sampleRows: reportType === 'meat' ? sampleRows : null,
      };

      setGeneratedReport(enrichedReportData);
      setReportId(reportData.id);
      alert('Report generated successfully! Redirecting to Reports section...');

      if (onReportGenerated) {
        setTimeout(() => {
          onReportGenerated();
        }, 1500);
      }
    } catch (error: any) {
      alert('Error generating report: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'download' | 'print') => {
    if (!generatedReport) {
      alert('Please generate the report first');
      return;
    }

    setLoading(true);

    try {
      const { data: labSettings } = await supabase
        .from('lab_settings')
        .select('*')
        .maybeSingle();

      const sampleInfo = generatedReport.sample;
      const testResult = sampleInfo.test_result[0];

      const sampleData = {
        sample_code: sampleInfo.sample_code,
        sample_type: sampleInfo.sample_type,
        source: sampleInfo.source,
        collection_date: sampleInfo.collection_date,
        received_date: sampleInfo.received_date,
        status: sampleInfo.status,
        client: {
          name: sampleInfo.source,
          company: sampleInfo.source,
          email: null,
          phone: null,
          address: null,
        },
        test_result: testResult,
        analyst: {
          full_name: profile?.full_name || 'Lab Analyst',
        },
      };

      const reportTypeFromData = generatedReport.reportType || reportType;
      let customData = null;

      if (reportTypeFromData === 'air') {
        customData = generatedReport.airQualityData || airQualityData;
      } else if (reportTypeFromData === 'water') {
        customData = generatedReport.waterQualityData || waterQualityData;
      } else if (reportTypeFromData === 'foodhandler') {
        customData = generatedReport.foodHandlerData || foodHandlerData;
      } else if (reportTypeFromData === 'foodsurface') {
        customData = generatedReport.foodSurfaceData || foodSurfaceData;
      } else if (reportTypeFromData === 'deboning') {
        customData = generatedReport.deboningData || deboningData;
      }

      await generatePDFReport(
        sampleData,
        labSettings || {
          lab_name: 'THE ORGANIC MEAT COMPANY LIMITED',
          lab_logo_url: null,
          address: null,
          phone: null,
          email: null,
        },
        {
          download: action === 'download',
          print: action === 'print',
          reportType: reportTypeFromData,
          customData: customData,
        }
      );

      if (action === 'download') {
        alert('Report downloaded successfully!');
      }
    } catch (error: any) {
      alert('Error processing report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Microbiological Testing Report</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setReportType('meat')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'meat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Meat Report
            </button>
            <button
              onClick={() => setReportType('air')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'air'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Air Quality
            </button>
            <button
              onClick={() => setReportType('water')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'water'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Water Quality
            </button>
            <button
              onClick={() => setReportType('foodhandler')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'foodhandler'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Food Handler Testing
            </button>
            <button
              onClick={() => setReportType('foodsurface')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'foodsurface'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Food Surface Testing
            </button>
            <button
              onClick={() => setReportType('deboning')}
              className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
                reportType === 'deboning'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!!generatedReport}
            >
              Deboning Testing
            </button>
          </div>
        </div>

        {generatedReport && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <FileCheck className="w-5 h-5" />
              <span className="font-semibold">Report Generated Successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Sample: {generatedReport.sample.sample_code} | Supplier: {generatedReport.sample.source}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Type
            </label>
            <input
              type="text"
              value={
                reportType === 'meat' ? reportTitle :
                reportType === 'air' ? airQualityData.sampleType :
                reportType === 'water' ? waterQualityData.sampleType :
                reportType === 'foodhandler' ? foodHandlerData.sampleType :
                reportType === 'foodsurface' ? foodSurfaceData.sampleType :
                deboningData.sampleType
              }
              onChange={(e) => {
                if (reportType === 'meat') setReportTitle(e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, sampleType: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, sampleType: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, sampleType: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, sampleType: e.target.value });
                else setDeboningData({ ...deboningData, sampleType: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Frozen Beef Meat"
              disabled={!!generatedReport}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Code
            </label>
            <input
              type="text"
              value={
                reportType === 'meat' ? (sampleRows[0]?.supplierCode || '') :
                reportType === 'air' ? airQualityData.sampleCode :
                reportType === 'water' ? waterQualityData.sampleCode :
                reportType === 'foodhandler' ? foodHandlerData.sampleCode :
                reportType === 'foodsurface' ? foodSurfaceData.sampleCode :
                deboningData.sampleCode
              }
              onChange={(e) => {
                if (reportType === 'meat') updateRow(sampleRows[0].id, 'supplierCode', e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, sampleCode: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, sampleCode: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, sampleCode: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, sampleCode: e.target.value });
                else setDeboningData({ ...deboningData, sampleCode: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 876"
              disabled={!!generatedReport}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Date
            </label>
            <input
              type="date"
              value={
                reportType === 'meat' ? (sampleRows[0]?.collectionDate || '') :
                reportType === 'air' ? airQualityData.collectionDate :
                reportType === 'water' ? waterQualityData.collectionDate :
                reportType === 'foodhandler' ? foodHandlerData.collectionDate :
                reportType === 'foodsurface' ? foodSurfaceData.collectionDate :
                deboningData.collectionDate
              }
              onChange={(e) => {
                if (reportType === 'meat') updateRow(sampleRows[0].id, 'collectionDate', e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, collectionDate: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, collectionDate: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, collectionDate: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, collectionDate: e.target.value });
                else setDeboningData({ ...deboningData, collectionDate: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!generatedReport}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <input
              type="date"
              value={
                reportType === 'meat' ? (sampleRows[0]?.reportDate || '') :
                reportType === 'air' ? airQualityData.reportDate :
                reportType === 'water' ? waterQualityData.reportDate :
                reportType === 'foodhandler' ? foodHandlerData.reportDate :
                reportType === 'foodsurface' ? foodSurfaceData.reportDate :
                deboningData.reportDate
              }
              onChange={(e) => {
                if (reportType === 'meat') updateRow(sampleRows[0].id, 'reportDate', e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, reportDate: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, reportDate: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, reportDate: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, reportDate: e.target.value });
                else setDeboningData({ ...deboningData, reportDate: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!generatedReport}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              value={
                reportType === 'meat' ? supplierName :
                reportType === 'air' ? airQualityData.supplier :
                reportType === 'water' ? waterQualityData.supplier :
                reportType === 'foodhandler' ? foodHandlerData.supplier :
                reportType === 'foodsurface' ? foodSurfaceData.supplier :
                deboningData.supplier
              }
              onChange={(e) => {
                if (reportType === 'meat') setSupplierName(e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, supplier: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, supplier: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, supplier: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, supplier: e.target.value });
                else setDeboningData({ ...deboningData, supplier: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter supplier"
              disabled={!!generatedReport}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={
                reportType === 'meat' ? meatStatus :
                reportType === 'air' ? airQualityData.status :
                reportType === 'water' ? waterQualityData.status :
                reportType === 'foodhandler' ? foodHandlerData.status :
                reportType === 'foodsurface' ? foodSurfaceData.status :
                deboningData.status
              }
              onChange={(e) => {
                if (reportType === 'meat') setMeatStatus(e.target.value);
                else if (reportType === 'air') setAirQualityData({ ...airQualityData, status: e.target.value });
                else if (reportType === 'water') setWaterQualityData({ ...waterQualityData, status: e.target.value });
                else if (reportType === 'foodhandler') setFoodHandlerData({ ...foodHandlerData, status: e.target.value });
                else if (reportType === 'foodsurface') setFoodSurfaceData({ ...foodSurfaceData, status: e.target.value });
                else if (reportType === 'deboning') setDeboningData({ ...deboningData, status: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!generatedReport}
            >
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
            </select>
          </div>
        </div>


        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportType === 'meat' ? 'Meat Report' :
             reportType === 'air' ? 'Air Quality Report' :
             reportType === 'water' ? 'Water Quality Report' :
             reportType === 'foodhandler' ? 'Food Handler Testing Report' :
             reportType === 'foodsurface' ? 'Food Contact Surface Testing Report' :
             'Deboning Food Handler Testing Report'}
          </h3>
          {!generatedReport && (
            <button
              onClick={() => {
                if (reportType === 'meat') addRow();
                else if (reportType === 'air') addAirQualityRow();
                else if (reportType === 'water') addWaterQualityRow();
                else if (reportType === 'foodhandler') addFoodHandlerRow();
                else if (reportType === 'foodsurface') addFoodSurfaceRow();
                else if (reportType === 'deboning') addDeboningRow();
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          )}
        </div>

        {reportType === 'meat' && (
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-xs">Supplier Code</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Collection Date</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Report Date</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Sample No</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">TPC (cfu/g)</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">S.aureus</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Coliforms</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">E.coli O157</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Salmonella</th>
                <th className="border border-gray-300 px-2 py-2 text-xs">Comments</th>
                {!generatedReport && <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.supplierCode}
                      onChange={(e) => updateRow(row.id, 'supplierCode', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="date"
                      value={row.collectionDate}
                      onChange={(e) => updateRow(row.id, 'collectionDate', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="date"
                      value={row.reportDate}
                      onChange={(e) => updateRow(row.id, 'reportDate', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.sampleNo}
                      onChange={(e) => updateRow(row.id, 'sampleNo', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.tpc}
                      onChange={(e) => updateRow(row.id, 'tpc', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.sAureus}
                      onChange={(e) => updateRow(row.id, 'sAureus', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.coliforms}
                      onChange={(e) => updateRow(row.id, 'coliforms', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.ecoliO157}
                      onChange={(e) => updateRow(row.id, 'ecoliO157', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.salmonella}
                      onChange={(e) => updateRow(row.id, 'salmonella', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.comments}
                      onChange={(e) => updateRow(row.id, 'comments', e.target.value)}
                      className="w-full px-2 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                      disabled={!!generatedReport}
                    />
                  </td>
                  {!generatedReport && (
                    <td className="border border-gray-300 p-1 text-center">
                      {sampleRows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {reportType === 'air' && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  value={airQualityData.activity}
                  onChange={(e) => setAirQualityData({...airQualityData, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Technique</label>
                <input
                  type="text"
                  value={airQualityData.sampleTechnique}
                  onChange={(e) => setAirQualityData({...airQualityData, sampleTechnique: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-sm">S.No.</th>
                    <th className="border border-gray-300 px-3 py-2 text-sm">Department</th>
                    <th className="border border-gray-300 px-3 py-2 text-sm">Plate No 1<br/>No of Colonies</th>
                    <th className="border border-gray-300 px-3 py-2 text-sm">Plate No 2<br/>No of Colonies</th>
                    <th className="border border-gray-300 px-3 py-2 text-sm">Plate No 3<br/>No of Colonies</th>
                    <th className="border border-gray-300 px-3 py-2 text-sm">Average<br/>No of Colonies</th>
                    {!generatedReport && <th className="border border-gray-300 px-2 py-2 text-sm">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {airQualityData.departments.map((dept, idx) => {
                    const avg = Math.round((parseInt(dept.plate1) + parseInt(dept.plate2) + parseInt(dept.plate3)) / 3);
                    return (
                      <tr key={idx}>
                        <td className="border border-gray-300 p-2 text-center">{dept.sNo}</td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={dept.name}
                            onChange={(e) => {
                              const newDepts = [...airQualityData.departments];
                              newDepts[idx].name = e.target.value;
                              setAirQualityData({...airQualityData, departments: newDepts});
                            }}
                            className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={dept.plate1}
                            onChange={(e) => {
                              const newDepts = [...airQualityData.departments];
                              newDepts[idx].plate1 = e.target.value;
                              setAirQualityData({...airQualityData, departments: newDepts});
                            }}
                            className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={dept.plate2}
                            onChange={(e) => {
                              const newDepts = [...airQualityData.departments];
                              newDepts[idx].plate2 = e.target.value;
                              setAirQualityData({...airQualityData, departments: newDepts});
                            }}
                            className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={dept.plate3}
                            onChange={(e) => {
                              const newDepts = [...airQualityData.departments];
                              newDepts[idx].plate3 = e.target.value;
                              setAirQualityData({...airQualityData, departments: newDepts});
                            }}
                            className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-semibold">{avg}</td>
                        {!generatedReport && (
                          <td className="border border-gray-300 p-1 text-center">
                            {airQualityData.departments.length > 1 && (
                              <button
                                onClick={() => removeAirQualityRow(idx)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">QA Remarks</label>
              <textarea
                value={airQualityData.remarks}
                onChange={(e) => setAirQualityData({...airQualityData, remarks: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                disabled={!!generatedReport}
              />
            </div>
          </div>
        )}

        {reportType === 'water' && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  value={waterQualityData.activity}
                  onChange={(e) => setWaterQualityData({...waterQualityData, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Collected In</label>
                <input
                  type="text"
                  value={waterQualityData.sampleCollectedIn}
                  onChange={(e) => setWaterQualityData({...waterQualityData, sampleCollectedIn: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-2 py-2">S#</th>
                    <th className="border border-gray-300 px-2 py-2">Sampling Points</th>
                    <th className="border border-gray-300 px-2 py-2">Color</th>
                    <th className="border border-gray-300 px-2 py-2">Odor</th>
                    <th className="border border-gray-300 px-2 py-2">Clarity</th>
                    <th className="border border-gray-300 px-2 py-2">pH</th>
                    <th className="border border-gray-300 px-2 py-2">TDS<br/>(ppm)</th>
                    <th className="border border-gray-300 px-2 py-2">APC<br/>(CFU/100ml)</th>
                    <th className="border border-gray-300 px-2 py-2">Total<br/>Coliform/100ml</th>
                    <th className="border border-gray-300 px-2 py-2">Faecal<br/>Coliform/100ml</th>
                    {!generatedReport && <th className="border border-gray-300 px-2 py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {waterQualityData.samplingPoints.map((point, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-1 text-center">{point.sNo}</td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.location}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].location = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.color}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].color = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.odor}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].odor = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.clarity}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].clarity = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.ph}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].ph = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.tds}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].tds = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.apc}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].apc = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.totalColiform}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].totalColiform = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={point.faecalColiform}
                          onChange={(e) => {
                            const newPoints = [...waterQualityData.samplingPoints];
                            newPoints[idx].faecalColiform = e.target.value;
                            setWaterQualityData({...waterQualityData, samplingPoints: newPoints});
                          }}
                          className="w-full px-1 py-1 border-0 focus:ring-1 focus:ring-blue-500 text-xs"
                          disabled={!!generatedReport}
                        />
                      </td>
                      {!generatedReport && (
                        <td className="border border-gray-300 p-1 text-center">
                          {waterQualityData.samplingPoints.length > 1 && (
                            <button
                              onClick={() => removeWaterQualityRow(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={waterQualityData.remarks}
                onChange={(e) => setWaterQualityData({...waterQualityData, remarks: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                disabled={!!generatedReport}
              />
            </div>
          </div>
        )}

        {reportType === 'foodhandler' && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  value={foodHandlerData.activity}
                  onChange={(e) => setFoodHandlerData({...foodHandlerData, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={foodHandlerData.department}
                  onChange={(e) => setFoodHandlerData({...foodHandlerData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Techniques</label>
              <input
                type="text"
                value={foodHandlerData.samplingTechnique}
                onChange={(e) => setFoodHandlerData({...foodHandlerData, samplingTechnique: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!generatedReport}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">S.No.</th>
                    <th className="border border-gray-300 px-3 py-2">SAMPLING AREA</th>
                    <th className="border border-gray-300 px-3 py-2">WORKER NAME</th>
                    <th className="border border-gray-300 px-3 py-2">APC<br/>Average cfu/glove</th>
                    <th className="border border-gray-300 px-3 py-2">COLIFORM<br/>Cfu/glove</th>
                    {!generatedReport && <th className="border border-gray-300 px-3 py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {foodHandlerData.workers.map((worker, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2 text-center">{worker.sNo}</td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.area}
                          onChange={(e) => {
                            const newWorkers = [...foodHandlerData.workers];
                            newWorkers[idx].area = e.target.value;
                            setFoodHandlerData({...foodHandlerData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.name}
                          onChange={(e) => {
                            const newWorkers = [...foodHandlerData.workers];
                            newWorkers[idx].name = e.target.value;
                            setFoodHandlerData({...foodHandlerData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.apc}
                          onChange={(e) => {
                            const newWorkers = [...foodHandlerData.workers];
                            newWorkers[idx].apc = e.target.value;
                            setFoodHandlerData({...foodHandlerData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.coliform}
                          onChange={(e) => {
                            const newWorkers = [...foodHandlerData.workers];
                            newWorkers[idx].coliform = e.target.value;
                            setFoodHandlerData({...foodHandlerData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      {!generatedReport && (
                        <td className="border border-gray-300 p-1 text-center">
                          {foodHandlerData.workers.length > 1 && (
                            <button
                              onClick={() => removeFoodHandlerRow(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'foodsurface' && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  value={foodSurfaceData.activity}
                  onChange={(e) => setFoodSurfaceData({...foodSurfaceData, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={foodSurfaceData.department}
                  onChange={(e) => setFoodSurfaceData({...foodSurfaceData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Techniques</label>
              <input
                type="text"
                value={foodSurfaceData.samplingTechnique}
                onChange={(e) => setFoodSurfaceData({...foodSurfaceData, samplingTechnique: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!generatedReport}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">S.No.</th>
                    <th className="border border-gray-300 px-3 py-2">SAMPLING AREA</th>
                    <th className="border border-gray-300 px-3 py-2">APC</th>
                    <th className="border border-gray-300 px-3 py-2">COLIFORM</th>
                    {!generatedReport && <th className="border border-gray-300 px-3 py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {foodSurfaceData.surfaces.map((surface, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2 text-center">{surface.sNo}</td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={surface.area}
                          onChange={(e) => {
                            const newSurfaces = [...foodSurfaceData.surfaces];
                            newSurfaces[idx].area = e.target.value;
                            setFoodSurfaceData({...foodSurfaceData, surfaces: newSurfaces});
                          }}
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={surface.apc}
                          onChange={(e) => {
                            const newSurfaces = [...foodSurfaceData.surfaces];
                            newSurfaces[idx].apc = e.target.value;
                            setFoodSurfaceData({...foodSurfaceData, surfaces: newSurfaces});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={surface.coliform}
                          onChange={(e) => {
                            const newSurfaces = [...foodSurfaceData.surfaces];
                            newSurfaces[idx].coliform = e.target.value;
                            setFoodSurfaceData({...foodSurfaceData, surfaces: newSurfaces});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      {!generatedReport && (
                        <td className="border border-gray-300 p-1 text-center">
                          {foodSurfaceData.surfaces.length > 1 && (
                            <button
                              onClick={() => removeFoodSurfaceRow(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'deboning' && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                <input
                  type="text"
                  value={deboningData.activity}
                  onChange={(e) => setDeboningData({...deboningData, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={deboningData.department}
                  onChange={(e) => setDeboningData({...deboningData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!generatedReport}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampling Techniques</label>
              <input
                type="text"
                value={deboningData.samplingTechnique}
                onChange={(e) => setDeboningData({...deboningData, samplingTechnique: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!generatedReport}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">S.No.</th>
                    <th className="border border-gray-300 px-3 py-2">SAMPLING AREA</th>
                    <th className="border border-gray-300 px-3 py-2">WORKER NAME</th>
                    <th className="border border-gray-300 px-3 py-2">APC<br/>Average cfu/glove</th>
                    <th className="border border-gray-300 px-3 py-2">COLIFORM<br/>Cfu/glove</th>
                    {!generatedReport && <th className="border border-gray-300 px-3 py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deboningData.workers.map((worker, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-2 text-center">{worker.sNo}</td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.area}
                          onChange={(e) => {
                            const newWorkers = [...deboningData.workers];
                            newWorkers[idx].area = e.target.value;
                            setDeboningData({...deboningData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.name}
                          onChange={(e) => {
                            const newWorkers = [...deboningData.workers];
                            newWorkers[idx].name = e.target.value;
                            setDeboningData({...deboningData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.apc}
                          onChange={(e) => {
                            const newWorkers = [...deboningData.workers];
                            newWorkers[idx].apc = e.target.value;
                            setDeboningData({...deboningData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={worker.coliform}
                          onChange={(e) => {
                            const newWorkers = [...deboningData.workers];
                            newWorkers[idx].coliform = e.target.value;
                            setDeboningData({...deboningData, workers: newWorkers});
                          }}
                          className="w-full px-2 py-1 text-center border-0 focus:ring-1 focus:ring-blue-500"
                          disabled={!!generatedReport}
                        />
                      </td>
                      {!generatedReport && (
                        <td className="border border-gray-300 p-1 text-center">
                          {deboningData.workers.length > 1 && (
                            <button
                              onClick={() => removeDeboningRow(idx)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={loading || !!generatedReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
          >
            <FileCheck className="w-5 h-5" />
            {loading ? 'Generating...' : generatedReport ? 'Report Generated' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReport;
