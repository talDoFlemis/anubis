import { createFileRoute } from '@tanstack/react-router';

import { ValidationListing } from '@/features/validation/components/ValidationListing';

export const Route = createFileRoute('/_app/validation/')({
  component: ValidationListing,
});
