export interface PveHostMetrics {
  connected: boolean;
  nodeName: string;
  ip: string;
  cpuPercent: number;
  cpuCores: number;
  cpuModel?: string;
  cpuTempCelsius?: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  ramPercent: number;
  uptimeSeconds: number;
  pveVersion?: string;
}

export interface DockerHostMetrics {
  connected: boolean;
  hostname: string;
  ip: string;
  cpuPercent: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  ramPercent: number;
  loadAverage: number[];
  uptimeSeconds: number;
}

export interface HostMetrics {
  pve: PveHostMetrics;
  dockerHost: DockerHostMetrics;
}

export interface StorageItem {
  id: string;
  mount: string;
  label: string;
  filesystem: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
  status: 'healthy' | 'warning' | 'critical';
  isExternal: boolean;
  smartStatus?: 'PASSED' | 'WARNING' | 'FAILED' | 'UNKNOWN';
}

export interface ContainerMetric {
  id: string;
  shortId: string;
  name: string;
  image: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  status: string;
  cpuPercent: number;
  memoryBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  sparklineCpu: number[];
  sparklineMemory: number[];
  uptime: string;
  ports: string[];
  created: number;
}

export interface CockpitSnapshot {
  timestamp: number;
  host: HostMetrics;
  storage: StorageItem[];
  containers: ContainerMetric[];
  isDemoMode: boolean;
}
