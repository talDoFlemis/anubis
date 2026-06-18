import type { MastersDegreeData, PoscompData } from '../../database/schema/enrollments';

export class Enrollment {
  id!: string;
  candidateId!: string;
  enrollmentPeriodId!: string;
  level!: string;
  status!: string;
  undergradUniversity!: string | null;
  undergradCourse!: string | null;
  undergradDegreeType!: string | null;
  ira!: string | null;
  undergradProofFileId!: string | null;
  phone!: string | null;
  justification!: string | null;
  sigaaCode!: string | null;
  sigaaReceiptFileId!: string | null;
  declaration!: boolean | null;
  primaryThemeId!: string | null;
  secondaryThemeId!: string | null;
  poscomp!: PoscompData | null;
  mastersDegrees!: MastersDegreeData[] | null;
  projectTitle!: string | null;
  projectFileId!: string | null;
  scoreDraft!: string | null;
  submittedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): Enrollment {
    const entity = new Enrollment();
    Object.assign(entity, row);
    return entity;
  }
}
