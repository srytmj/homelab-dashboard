import React from 'react';
import { SentinelStatus } from '../types.js';
import { SentinelWidget } from '../components/SentinelWidget.js';

interface SentinelPageProps {
  sentinel: SentinelStatus | undefined;
}

export const SentinelPage: React.FC<SentinelPageProps> = ({ sentinel }) => <SentinelWidget sentinel={sentinel} />;
