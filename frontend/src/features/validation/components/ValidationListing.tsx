import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';

import { ValidationHeader } from '@/features/validation/components/ValidationHeader';
import { ValidationTable } from '@/features/validation/components/ValidationTable';
import { useValidationCandidates } from '@/features/validation/hooks/use-validation';

export function ValidationListing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: response, isLoading } = useValidationCandidates({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });

  const candidates = response?.data ?? [];
  const totalCandidates = response?.pagination?.total ?? 0;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <ValidationHeader />

        <Card className="overflow-hidden rounded-4x1">
          <CardContent className="p-7">
            <ValidationTable
              candidates={candidates}
              loading={isLoading}
              searchQuery={searchQuery}
              totalCandidates={totalCandidates}
              currentPage={currentPage}
              pageSize={pageSize}
              onSearchQueryChange={handleSearchChange}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
