import { ManagementPageLayout } from '@/components/layout/management-page-layout';
import { ResearchThemesListing } from '@/features/research-themes/components/ResearchThemesListing';
import { createFileRoute } from '@tanstack/react-router';

function validateSearch(search: Record<string, unknown>): {
  page: number;
  search: string;
  level: 'all' | 'masters' | 'doctoral';
} {
  return {
    page: Math.max(1, Number(search.page) || 1),
    search: typeof search.search === 'string' ? search.search : '',
    level: (['masters', 'doctoral'] as const).includes(search.level as 'masters' | 'doctoral')
      ? (search.level as 'masters' | 'doctoral')
      : 'all',
  };
}

export const Route = createFileRoute('/_app/research-themes')({
  validateSearch,
  component: ResearchThemesPage,
});

function ResearchThemesPage() {
  const { page, search, level } = Route.useSearch();

  return (
    <ManagementPageLayout>
      <ResearchThemesListing page={page} search={search} level={level} />
    </ManagementPageLayout>
  );
}
