import SettingsClient from './SettingsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | AI Business Finance Tracker',
  description: 'Kelola preferensi akun, integrasi MCP API, format mata uang, dan konfigurasi AI.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
