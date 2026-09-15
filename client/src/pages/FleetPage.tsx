import React from 'react';
import { ContainerGridSection } from '../components/ContainerGridSection.js';
import { ContainerMetric } from '../types.js';
import { PowerAction } from '../components/RestartModal.js';

interface FleetPageProps {
  containers: ContainerMetric[] | undefined;
  isPrivacyMode: boolean;
  onViewLogs: (container: ContainerMetric) => void;
  onPowerAction: (container: ContainerMetric, action: PowerAction) => void;
  onPinContainer: (container: ContainerMetric) => void;
}

export const FleetPage: React.FC<FleetPageProps> = (props) => <ContainerGridSection {...props} />;
