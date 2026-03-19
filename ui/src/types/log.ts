export interface LogEntry {
  id: number;
  timestamp: string;
  direction: "in" | "out";
  event: string;
  data: unknown;
}
