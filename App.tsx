
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ScatterController,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Download, 
  Trash2, 
  Play, 
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Activity,
  Maximize2,
  Minimize2,
  Hash,
  Moon,
  Sun,
  BookOpen
} from 'lucide-react';
import { Metadata, EvaluationResult, Stats, NormalityResults } from './types';
import * as statsUtil from './utils/stats';
import UserManual from './src/components/UserManual';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ScatterController,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const formatSig = (val: number): string => {
  if (val === 0) return "0.0";
  if (isNaN(val) || !isFinite(val)) return "N/A";
  const absVal = Math.abs(val);
  if (absVal >= 1) return val.toFixed(1);
  const decimals = Math.max(1, Math.ceil(-Math.log10(absVal)));
  return val.toFixed(decimals);
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [metadata, setMetadata] = useState<Metadata>({
    contaminant: 'Plomo (Pb)',
    food: 'Espinaca fresca',
    site: 'Región Occidental',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    units: 'mg/kg',
    limitX: 0.05
  });

  const [dataInput, setDataInput] = useState<string>('0.04, 0.06, 0.03, 0.05, 0.08, 0.04, 0.02, 0.01, 0.02, 0.03, 0.07, 0.05, 0.06, 0.03, 0.02');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleEvaluate = () => {
    const rawData = dataInput.split(/[\n,;\s]+/)
      .map(s => s.trim().replace(',', '.'))
      .filter(Boolean)
      .map(Number)
      .filter(v => isFinite(v));

    if (rawData.length < 3) {
      alert("Por favor ingrese al menos 3 valores válidos.");
      return;
    }

    const st = statsUtil.getDescStats(rawData);
    const X = metadata.limitX;

    const A2 = statsUtil.calculateADNormal(rawData, st);
    const PAD = statsUtil.adPValue(A2, st.n);
    const W = statsUtil.calculateSWNormal(st);
    const PSW = statsUtil.swPValue(W, st.n);
    
    let isNormal = (PAD >= 0.05 && PSW >= 0.05);
    let normNote = isNormal 
      ? 'Los datos siguen una distribución Normal (α=0.05).' 
      : (PAD < 0.05 && PSW < 0.05) 
        ? 'Los datos NO siguen una distribución Normal (α=0.05).' 
        : 'Resultados inconsistentes de normalidad. Use con precaución.';

    const normality: NormalityResults = { A2, PAD, W, PSW, isNormal, note: normNote };

    const pEmp = (rawData.filter(v => v <= X).length / st.n) * 100;
    
    const pos = rawData.filter(v => v > 0);
    const muLog = pos.length ? pos.map(Math.log).reduce((a, b) => a + b, 0) / pos.length : NaN;
    const sdLog = pos.length ? Math.sqrt(pos.map(v => Math.log(v)).reduce((a, b) => a + (b - muLog) ** 2, 0) / pos.length) : NaN;
    
    const pNormal = statsUtil.cdfN(X, st.mean, st.sd) * 100;
    const pLog = isFinite(sdLog) ? statsUtil.cdfN(Math.log(X), muLog, sdLog) * 100 : 0;

    const evalResult: EvaluationResult = {
      stats: st,
      metadata: { ...metadata },
      normality,
      pEmp,
      pNormal,
      pLog,
      muLog,
      sdLog,
      zNormal: (X - st.mean) / Math.max(st.sd, statsUtil.EPS),
      zLog: isFinite(sdLog) ? (Math.log(X) - muLog) / Math.max(sdLog, statsUtil.EPS) : NaN,
      empiricalRisk: statsUtil.getRiskLevel(pEmp),
      normalRisk: statsUtil.getRiskLevel(pNormal),
      logNormalRisk: statsUtil.getRiskLevel(pLog),
      percentiles: [
        { label: 'P25', value: statsUtil.getPercentile(st.sorted, 25), percent: 25, complies: X >= statsUtil.getPercentile(st.sorted, 25) },
        { label: 'P50', value: statsUtil.getPercentile(st.sorted, 50), percent: 50, complies: X >= statsUtil.getPercentile(st.sorted, 50) },
        { label: 'P75', value: statsUtil.getPercentile(st.sorted, 75), percent: 75, complies: X >= statsUtil.getPercentile(st.sorted, 75) },
        { label: 'P90', value: statsUtil.getPercentile(st.sorted, 90), percent: 90, complies: X >= statsUtil.getPercentile(st.sorted, 90) },
        { label: 'P95', value: statsUtil.getPercentile(st.sorted, 95), percent: 95, complies: X >= statsUtil.getPercentile(st.sorted, 95) },
        { label: 'P99', value: statsUtil.getPercentile(st.sorted, 99), percent: 99, complies: X >= statsUtil.getPercentile(st.sorted, 99) }
      ]
    };

    setResult(evalResult);
    
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExportXLSX = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Metadato', 'Valor'],
      ['Contaminante', result.metadata.contaminant],
      ['Alimento', result.metadata.food],
      ['Sitio', result.metadata.site],
      ['Fecha Desde', result.metadata.dateFrom],
      ['Fecha Hasta', result.metadata.dateTo],
      ['Unidades', result.metadata.units],
      ['Límite X', result.metadata.limitX],
      [],
      ['Estadístico', 'Valor'],
      ['n', result.stats.n],
      ['Media', result.stats.mean],
      ['Mediana', result.stats.median],
      ['DE', result.stats.sd],
      ['Min', result.stats.min],
      ['Max', result.stats.max],
      ['Asimetría', result.stats.skewness],
      ['Curtosis', result.stats.kurtosis],
      ['Error Aleatorio', result.stats.randomError],
      [],
      ['Cumplimiento', '%'],
      ['Empírico', result.pEmp],
      ['Normal', result.pNormal],
      ['Log-normal', result.pLog]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, `Evaluacion_${result.metadata.contaminant}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Evaluación de Contaminantes', 20, 20);
    doc.setFontSize(10);
    doc.text(`Periodo: Del ${result.metadata.dateFrom} al ${result.metadata.dateTo}`, 20, 28);
    doc.setFontSize(12);
    doc.text(`Contaminante: ${result.metadata.contaminant}`, 20, 40);
    doc.text(`Alimento: ${result.metadata.food}`, 20, 47);
    doc.text(`Límite X: ${result.metadata.limitX} ${result.metadata.units}`, 20, 54);
    doc.text(`Cumplimiento Empírico: ${result.pEmp.toFixed(2)}%`, 20, 65);
    doc.text(`Estado: ${result.empiricalRisk.level}`, 20, 72);
    doc.save(`Reporte_${result.metadata.contaminant}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-200 dark:shadow-cyan-900/20">
              <LayoutDashboard size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Evaluador de Contaminantes</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Análisis avanzado de límites máximos (Valor X)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsManualOpen(true)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
              title="Manual de Uso"
            >
              <BookOpen size={20} className="text-cyan-600" />
              <span className="hidden sm:inline text-sm font-semibold">Manual</span>
            </button>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">
                <Database size={20} className="text-cyan-600" />
                Datos del Muestreo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Contaminante</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-slate-200"
                    value={metadata.contaminant}
                    onChange={e => setMetadata({...metadata, contaminant: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Alimento</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-slate-200"
                    value={metadata.food}
                    onChange={e => setMetadata({...metadata, food: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ubicación / Sitio</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-slate-200"
                    value={metadata.site}
                    onChange={e => setMetadata({...metadata, site: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Fecha del Muestreo
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Del</span>
                    <input 
                      type="date"
                      className="flex-1 min-w-0 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm dark:text-slate-200"
                      value={metadata.dateFrom}
                      onChange={e => setMetadata({...metadata, dateFrom: e.target.value})}
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">al</span>
                    <input 
                      type="date"
                      className="flex-1 min-w-0 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm dark:text-slate-200"
                      value={metadata.dateTo}
                      onChange={e => setMetadata({...metadata, dateTo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Límite X</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono dark:text-slate-200"
                      value={metadata.limitX}
                      onChange={e => setMetadata({...metadata, limitX: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Unidades</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-slate-200"
                      value={metadata.units}
                      onChange={e => setMetadata({...metadata, units: e.target.value})}
                    >
                      <option value="mg/kg">mg/kg</option>
                      <option value="µg/kg">µg/kg</option>
                      <option value="ppm">ppm</option>
                      <option value="ppb">ppb</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">
                <FileText size={20} className="text-cyan-600" />
                Valores del Ensayo
              </h2>
              <textarea 
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono text-sm dark:text-slate-200"
                placeholder="Ej: 0.012, 0.045, 0.033..."
                value={dataInput}
                onChange={e => setDataInput(e.target.value)}
              ></textarea>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">Soporta valores separados por comas, espacios o saltos de línea.</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleEvaluate}
              className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-100 dark:shadow-cyan-900/20 transition-all active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              EVALUAR RESULTADOS
            </button>
            
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={handleExportPDF}
                  disabled={!result}
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download size={18} className="text-red-500" />
                  PDF
                </button>
                <button 
                  onClick={handleExportXLSX}
                  disabled={!result}
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download size={18} className="text-green-600" />
                  EXCEL
                </button>
            </div>

            <button 
              onClick={() => { setDataInput(''); setResult(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-xl transition-all"
            >
              <Trash2 size={18} />
              Limpiar Datos
            </button>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Info size={14} className="text-cyan-600" /> Referencia de Riesgo
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200 dark:shadow-green-900/30"></span>
                  <span className="text-slate-600 dark:text-slate-300"><b>Bajo:</b> Cumplimiento &gt; 95%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-200 dark:shadow-yellow-900/30"></span>
                  <span className="text-slate-600 dark:text-slate-300"><b>Medio:</b> Cumplimiento 90% - 95%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200 dark:shadow-red-900/30"></span>
                  <span className="text-slate-600 dark:text-slate-300"><b>Alto:</b> Cumplimiento &lt; 90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Dashboard */}
        {result && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative pt-4">
               <div className="absolute inset-0 flex items-center" aria-hidden="true">
                 <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
               </div>
               <div className="relative flex justify-start">
                 <span className="pr-4 bg-slate-50 dark:bg-slate-950 text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter transition-colors">Resultados</span>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               <StatCard label="Media" value={formatSig(result.stats.mean)} icon={<TrendingUp size={16}/>} color="cyan" isDark={isDark} />
               <StatCard label="Moda" value={formatSig(result.stats.mode)} icon={<Hash size={16}/>} color="indigo" isDark={isDark} />
               <StatCard label="Desv. Estándar" value={formatSig(result.stats.sd)} icon={<Activity size={16}/>} color="slate" isDark={isDark} />
               <StatCard label="Mínimo" value={formatSig(result.stats.min)} icon={<Minimize2 size={16}/>} color="slate" isDark={isDark} />
               <StatCard label="Máximo" value={formatSig(result.stats.max)} icon={<Maximize2 size={16}/>} color="slate" isDark={isDark} />
               <StatCard label="Asimetría" value={formatSig(result.stats.skewness)} icon={<Activity size={16}/>} color="yellow" isDark={isDark} />
               <StatCard label="Curtosis" value={formatSig(result.stats.kurtosis)} icon={<Activity size={16}/>} color="yellow" isDark={isDark} />
               <StatCard label="Error Aleat." value={formatSig(result.stats.randomError)} icon={<AlertTriangle size={16}/>} color="red" isDark={isDark} />
               <StatCard label="Muestras (n)" value={result.stats.n} icon={<FileText size={16}/>} color="indigo" isDark={isDark} />
               <StatCard label="Cumplimiento" value={`${result.pEmp.toFixed(1)}%`} icon={<CheckCircle size={16}/>} color={result.pEmp > 95 ? 'green' : result.pEmp > 90 ? 'yellow' : 'red'} isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <BarChart3 size={20} className="text-cyan-600" />
                   Distribución de Frecuencias
                 </h3>
                 <div className="h-[300px]">
                   <HistogramChart result={result} isDark={isDark} />
                 </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <Info size={20} className="text-cyan-600" />
                   Probabilidad de Cumplimiento (X ≤ {result.metadata.limitX})
                 </h3>
                 <div className="space-y-4">
                   <ComplianceRow label="Prueba Empírica" percent={result.pEmp} risk={result.empiricalRisk} isDark={isDark} />
                   <ComplianceRow label="Modelo Normal" percent={result.pNormal} risk={result.normalRisk} isDark={isDark} />
                   <ComplianceRow label="Modelo Log-normal" percent={result.pLog} risk={result.logNormalRisk} isDark={isDark} />
                   
                   <div className={`mt-6 p-4 rounded-xl border ${result.normality.isNormal ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30 text-green-800 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30 text-orange-800 dark:text-orange-400'}`}>
                      <div className="flex gap-3">
                         <AlertTriangle size={20} className="shrink-0" />
                         <div>
                           <p className="font-bold text-sm">Prueba de Normalidad</p>
                           <p className="text-xs mt-1 leading-relaxed opacity-90">{result.normality.note}</p>
                           <p className="text-[10px] mt-2 font-mono opacity-80">AD: {result.normality.A2.toFixed(3)} (p={result.normality.PAD.toFixed(3)}) | SW: {result.normality.W.toFixed(3)} (p={result.normality.PSW.toFixed(3)})</p>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <TrendingUp size={20} className="text-green-600" />
                   Modelo Normal: Áreas de Cumplimiento
                 </h3>
                 <div className="h-[350px]">
                   <DistributionAreaChart result={result} type="normal" isDark={isDark} />
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <TrendingUp size={20} className="text-indigo-600" />
                   Modelo Log-normal: Áreas de Cumplimiento
                 </h3>
                 <div className="h-[350px]">
                   <DistributionAreaChart result={result} type="lognormal" isDark={isDark} />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Tabla de Percentiles</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="border-b border-slate-100 dark:border-slate-800">
                         <th className="py-2 font-bold text-slate-400 dark:text-slate-500">Referencia</th>
                         <th className="py-2 font-bold text-slate-400 dark:text-slate-500 text-right">Valor</th>
                         <th className="py-2 font-bold text-slate-400 dark:text-slate-500 text-right">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {result.percentiles.map(p => (
                         <tr key={p.label}>
                           <td className="py-3 font-medium text-slate-600 dark:text-slate-300">{p.label}</td>
                           <td className="py-3 text-right font-mono text-slate-800 dark:text-slate-200">{formatSig(p.value)}</td>
                           <td className="py-3 text-right">
                             {p.complies ? (
                               <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Cumple</span>
                             ) : (
                               <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Sobre X</span>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <BarChart3 size={20} className="text-indigo-600" />
                   Gráfico Q-Q (Cuantiles)
                 </h3>
                 <div className="h-[300px]">
                   <QQChart result={result} isDark={isDark} />
                 </div>
              </div>
            </div>

            {/* Sección Resumen Técnico - Blanca Adaptativa */}
            <div className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                <div className="max-w-xl">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Resumen Técnico de Evaluación</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Evaluación de <b className="text-slate-700 dark:text-slate-200">{result.metadata.contaminant}</b> en <b className="text-slate-700 dark:text-slate-200">{result.metadata.food}</b>.
                    Periodo de muestreo: <b className="text-slate-700 dark:text-slate-200">Del {result.metadata.dateFrom} al {result.metadata.dateTo}</b>.
                    El límite normativo establecido es <b className="text-slate-700 dark:text-slate-200">{result.metadata.limitX} {result.metadata.units}</b>.
                  </p>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Mínimo / Máximo</p>
                       <p className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{formatSig(result.stats.min)} / {formatSig(result.stats.max)}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Desv. Estándar</p>
                       <p className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{formatSig(result.stats.sd)}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Valor Z (Normal)</p>
                       <p className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{result.zNormal.toFixed(3)}</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Nivel Alerta</p>
                       <p className={`font-bold ${result.empiricalRisk.level === 'Bajo Riesgo' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{result.empiricalRisk.level}</p>
                     </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0 w-full md:w-auto transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">ID de Operación</p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-xs mb-6 opacity-70">OP-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  <div className="flex gap-2">
                    <button onClick={handleExportPDF} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-300 dark:border-slate-600">Reporte PDF</button>
                    <button onClick={handleExportXLSX} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-300 dark:border-slate-600">Excel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer className="mt-16 text-center text-slate-400 dark:text-slate-600 text-xs py-8 transition-colors">
          &copy; {new Date().getFullYear()} FoodStats Pro &middot; Análisis Estadístico de Contaminantes Alimentarios
        </footer>
      </div>

      <UserManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </div>
  );
};

const StatCard: React.FC<{label: string, value: string | number, icon: React.ReactNode, color: string, isDark: boolean}> = ({label, value, icon, color, isDark}) => {
  const lightColors: Record<string, string> = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const darkColors: Record<string, string> = {
    cyan: "bg-slate-900 text-cyan-400 border-cyan-900/30",
    indigo: "bg-slate-900 text-indigo-400 border-indigo-900/30",
    slate: "bg-slate-900 text-slate-300 border-slate-800",
    green: "bg-slate-900 text-green-400 border-green-900/30",
    yellow: "bg-slate-900 text-yellow-400 border-yellow-900/30",
    red: "bg-slate-900 text-red-400 border-red-900/30",
  };

  const activeColorSet = isDark ? darkColors : lightColors;

  return (
    <div className={`p-4 rounded-2xl border ${activeColorSet[color] || activeColorSet.slate} shadow-sm bg-white dark:bg-slate-900 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 truncate pr-1">{label}</span>
        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0 border border-slate-100 dark:border-slate-700 transition-colors">{icon}</div>
      </div>
      <p className="text-xl font-black truncate text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

const ComplianceRow: React.FC<{label: string, percent: number, risk: any, isDark: boolean}> = ({label, percent, risk, isDark}) => (
  <div className="flex items-center gap-4">
    <div className="flex-1">
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-500 dark:text-slate-400 uppercase">{label}</span>
        <span className="text-slate-800 dark:text-slate-200">{percent.toFixed(2)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
        <div 
          className={`h-full transition-all duration-1000 ${percent > 95 ? 'bg-green-500' : percent > 90 ? 'bg-yellow-500' : 'bg-red-500'}`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
    <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-tight min-w-[100px] text-center transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : risk.className}`}>
      {risk.level}
    </div>
  </div>
);

const getChartThemeOptions = (isDark: boolean) => ({
  textColor: isDark ? '#94a3b8' : '#64748b',
  gridColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.5)',
});

const DistributionAreaChart: React.FC<{result: EvaluationResult, type: 'normal' | 'lognormal', isDark: boolean}> = ({result, type, isDark}) => {
  const {stats, metadata, muLog, sdLog} = result;
  const limitX = metadata.limitX;
  const { textColor, gridColor } = getChartThemeOptions(isDark);
  
  let xMin, xMax;
  if (type === 'normal') {
    xMin = stats.mean - 4 * stats.sd;
    xMax = stats.mean + 4 * stats.sd;
  } else {
    xMin = Math.exp(muLog - 4 * sdLog);
    xMax = Math.exp(muLog + 4 * sdLog);
  }

  xMin = Math.min(xMin, limitX * 0.5);
  xMax = Math.max(xMax, limitX * 1.5);
  if (xMin < 0 && type === 'lognormal') xMin = 0.0001;

  const points = 100;
  const step = (xMax - xMin) / points;
  const labels: string[] = [];
  const complianceData: (number | null)[] = [];
  const nonComplianceData: (number | null)[] = [];

  for (let i = 0; i <= points; i++) {
    const x = xMin + i * step;
    labels.push(x.toFixed(4));
    
    const density = type === 'normal' 
      ? statsUtil.densN(x, stats.mean, stats.sd)
      : statsUtil.densLN(x, muLog, sdLog);

    if (x <= limitX) {
      complianceData.push(density);
      nonComplianceData.push(null);
    } else {
      if (nonComplianceData.length > 0 && nonComplianceData[nonComplianceData.length - 1] === null && complianceData[complianceData.length -1] !== null) {
          nonComplianceData[nonComplianceData.length - 1] = density;
      }
      complianceData.push(null);
      nonComplianceData.push(density);
    }
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Área de Cumplimiento',
        data: complianceData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.4)',
        fill: 'origin',
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Área de No Cumplimiento',
        data: nonComplianceData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.4)',
        fill: 'origin',
        pointRadius: 0,
        tension: 0.3,
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, usePointStyle: true, color: textColor }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'Densidad', color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      x: { 
        title: { display: true, text: metadata.units, color: textColor }, 
        ticks: { maxTicksLimit: 10, color: textColor },
        grid: { color: gridColor }
      }
    }
  };

  return <Chart type="line" data={data} options={options} />;
};

const HistogramChart: React.FC<{result: EvaluationResult, isDark: boolean}> = ({result, isDark}) => {
  const {stats, metadata} = result;
  const { textColor, gridColor } = getChartThemeOptions(isDark);
  const nBins = Math.min(20, Math.max(8, Math.round(Math.sqrt(stats.n))));
  const range = stats.max - stats.min;
  const binWidth = range / nBins || statsUtil.EPS;
  
  const bins = new Array(nBins).fill(0);
  stats.sorted.forEach(v => {
    let idx = Math.floor((v - stats.min) / binWidth);
    if (idx >= nBins) idx = nBins - 1;
    bins[idx]++;
  });

  const labels = Array.from({length: nBins}, (_, i) => (stats.min + i * binWidth).toFixed(3));
  
  const normalPoints = statsUtil.seq(stats.min, stats.max, 50).map(x => ({
    x: x.toFixed(3),
    y: statsUtil.densN(x, stats.mean, stats.sd) * stats.n * binWidth
  }));

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Frecuencia Absoluta',
        data: bins,
        backgroundColor: isDark ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.4)',
        borderColor: 'rgba(6, 182, 212, 1)',
        borderWidth: 1,
        order: 2
      },
      {
        type: 'line' as const,
        label: 'Curva Normal',
        data: normalPoints.map(p => p.y),
        borderColor: isDark ? 'rgba(129, 140, 248, 0.9)' : 'rgba(99, 102, 241, 0.8)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false,
        order: 1
      },
      {
        type: 'line' as const,
        label: `Límite X (${metadata.limitX})`,
        data: labels.map(() => null),
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
      }
    ]
  };

  return <Chart type="bar" data={data} options={{ 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { position: 'bottom', labels: { color: textColor } } 
    },
    scales: {
      y: { ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { color: gridColor } }
    }
  }} />;
};

const QQChart: React.FC<{result: EvaluationResult, isDark: boolean}> = ({result, isDark}) => {
  const {stats} = result;
  const { textColor, gridColor } = getChartThemeOptions(isDark);
  const n = stats.sorted.length;
  const probs = stats.sorted.map((_, i) => (i + 0.5) / n);
  const zTheo = probs.map(p => statsUtil.invCdfN(p));
  const theo = zTheo.map(z => stats.mean + z * stats.sd);
  
  const scatterData = theo.map((t, i) => ({ x: t, y: stats.sorted[i] }));
  const min = Math.min(theo[0], stats.sorted[0]);
  const max = Math.max(theo[n-1], stats.sorted[n-1]);
  
  const data = {
    datasets: [
      {
        label: 'Cuantiles',
        data: scatterData,
        backgroundColor: isDark ? 'rgba(129, 140, 248, 0.9)' : 'rgba(79, 70, 229, 0.8)',
        pointRadius: 4,
      },
      {
        label: 'Referencia y=x',
        data: [{x: min, y: min}, {x: max, y: max}],
        type: 'line' as const,
        borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.5)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      }
    ]
  };

  return (
    <Chart 
      type="scatter" 
      data={data as any} 
      options={{ 
        maintainAspectRatio: false, 
        scales: { 
          x: { 
            title: { display: true, text: 'Cuantiles Teóricos', color: textColor },
            ticks: { color: textColor },
            grid: { color: gridColor }
          }, 
          y: { 
            title: { display: true, text: 'Cuantiles Observados', color: textColor },
            ticks: { color: textColor },
            grid: { color: gridColor }
          } 
        },
        plugins: { legend: { display: false } }
      }} 
    />
  );
};

export default App;
