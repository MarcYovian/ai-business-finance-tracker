import { redirect } from 'next/navigation';
import { FEATURES } from '@/config/features';
import AIAssistantClient from './AIAssistantClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant | AI Business Finance Tracker',
  description: 'Asisten AI pintar untuk pencatatan transaksi, analisis arus kas, dan konsultasi keuangan bisnis.',
};

export default function AIAssistantPage() {
  if (!FEATURES.ENABLE_AI) {
    redirect('/dashboard');
  }

  return <AIAssistantClient />;
}
