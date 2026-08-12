export type WeightTrendMode = 'actual' | 'average' | 'both';

export interface WeightTrendPoint {
  weight: number | null;
  average: number | null;
}

export const WEIGHT_TREND_MODE_KEY = 'weightNutrition.weightTrendMode';

export function parseWeightTrendMode(value: string | null): WeightTrendMode {
  return value === 'actual' || value === 'average' || value === 'both' ? value : 'both';
}

/** Only visible series contribute to the chart domain, so hidden outliers do not flatten the line. */
export function calculateWeightTrendDomain(points: WeightTrendPoint[], mode: WeightTrendMode): [number, number] | null {
  const values = points.flatMap(point => {
    const visible: Array<number | null> = [];
    if (mode !== 'average') visible.push(point.weight);
    if (mode !== 'actual') visible.push(point.average);
    return visible.filter((value): value is number => value !== null && Number.isFinite(value));
  });

  if (!values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = minimum === maximum ? 0.5 : Math.max(0.25, (maximum - minimum) * 0.15);
  return [minimum - padding, maximum + padding];
}
