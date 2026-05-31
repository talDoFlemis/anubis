export class EnrollmentPeriod {
  id!: string;
  name!: string;
  semester!: string;
  startDate!: Date;
  endDate!: Date;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, unknown>): EnrollmentPeriod {
    const entity = new EnrollmentPeriod();
    const r = row as unknown as EnrollmentPeriod;
    entity.id = r.id;
    entity.name = r.name;
    entity.semester = r.semester;
    entity.startDate = r.startDate;
    entity.endDate = r.endDate;
    entity.status = r.status;
    entity.createdAt = r.createdAt;
    entity.updatedAt = r.updatedAt;
    return entity;
  }
}
