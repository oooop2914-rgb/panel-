import { Suspense } from 'react';
import VerifyClient from './verify-client';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>Memuat...</div>}>
      <VerifyClient />
    </Suspense>
  );
}
