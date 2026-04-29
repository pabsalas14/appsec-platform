import { Suspense } from 'react';

import { CodeSecurityReviewDetail } from '@/components/code-security/CodeSecurityReviewDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CodeSecurityReviewDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-6">Loading review details...</div>}>
      <CodeSecurityReviewDetail reviewId={id} />
    </Suspense>
  );
}