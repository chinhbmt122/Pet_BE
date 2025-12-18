import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import {
  AuditLog,
  AuditOperation,
  ActorType,
} from '../entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/audit-log';

/**
 * AuditLogService (Pure Anemic Pattern)
 *
 * Manages audit logs - simple read-only queries and logging.
 * No complex business logic needed, returns entities directly.
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Creates a new audit log entry
   */
  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      tableName: dto.tableName,
      recordId: dto.recordId,
      operation: dto.operation,
      changes: dto.changes ?? null,
      actorAccountId: dto.actorAccountId ?? null,
      actorType: dto.actorType ?? null,
      ipAddress: dto.ipAddress ?? null,
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Gets audit log by ID
   */
  async getAuditLogById(auditId: number): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { auditId },
      relations: ['actorAccount'],
    });
  }

  /**
   * Gets audit logs for a specific table and record
   */
  async getRecordAuditHistory(
    tableName: string,
    recordId: number,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tableName, recordId },
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets audit logs by actor (who did what)
   */
  async getAuditLogsByActor(actorAccountId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorAccountId },
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets audit logs by operation type
   */
  async getAuditLogsByOperation(
    operation: AuditOperation,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { operation },
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets audit logs by table name
   */
  async getAuditLogsByTable(tableName: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tableName },
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets audit logs by actor type (OWNER, EMPLOYEE, SYSTEM)
   */
  async getAuditLogsByActorType(actorType: ActorType): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorType },
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets audit logs within date range
   */
  async getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        changedAt: Between(startDate, endDate),
      },
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Gets all audit logs (paginated)
   */
  async getAllAuditLogs(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.auditLogRepository.findAndCount({
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Gets recent audit logs (last N entries)
   */
  async getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Searches audit logs with multiple filters
   */
  async searchAuditLogs(filters: {
    tableName?: string;
    recordId?: number;
    operation?: AuditOperation;
    actorAccountId?: number;
    actorType?: ActorType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters.tableName) where.tableName = filters.tableName;
    if (filters.recordId) where.recordId = filters.recordId;
    if (filters.operation) where.operation = filters.operation;
    if (filters.actorAccountId) where.actorAccountId = filters.actorAccountId;
    if (filters.actorType) where.actorType = filters.actorType;

    if (filters.startDate && filters.endDate) {
      where.changedAt = Between(filters.startDate, filters.endDate);
    }

    return this.auditLogRepository.find({
      where,
      relations: ['actorAccount'],
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Deletes old audit logs (cleanup - older than specified days)
   */
  async deleteOldAuditLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('changedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }
}
