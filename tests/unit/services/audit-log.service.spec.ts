import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from '../../../src/services/audit-log.service';
import { AuditLog, AuditOperation, ActorType } from '../../../src/entities/audit-log.entity';
import { CreateAuditLogDto } from '../../../src/dto/audit-log';

// ===== Use new test helpers =====
import { createMockRepository } from '../../helpers';

describe('AuditLogService - Full Unit Tests', () => {
  let service: AuditLogService;

  // ===== Use helper types for cleaner declaration =====
  let auditLogRepository: ReturnType<typeof createMockRepository<AuditLog>>;

  beforeEach(async () => {
    // ===== Use shared helpers =====
    auditLogRepository = createMockRepository<AuditLog>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('P2: createAuditLog (2 tests)', () => {
    it('[P2-01] should create audit log with all fields', async () => {
      const dto: CreateAuditLogDto = {
        tableName: 'appointments',
        recordId: 123,
        operation: AuditOperation.UPDATE,
        changes: { status: { from: 'pending', to: 'confirmed' } },
        actorAccountId: 1,
        actorType: ActorType.EMPLOYEE,
        ipAddress: '192.168.1.1',
      };

      const mockAuditLog: AuditLog = {
        auditId: 1,
        tableName: 'appointments',
        recordId: 123,
        operation: AuditOperation.UPDATE,
        changes: { status: { from: 'pending', to: 'confirmed' } },
        actorAccountId: 1,
        actorAccount: null,
        actorType: ActorType.EMPLOYEE,
        ipAddress: '192.168.1.1',
        changedAt: new Date(),
      };

      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(dto);

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        tableName: 'appointments',
        recordId: 123,
        operation: AuditOperation.UPDATE,
        changes: { status: { from: 'pending', to: 'confirmed' } },
        actorAccountId: 1,
        actorType: ActorType.EMPLOYEE,
        ipAddress: '192.168.1.1',
      });
      expect(auditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('[P2-02] should create audit log with minimal fields (nulls)', async () => {
      const dto: CreateAuditLogDto = {
        tableName: 'pets',
        recordId: 456,
        operation: AuditOperation.DELETE,
      };

      const mockAuditLog: AuditLog = {
        auditId: 2,
        tableName: 'pets',
        recordId: 456,
        operation: AuditOperation.DELETE,
        changes: null,
        actorAccountId: null,
        actorAccount: null,
        actorType: null,
        ipAddress: null,
        changedAt: new Date(),
      };

      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(dto);

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        tableName: 'pets',
        recordId: 456,
        operation: AuditOperation.DELETE,
        changes: null,
        actorAccountId: null,
        actorType: null,
        ipAddress: null,
      });
    });
  });

  describe('P2: getRecordAuditHistory (2 tests)', () => {
    it('[P2-03] should return audit history for specific record', async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          auditId: 1,
          tableName: 'appointments',
          recordId: 123,
          operation: AuditOperation.UPDATE,
          changes: { status: { from: 'pending', to: 'confirmed' } },
          actorAccountId: 1,
          actorAccount: null,
          actorType: ActorType.EMPLOYEE,
          ipAddress: '192.168.1.1',
          changedAt: new Date('2026-01-07T10:00:00Z'),
        },
        {
          auditId: 2,
          tableName: 'appointments',
          recordId: 123,
          operation: AuditOperation.CREATE,
          changes: null,
          actorAccountId: 2,
          actorAccount: null,
          actorType: ActorType.OWNER,
          ipAddress: '192.168.1.2',
          changedAt: new Date('2026-01-06T09:00:00Z'),
        },
      ];

      auditLogRepository.find.mockResolvedValue(mockAuditLogs);

      const result = await service.getRecordAuditHistory('appointments', 123);

      expect(result).toEqual(mockAuditLogs);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { tableName: 'appointments', recordId: 123 },
        relations: ['actorAccount'],
        order: { changedAt: 'DESC' },
      });
    });

    it('[P2-04] should return empty array if no audit history exists', async () => {
      auditLogRepository.find.mockResolvedValue([]);

      const result = await service.getRecordAuditHistory('cages', 999);

      expect(result).toEqual([]);
      expect(auditLogRepository.find).toHaveBeenCalled();
    });
  });

  describe('P2: getAuditLogsByActor (2 tests)', () => {
    it('[P2-05] should return logs filtered by actor account ID', async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          auditId: 1,
          tableName: 'pets',
          recordId: 10,
          operation: AuditOperation.CREATE,
          changes: null,
          actorAccountId: 5,
          actorAccount: null,
          actorType: ActorType.OWNER,
          ipAddress: '192.168.1.100',
          changedAt: new Date(),
        },
        {
          auditId: 2,
          tableName: 'appointments',
          recordId: 20,
          operation: AuditOperation.UPDATE,
          changes: { status: 'confirmed' },
          actorAccountId: 5,
          actorAccount: null,
          actorType: ActorType.OWNER,
          ipAddress: '192.168.1.100',
          changedAt: new Date(),
        },
      ];

      auditLogRepository.find.mockResolvedValue(mockAuditLogs);

      const result = await service.getAuditLogsByActor(5);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockAuditLogs);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { actorAccountId: 5 },
        order: { changedAt: 'DESC' },
      });
    });

    it('[P2-06] should return empty array if actor has no logs', async () => {
      auditLogRepository.find.mockResolvedValue([]);

      const result = await service.getAuditLogsByActor(999);

      expect(result).toEqual([]);
    });
  });

  describe('P2: getAuditLogsByTable (2 tests)', () => {
    it('[P2-07] should return logs filtered by table name', async () => {
      const mockAuditLogs: AuditLog[] = [
        {
          auditId: 1,
          tableName: 'invoices',
          recordId: 100,
          operation: AuditOperation.CREATE,
          changes: null,
          actorAccountId: 3,
          actorAccount: null,
          actorType: ActorType.EMPLOYEE,
          ipAddress: '10.0.0.1',
          changedAt: new Date(),
        },
        {
          auditId: 2,
          tableName: 'invoices',
          recordId: 101,
          operation: AuditOperation.UPDATE,
          changes: { isPaid: true },
          actorAccountId: 4,
          actorAccount: null,
          actorType: ActorType.SYSTEM,
          ipAddress: null,
          changedAt: new Date(),
        },
      ];

      auditLogRepository.find.mockResolvedValue(mockAuditLogs);

      const result = await service.getAuditLogsByTable('invoices');

      expect(result).toHaveLength(2);
      expect(result[0].tableName).toBe('invoices');
      expect(result[1].tableName).toBe('invoices');
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { tableName: 'invoices' },
        relations: ['actorAccount'],
        order: { changedAt: 'DESC' },
      });
    });

    it('[P2-08] should return empty array if table has no logs', async () => {
      auditLogRepository.find.mockResolvedValue([]);

      const result = await service.getAuditLogsByTable('nonexistent_table');

      expect(result).toEqual([]);
    });
  });
});
