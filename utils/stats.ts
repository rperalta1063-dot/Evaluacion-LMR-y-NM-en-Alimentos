
import { Stats, NormalityResults, ComplianceLevel, TrendAnalysis, TrendPoint } from '../types';

export const EPS = 1e-12;

export function erf(x: number): number {
  const s = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.5 * x);
  const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return s * y;
}

export const cdfN = (x: number, mu: number, sd: number): number => 0.5 * (1 + erf((x - mu) / (Math.max(sd, EPS) * Math.SQRT2)));

export const invErf = (x: number): number => {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const s = (2 / (Math.PI * a) + ln / 2);
  const t = Math.sqrt(s * s - ln / a);
  return Math.sign(x) * Math.sqrt(t - s);
};

export const invCdfN = (p: number): number => Math.SQRT2 * invErf(2 * p - 1);

export const densN = (x: number, mu: number, sd: number): number =>
  (1 / (Math.max(sd, EPS) * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / Math.max(sd, EPS)) ** 2);

export const densLN = (x: number, mu: number, sd: number): number =>
  x <= 0 ? 0 : (1 / (x * Math.max(sd, EPS) * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((Math.log(x) - mu) / Math.max(sd, EPS)) ** 2);

export function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let i = 0; i < 6; i++) ser += c[i] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

export function regularizedLowerIncompleteGamma(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    for (let i = 1; i < 100; i++) {
      term *= x / (a + i);
      sum += term;
      if (term < sum * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    let b = x + 1 - a;
    let c = 1 / EPS;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < EPS) d = EPS;
      c = b + an / c;
      if (Math.abs(c) < EPS) c = EPS;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return 1 - h * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
}

export function cdfGamma(x: number, shape: number, scale: number): number {
  if (x <= 0) return 0;
  return regularizedLowerIncompleteGamma(shape, x / scale);
}

export function densGamma(x: number, shape: number, scale: number): number {
  if (x <= 0) return 0;
  return Math.exp((shape - 1) * Math.log(x) - x / scale - shape * Math.log(scale) - logGamma(shape));
}

export function getDescStats(data: number[]): Stats {
  const n = data.length;
  if (n === 0) {
    return {
      n: 0, mean: 0, median: 0, mode: 0, sd: 0, sem: 0, min: 0, max: 0, q1: 0, q3: 0,
      sorted: [], skewness: 0, kurtosis: 0, randomError: 0
    };
  }

  let sum = 0;
  let min = data[0];
  let max = data[0];
  const frequency = new Map<number, number>();
  let maxFreq = 0;
  let modes: number[] = [];

  for (let i = 0; i < n; i++) {
    const v = data[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;

    const freq = (frequency.get(v) || 0) + 1;
    frequency.set(v, freq);
    if (freq > maxFreq) {
      maxFreq = freq;
      modes = [v];
    } else if (freq === maxFreq) {
      modes.push(v);
    }
  }

  const mean = sum / n;
  let sumSqDiff = 0;
  let sumCuDiff = 0;
  let sumQuDiff = 0;

  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean;
    const diffSq = diff * diff;
    sumSqDiff += diffSq;
    sumCuDiff += diffSq * diff;
    sumQuDiff += diffSq * diffSq;
  }

  const variance = sumSqDiff / n;
  const sd = Math.sqrt(variance);
  const sem = sd / Math.sqrt(Math.max(n, 1));
  
  const sorted = [...data].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const q1 = sorted[Math.floor((n - 1) * 0.25)];
  const q3 = sorted[Math.floor((n - 1) * 0.75)];

  const skewness = sd > EPS ? (sumCuDiff / n) / (sd ** 3) : 0;
  const kurtosis = sd > EPS ? (sumQuDiff / n) / (sd ** 4) - 3 : 0;
  const randomError = sem;

  return { 
    n, mean, median, mode: modes[0], sd, sem, min, max, q1, q3, sorted,
    skewness, kurtosis, randomError 
  };
}

export function getPercentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const r = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(r), hi = Math.ceil(r);
  if (lo === hi) return sorted[lo];
  const w = r - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function getRiskLevel(compliancePercent: number): ComplianceLevel {
  const nc = 100 - compliancePercent;
  if (nc > 10) return { level: 'Alto Riesgo', className: 'bg-red-100 text-red-700 border-red-200', description: 'Más del 10% de los resultados está sobre el límite (NC > 10%).' };
  if (nc > 5) return { level: 'Riesgo Medio', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: 'Entre 5% y 10% de los resultados está sobre el límite (5% < NC ≤ 10%).' };
  return { level: 'Bajo Riesgo', className: 'bg-green-100 text-green-700 border-green-200', description: 'Menos del 5% de los resultados está sobre el límite (NC ≤ 5%).' };
}

export function calculateADNormal(data: number[], st: Stats): number {
  const n = data.length;
  if (n < 3) return NaN;
  const z = st.sorted.map(x => (x - st.mean) / Math.max(st.sd, EPS));
  const F = z.map(x => cdfN(x, 0, 1));
  let A2 = -n;
  for (let i = 0; i < n; i++) {
    const Fi = F[i], Fni = 1 - F[n - 1 - i];
    A2 -= (1 / n) * ((2 * i + 1) * (Math.log(Math.max(Fi, EPS)) + Math.log(Math.max(Fni, EPS))));
  }
  return A2;
}

export function adPValue(A2: number, n: number): number {
  if (n < 5 || !isFinite(A2)) return NaN;
  const A_star = A2 * (1 + 0.75 / n + 2.25 / n ** 2);
  if (A_star >= 0.6) return 1 / (1 + Math.exp(1.77 - 2.87 * A_star));
  if (A_star >= 0.34) return 1 / (1 + Math.exp(1.2937 - 5.709 * A_star + 0.0186 * A_star ** 2));
  if (A_star >= 0.2) return 1 / (1 + Math.exp(0.814 - 4.088 * A_star + 1.25 * A_star ** 2));
  return 1 / (1 + Math.exp(0.536 - 2.86 * A_star + 1.625 * A_star ** 2));
}

export function calculateSWNormal(st: Stats): number {
  const n = st.sorted.length;
  if (n < 3) return NaN;
  const z_theo = st.sorted.map((_, i) => invCdfN((i + 0.5) / n));
  const sum_sq_resid = st.sorted.reduce((sum, y, i) => sum + (y - (st.mean + z_theo[i] * st.sd)) ** 2, 0);
  const sum_sq_total = st.sorted.reduce((sum, y) => sum + (y - st.mean) ** 2, 0);
  return 1 - (sum_sq_resid / (sum_sq_total || EPS));
}

export function swPValue(W: number, n: number): number {
  if (n < 4 || !isFinite(W)) return NaN;
  const log_w = Math.log(1 - W);
  const mu = -2.0 + 1.25 * Math.log(n) - 0.5 * Math.log(n) ** 2;
  return cdfN((log_w - mu) / 1.0, 0, 1);
}

export function calculateTrend(points: { date: string, value: number }[]): TrendAnalysis | undefined {
  if (points.length < 2) return undefined;

  const trendPoints: TrendPoint[] = points
    .map(p => ({ ...p, timestamp: new Date(p.date).getTime() }))
    .filter(p => !isNaN(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (trendPoints.length < 2) return undefined;

  const n = trendPoints.length;
  const x = trendPoints.map(p => p.timestamp);
  const y = trendPoints.map(p => p.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - (slope * x[i] + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  // Prediction for 30 days in the future
  const lastTimestamp = x[n - 1];
  const forecastTimestamp = lastTimestamp + (30 * 24 * 60 * 60 * 1000);
  const prediction = slope * forecastTimestamp + intercept;
  const forecastDate = new Date(forecastTimestamp).toISOString().split('T')[0];

  return {
    slope,
    intercept,
    r2,
    prediction: Math.max(0, prediction),
    isIncreasing: slope > 0,
    points: trendPoints,
    forecastDate
  };
}

export const seq = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
