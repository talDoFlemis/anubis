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

  async setUniversityGrade(id: string, mecGrade: number | null): Promise<UniversitySelect> {
    await this.findUniversityById(id);
    return this.universityRepository.setUniversityGrade(id, mecGrade);
  }

  async setUniversityStatus(id: string, status: string): Promise<UniversitySelect> {
    await this.findUniversityById(id);
    return this.universityRepository.setUniversityStatus(id, status);
  }

  async findPendingUniversities(): Promise<UniversitySelect[]> {
    return this.universityRepository.findPendingUniversities();
  }

  async findSimilarUniversities(id: string): Promise<UniversitySelect[]> {
    const target = await this.findUniversityById(id);
    const results = await this.searchUniversities(target.name, 10);
    return results.filter(u => u.id !== id);
  }

  async mergeUniversities(sourceId: string, targetId: string): Promise<void> {
    await this.findUniversityById(sourceId);
    await this.findUniversityById(targetId);
    return this.universityRepository.mergeUniversities(sourceId, targetId);
  }

  async setCourseStatus(id: string, status: string): Promise<CourseSelect> {
    await this.findCourseById(id);
    return this.universityRepository.setCourseStatus(id, status);
  }

  async findPendingCourses(): Promise<CourseSelect[]> {
    return this.universityRepository.findPendingCourses();
  }

  async findSimilarCourses(id: string): Promise<CourseSelect[]> {
    const target = await this.findCourseById(id);
    const results = await this.searchCourses(target.name, target.universityId || undefined, 10);
    return results.filter(c => c.id !== id);
  }

  async mergeCourses(sourceId: string, targetId: string): Promise<void> {
    await this.findCourseById(sourceId);
    await this.findCourseById(targetId);
    return this.universityRepository.mergeCourses(sourceId, targetId);
  }
}
