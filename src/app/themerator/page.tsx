import React from 'react';
import Themerator from '@/components/themerator/themerator';

export default function ThemeratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Themerator</h1>
      <Themerator />
    </div>
  );
}