import React from 'react';
import type { Metadata } from 'next';
import AuthGate from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'CyberCast // Tactical Incident Radar Dashboard',
  description:
    'Predictive analytics and real-time cybercrime incident monitoring for Indian Law Enforcement.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}
