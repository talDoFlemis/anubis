import { Injectable, NotFoundException } from '@nestjs/common';

import type { CourseSelect, UniversitySelect } from '../database/schema/universities';

import type { CreateCourseDto } from './dto/create-course.dto';
import type { CreateUniversityDto } from './dto/create-university.dto';
import { UniversityRepository } from './infrastructure/persistence/university.repository';

@Injectable()
export class UniversityService {
  constructor(private readonly universityRepository: UniversityRepository) {}

  async searchUniversities(query: string, limit: number = 20): Promise<UniversitySelect[]> {
    return this.universityRepository.searchUniversities(query, limit);
  }

  async searchCourses(
    query: string,
    universityId?: string,
    limit: number = 20,
  ): Promise<CourseSelect[]> {
    return this.universityRepository.searchCourses(query, universityId, limit);
  }

  async findUniversityById(id: string): Promise<UniversitySelect> {
    const row = await this.universityRepository.findUniversityById(id);

    if (!row) throw new NotFoundException('Universidade não encontrada');
    return row;
  }

  async findCourseById(id: string): Promise<CourseSelect> {
    const row = await this.universityRepository.findCourseById(id);

    if (!row) throw new NotFoundException('Curso não encontrado');
    return row;
  }

  async createUniversity(dto: CreateUniversityDto): Promise<UniversitySelect> {
    return this.universityRepository.createUniversity(dto);
  }

  async createCourse(dto: CreateCourseDto): Promise<CourseSelect> {
    return this.universityRepository.createCourse(dto);
  }
}
