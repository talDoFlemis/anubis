import { FallbackHome } from '@/components/home/FallbackHome';
import { CandidateHome } from '@/features/candidate/home/CandidateHome';
import { CandidateHomeSkeleton } from '@/features/candidate/home/CandidateHomeSkeleton';
import { ProfessorHome } from '@/features/professors/home/ProfessorHome';
import { useAuth, useMyCandidateProfile } from '@/hooks/use-auth';
import { createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

function HomePage(): ReactElement | null {
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const isCandidate = user?.role === 'candidate';
  const { data: candidateProfile, isLoading: isCandidateProfileLoading } =
    useMyCandidateProfile(isCandidate);

  if (isAuthLoading || (isCandidate && isCandidateProfileLoading)) {
    return <CandidateHomeSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (user.role === 'professor') {
    return <ProfessorHome user={user} />;
  }

  if (user.role === 'candidate') {
    return <CandidateHome user={user} candidateProfile={candidateProfile} />;
  }

  return <FallbackHome user={user} />;
}
