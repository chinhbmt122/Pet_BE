import { AuditOperation, ActorType } from '../entities/types/entity.types';

/**
 * AuditLog Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates audit log entry with factory for creating entries.
 * AuditLogs are immutable once created (append-only audit trail).
 */
export class AuditLogDomainModel {
  private readonly _id: number | null;
  private readonly _tableName: string;
  private readonly _recordId: number;
  private readonly _operation: AuditOperation;
  private readonly _changes: object | null;
  private readonly _actorAccountId: number | null;
  private readonly _actorType: ActorType | null;
  private readonly _ipAddress: string | null;
  private readonly _changedAt: Date;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    tableName: string;
    recordId: number;
    operation: AuditOperation;
    changes: object | null;
    actorAccountId: number | null;
    actorType: ActorType | null;
    ipAddress: string | null;
    changedAt: Date;
  }) {
    this._id = data.id;
    this._tableName = data.tableName;
    this._recordId = data.recordId;
    this._operation = data.operation;
    this._changes = data.changes;
    this._actorAccountId = data.actorAccountId;
    this._actorType = data.actorType;
    this._ipAddress = data.ipAddress;
    this._changedAt = data.changedAt;
  }

  // ===== Static Factory Methods =====

  /**
   * Create a new audit log entry
   */
  static create(props: {
    tableName: string;
    recordId: number;
    operation: AuditOperation;
    changes?: object;
    actorAccountId?: number;
    actorType?: ActorType;
    ipAddress?: string;
  }): AuditLogDomainModel {
    return new AuditLogDomainModel({
      id: null,
      tableName: props.tableName,
      recordId: props.recordId,
      operation: props.operation,
      changes: props.changes ?? null,
      actorAccountId: props.actorAccountId ?? null,
      actorType: props.actorType ?? null,
      ipAddress: props.ipAddress ?? null,
      changedAt: new Date(),
    });
  }

  /**
   * Convenience factory for INSERT operations
   */
  static logInsert(
    tableName: string,
    recordId: number,
    newData: object,
    actor?: { accountId?: number; type?: ActorType; ipAddress?: string },
  ): AuditLogDomainModel {
    return AuditLogDomainModel.create({
      tableName,
      recordId,
      operation: AuditOperation.INSERT,
      changes: { newData },
      actorAccountId: actor?.accountId,
      actorType: actor?.type,
      ipAddress: actor?.ipAddress,
    });
  }

  /**
   * Convenience factory for UPDATE operations
   */
  static logUpdate(
    tableName: string,
    recordId: number,
    oldData: object,
    newData: object,
    actor?: { accountId?: number; type?: ActorType; ipAddress?: string },
  ): AuditLogDomainModel {
    return AuditLogDomainModel.create({
      tableName,
      recordId,
      operation: AuditOperation.UPDATE,
      changes: { oldData, newData },
      actorAccountId: actor?.accountId,
      actorType: actor?.type,
      ipAddress: actor?.ipAddress,
    });
  }

  /**
   * Convenience factory for DELETE operations
   */
  static logDelete(
    tableName: string,
    recordId: number,
    deletedData: object,
    actor?: { accountId?: number; type?: ActorType; ipAddress?: string },
  ): AuditLogDomainModel {
    return AuditLogDomainModel.create({
      tableName,
      recordId,
      operation: AuditOperation.DELETE,
      changes: { deletedData },
      actorAccountId: actor?.accountId,
      actorType: actor?.type,
      ipAddress: actor?.ipAddress,
    });
  }

  static reconstitute(props: {
    id: number;
    tableName: string;
    recordId: number;
    operation: AuditOperation;
    changes: object | null;
    actorAccountId: number | null;
    actorType: ActorType | null;
    ipAddress: string | null;
    changedAt: Date;
  }): AuditLogDomainModel {
    return new AuditLogDomainModel(props);
  }

  // ===== Getters (All readonly - audit logs are immutable) =====

  get id(): number | null {
    return this._id;
  }
  get tableName(): string {
    return this._tableName;
  }
  get recordId(): number {
    return this._recordId;
  }
  get operation(): AuditOperation {
    return this._operation;
  }
  get changes(): object | null {
    return this._changes;
  }
  get actorAccountId(): number | null {
    return this._actorAccountId;
  }
  get actorType(): ActorType | null {
    return this._actorType;
  }
  get ipAddress(): string | null {
    return this._ipAddress;
  }
  get changedAt(): Date {
    return this._changedAt;
  }

  // ===== Query Helper Methods =====

  /**
   * Check if this log was performed by a specific actor
   */
  isPerformedBy(accountId: number): boolean {
    return this._actorAccountId === accountId;
  }

  /**
   * Check if this is a system-generated log
   */
  isSystemGenerated(): boolean {
    return this._actorType === ActorType.SYSTEM;
  }

  /**
   * Check if this log is for a specific table and record
   */
  isFor(tableName: string, recordId: number): boolean {
    return this._tableName === tableName && this._recordId === recordId;
  }
}
