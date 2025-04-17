"use client";

// This page might redirect or show an overview in the future.
// For now, it doesn't need to render the Tabs component anymore.
export default function BillPayPage() {
  // Option 1: Render nothing (or a placeholder)
  return null;

  // Option 2: Redirect (Requires importing redirect from next/navigation)
  // import { redirect } from 'next/navigation';
  // redirect('/bill-pay/transfers'); // Redirect to default sub-page
}
