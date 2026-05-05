import { Exclude, plainToInstance } from 'class-transformer';
import { ProfessorSelect } from 'src/database/schema/professor';
import { UserSelect } from 'src/database/schema/users';
import { User } from '../../users/domain/user';

export class Professor extends User {
  @Exclude({ toPlainOnly: true })
  userId!: User['id'];
  department!: string;
  institution!: string;

  static fromRows(userRow: UserSelect, profRow: ProfessorSelect): Professor {
    const user = User.toDomain(userRow);

    return plainToInstance(Professor, {
      ...user,
      userId: user.id,
      department: profRow.department,
      institution: profRow.institution,
    });
  }
}
