import React from 'react';
import { ContainerGridSection } from '../components/ContainerGridSection.js';
import { ContainerMetric } from '../types.js';

interface FleetPageProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onRestartContainer: (container: ContainerMetric) => void;
  onPinContainer: (container: ContainerMetric) => void;
}

export const FleetPage: React.FC<FleetPageProps> = (props) => <ContainerGridSection {...props} />;
