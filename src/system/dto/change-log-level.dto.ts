import { IsEnum } from 'class-validator';

export enum LogLevel {
  info = 'info',
  error = 'error',
  debug = 'debug',
}
export class ChangeLogLevelDto {
  @IsEnum(LogLevel)
  level!: LogLevel;
}
