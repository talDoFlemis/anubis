export class EnrollmentPeriod {
  id!: string;
  name!: string;
  semester!: string;
  startDate!: Date;
  endDate!: Date;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static toDomain(row: Record<string, any>): EnrollmentPeriod {
    const entity = new EnrollmentPeriod();
    entity.id = row.id;
    entity.name = row.name;
    entity.semester = row.semester;
    entity.startDate = row.startDate;
    entity.endDate = row.endDate;
    entity.status = row.status;
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}
