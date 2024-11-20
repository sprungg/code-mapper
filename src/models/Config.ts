export interface AnalyzerConfig {
  ignore: string[];
  include: string[];
  parsable: string[];
  baseUrl?: string;
  paths?: Record<string, string[]>;
  plugins?: {
    git?: boolean | GitPluginOptions;
  };
}

export interface GitPluginOptions {
  enabled: boolean;
  includeCommitMessage?: boolean;
  maxHistory?: number;
}
