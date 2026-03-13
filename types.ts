
export interface Metadata {
  contaminant: string;
  food: string;
  site: string;
  dateFrom: string;
  dateTo: string;
  units: string;
  limitX: number;
}

export interface Stats {
  n: number;
  mean: number;
  median: number;
  mode: number;
  sd: number;
  sem: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  sorted: number[];
  skewness: number;
  kurtosis: number;
  randomError: number;
}

export interface NormalityResults {
  A2: number;
  PAD: number;
  W: number;
  PSW: number;
  isNormal: boolean | null;
  note: string;
}

export interface ComplianceLevel {
  level: string;
  className: string;
  description: string;
}

export interface TrendPoint {
  date: string;
  value: number;
  timestamp: number;
}

export interface TrendAnalysis {
  slope: number;
  intercept: number;
  r2: number;
  prediction: number;
  isIncreasing: boolean;
  points: TrendPoint[];
  forecastDate: string;
}

export interface EvaluationResult {
  stats: Stats;
  metadata: Metadata;
  normality: NormalityResults;
  pEmp: number;
  pNormal: number;
  pLog: number;
  pGamma: number;
  zNormal: number;
  zLog: number;
  muLog: number;
  sdLog: number;
  gammaShape: number;
  gammaScale: number;
  empiricalRisk: ComplianceLevel;
  normalRisk: ComplianceLevel;
  logNormalRisk: ComplianceLevel;
  gammaRisk: ComplianceLevel;
  percentiles: Array<{ label: string; value: number; percent: number; complies: boolean }>;
  trend?: TrendAnalysis;
}

export interface AlertSettings {
  thresholdEnabled: boolean;
  thresholdValue: number;
  meanEnabled: boolean;
  meanValue: number;
  trendEnabled: boolean;
  outlierEnabled: boolean;
  normalityEnabled: boolean;
}

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}
