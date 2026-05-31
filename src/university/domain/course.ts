export class Course {
  id!: string;
  name!: string;
  universityId!: string | null;
  isManual!: boolean;
  createdAt!: Date;
}
