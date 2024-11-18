export interface AnalyzerConfig {
  ignore: string[];
  include: string[];
  parsable: string[];
  baseUrl?: string;
  paths?: Record<string, string[]>;
}
