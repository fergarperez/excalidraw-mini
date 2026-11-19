export interface Stroke {
  id: number;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}
