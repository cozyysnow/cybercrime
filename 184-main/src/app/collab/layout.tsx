import React from 'react';
import type { Metadata } from 'next';
import AuthGate from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'CyberCast // Multi-Agency Collaboration & Command Portal',
  description:
    'Inter-agency operational case coordination, evidence chain custody, and nexus intelligence.',
};

export default function CollabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}
