import type { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import type { Professor } from '@/professor/domain/professor';
import type { FindProfessorsDto } from '@/professor/dto/find-professor.dto';
import type { ProfessorItemDto } from '@/professor/dto/professor-response.dto';
import type { User } from '@/users/domain/user';
import type {
  CreateUserData,
  UpdateUserData,
} from '@/users/infrastructure/persistence/user.repository';

export type NullableProfessor = Professor | null;

export interface CreateProfessorData extends CreateUserData {
  department: string;
  institution: string;
}

export interface UpdateProfessorData extends UpdateUserData {
  department?: string;
  institution?: string;
}

export abstract class ProfessorRepository {
  /**
   * Persists a new Professor and the underlying User record.
   * @example
   * const prof = await repo.create({ email: 'test@ufc.br', ..., department: 'CS' });
   */
  abstract create(data: CreateProfessorData): Promise<Professor>;

  /**
   * Retrieves a Professor by their unique User ID.
   * Returns null if the User exists but is not a Professor, or if ID is not found.
   */
  abstract findById(id: User['id']): Promise<NullableProfessor>;

  /**
   * Retrieves a Professor by their academic department.
   */
  abstract findAllByFilters(
    filters: FindProfessorsDto,
  ): Promise<PaginatedResponseDto<ProfessorItemDto>>;

  /**
   * Updates Professor and/or User fields.
   * Implementation must handle partial updates correctly.
   */
  abstract update(id: User['id'], data: UpdateProfessorData): Promise<NullableProfessor>;

  /**
   * Removes the Professor record.
   * Note: Decide at implementation if this should cascade-delete the User record.
   */
  abstract remove(id: User['id']): Promise<void>;
}
