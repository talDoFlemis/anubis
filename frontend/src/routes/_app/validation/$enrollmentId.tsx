import { createFileRoute } from '@tanstack/react-router';

import { ValidationWorkspace } from '@/features/validation/components/ValidationWorkspace';

export const Route = createFileRoute('/_app/validation/$enrollmentId')({
  component: ValidationWorkspace,
});
