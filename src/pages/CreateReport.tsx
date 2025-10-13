import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileCheck, Plus, Trash2, AlertCircle, CheckCircle, Save, FileDown, Printer } from 'lucide-react';
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
  const [meatStatus, setMeatStatus] = useState('COMPLETED');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [reportType, setReportType] = useState<'meat' | 'air' | 'water' | 'foodhandler' | 'foodsurface' | 'deboning'>('meat');
  const [showSuccess, setShowSuccess] = useState(false);

  const [airQualityData, setAirQualityData] = useState({
    sampleType: 'Air Quality Monitoring',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
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
    activity: 'Microbiological Testing of Food Handling Person\'s Hands that comes in contact with Food.',
    department: 'Beef Plant 1',
    samplingTechnique: 'Finger Print Technique/ Swab Technique',
    workers: [
      { sNo: '1', area: 'Cattle Box Area', name: 'rizwan', apc: '16', coliform: 'NIL' },
      { sNo: '2', area: 'Fore Hook Cutting Lift 1', name: 'adil', apc: '12', coliform: 'NIL' },
      { sNo: '3', area: 'Hind Hook Cutting Lift 2', name: 'hamid', apc: '14', coliform: 'NIL' },
    ],
  });

  const [foodSurfaceData, setFoodSurfaceData] = useState({
    sampleType: 'Food Surface Testing',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    activity: 'Microbiological Testing of Food Contact Surfaces',
    department: 'Beef Plant 1',
    samplingTechnique: 'Swab Technique',
    surfaces: [
      { sNo: '1', area: 'Cattle Box Area', apc: '18', coliform: 'Nil' },
      { sNo: '2', area: 'Fore Hook Cutting Lift 1', apc: '22', coliform: 'Nil' },
      { sNo: '3', area: 'Hind Hook Cutting Lift 2', apc: '23', coliform: 'Nil' },
    ],
  });

  const [deboningData, setDeboningData] = useState({
    sampleType: 'Deboning Testing',
    sampleCode: '',
    collectionDate: '',
    reportDate: '',
    supplier: '',
    status: 'COMPLETED',
    activity: 'Microbiological Testing of Deboning Food Handlers',
    department: 'Deboning',
    samplingTechnique: 'Finger Print Technique/ Swab Technique',
    workers: [
      { sNo: '1', area: 'Deboning Tray # 1', name: 'shameer', apc: '22', coliform: 'NIL' },
      { sNo: '2', area: 'Deboning Tray # 2', name: 'naveed', apc: '15', coliform: 'NIL' },
      { sNo: '3', area: 'Deboning Tray # 3', name: 'ahsan', apc: '19', coliform: 'NIL' },
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
          user_id: user.id,
          pdf_url: `${sampleCode}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
          generated_by: user.id,
        })
        .select(`
          *,
          sample:samples(
            *,
            test_result:test_results(*)
          ),
          generated_by_user:generated_by(*)
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
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      if (onReportGenerated) {
        setTimeout(() => {
          onReportGenerated();
        }, 2000);
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

  const reportTypes = [
    { id: 'meat', label: 'Meat Report', color: 'red' },
    { id: 'air', label: 'Air Quality', color: 'blue' },
    { id: 'water', label: 'Water Quality', color: 'cyan' },
    { id: 'foodhandler', label: 'Food Handler', color: 'green' },
    { id: 'foodsurface', label: 'Food Surface', color: 'orange' },
    { id: 'deboning', label: 'Deboning', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Report Generated Successfully!</p>
            <p className="text-sm opacity-90">Redirecting to Reports section...</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg border border-blue-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <FileCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Create Microbiological Report</h2>
            <p className="text-gray-600 mt-1">Generate comprehensive laboratory testing reports</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Report Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                disabled={!!generatedReport}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  reportType === type.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {generatedReport && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-green-800 text-lg">Report Generated Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Sample: <span className="font-semibold">{generatedReport.sample.sample_code}</span> |
                  Supplier: <span className="font-semibold">{generatedReport.sample.source}</span>
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAction('download')}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 shadow-md"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleAction('print')}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gray-700 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sample Type <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter sample type"
                disabled={!!generatedReport}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sample Code <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter sample code"
                disabled={!!generatedReport}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Collection Date <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={!!generatedReport}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Date <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={!!generatedReport}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter supplier name"
                disabled={!!generatedReport}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={!!generatedReport}
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
              </select>
            </div>
          </div>

          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {reportType === 'meat' ? 'Meat Sample Data' :
                 reportType === 'air' ? 'Air Quality Data' :
                 reportType === 'water' ? 'Water Quality Data' :
                 reportType === 'foodhandler' ? 'Food Handler Data' :
                 reportType === 'foodsurface' ? 'Food Surface Data' :
                 'Deboning Data'}
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
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              )}
            </div>

            {reportType === 'meat' && (
              <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Sample No</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Species</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">TPC (cfu/g)</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">S.aureus</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Coliforms</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">E.coli O157</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Salmonella</th>
                      <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Comments</th>
                      {!generatedReport && <th className="border border-gray-300 px-3 py-3 text-xs font-semibold text-gray-700">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {sampleRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.sampleNo}
                            onChange={(e) => updateRow(row.id, 'sampleNo', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.species}
                            onChange={(e) => updateRow(row.id, 'species', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.tpc}
                            onChange={(e) => updateRow(row.id, 'tpc', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.sAureus}
                            onChange={(e) => updateRow(row.id, 'sAureus', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.coliforms}
                            onChange={(e) => updateRow(row.id, 'coliforms', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.ecoliO157}
                            onChange={(e) => updateRow(row.id, 'ecoliO157', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.salmonella}
                            onChange={(e) => updateRow(row.id, 'salmonella', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input
                            type="text"
                            value={row.comments}
                            onChange={(e) => updateRow(row.id, 'comments', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border-0 focus:ring-2 focus:ring-blue-500 rounded"
                            disabled={!!generatedReport}
                          />
                        </td>
                        {!generatedReport && (
                          <td className="border border-gray-300 p-1 text-center">
                            {sampleRows.length > 1 && (
                              <button
                                onClick={() => removeRow(row.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
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
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading || !!generatedReport}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 font-semibold text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : generatedReport ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Report Generated
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {!generatedReport && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>All fields marked with <span className="text-red-500 font-semibold">*</span> are required</li>
              <li>Ensure all test values are entered accurately before generating the report</li>
              <li>Generated reports can be downloaded as PDF or printed directly</li>
              <li>Reports are automatically saved to the database for future reference</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReport;
