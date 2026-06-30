// frontend/src/routes/_app/classification/index.tsx
import { createFileRoute } from '@tanstack/react-router';

import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { ClassificationRankingTable } from '@/features/classification/components/ClassificationRankingTable';

export const Route = createFileRoute('/_app/classification/')({
  component: ClassificationPage,
});

function ClassificationPage() {
  return (
    <ManagementPageLayout title="Classificação Final">
      <ClassificationRankingTable />
    </ManagementPageLayout>
  );
}
