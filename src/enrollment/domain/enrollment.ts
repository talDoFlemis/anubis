import type { MastersDegreeData, PoscompData } from '../../database/schema/enrollments';

export class Enrollment {
  id!: string;
  candidateId!: string;
  enrollmentPeriodId!: string;
  level!: string;
  status!: string;
  phone!: string | null;
  justification!: string | null;
  sigaaCode!: string | null;
  sigaaReceiptFileId!: string | null;
  declaration!: boolean | null;
  poscomp!: PoscompData | null;
  mastersDegrees!: MastersDegreeData[] | null;
  scoreDraft!: string | null;
  submittedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, any>): Enrollment {
    const entity = new Enrollment();
    Object.assign(entity, row);
    return entity;
  }
}
