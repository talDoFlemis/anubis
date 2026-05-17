import { getUserDisplayName, getUserInitials } from '@/components/home/home-user';
import { HomeShell } from '@/components/home/HomeLayout';
import type { CandidateProfile, User } from '@/lib/api';
import { mockCandidateHome } from '@/lib/mock-candidate-home';
import { CandidateHomeHero } from './CandidateHomeHero';
import { CandidateHomeNotices } from './CandidateHomeNotices';
import { CandidateHomeTasks } from './CandidateHomeTasks';
import { CandidateHomeTimeline } from './CandidateHomeTimeline';

type CandidateHomeProps = {
  user: User;
  candidateProfile: CandidateProfile | null | undefined;
};

export function CandidateHome({ user, candidateProfile }: CandidateHomeProps) {
  const displayName = getUserDisplayName(user.firstName, user.lastName, 'Candidato');
  const initials = getUserInitials(user.firstName, user.lastName);
  const universityOfOrigin =
    candidateProfile?.universityOfOrigin || mockCandidateHome.profile.universityOfOrigin;
  const iraValue = candidateProfile?.ira?.trim() || 'Nao informado';
  const poscompValue =
    candidateProfile?.poscomp != null ? String(candidateProfile.poscomp) : 'Nao informado';

  return (
    <HomeShell>
      <CandidateHomeHero
        displayName={displayName}
        initials={initials}
        user={user}
        universityOfOrigin={universityOfOrigin}
        iraValue={iraValue}
        poscompValue={poscompValue}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="space-y-6">
          <CandidateHomeTimeline />
        </div>
        <div className="space-y-6">
          <CandidateHomeNotices />
          <CandidateHomeTasks />
        </div>
      </div>
    </HomeShell>
  );
}
