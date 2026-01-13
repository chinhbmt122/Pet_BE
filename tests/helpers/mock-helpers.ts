/**
 * Mock Helpers for Unit Tests
 *
 * Provides reusable mock factories for common test scenarios.
 * Reduces boilerplate and ensures consistent mock behavior across tests.
 */

import { DataSource, Repository, EntityManager, QueryRunner, ObjectLiteral } from 'typeorm';

// ===== Repository Mock Factory =====

/**
 * Creates a mock repository with standard TypeORM methods
 * @returns Mocked repository with jest functions
 */
export function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        delete: jest.fn(),
        softDelete: jest.fn(),  // Support for soft delete
        restore: jest.fn(),     // Support for restore after soft delete
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
        findAndCount: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
        exist: jest.fn(),
        merge: jest.fn(),
        preload: jest.fn(),
    } as unknown as jest.Mocked<Repository<T>>;
}


// ===== Query Builder Mock =====

export function createMockQueryBuilder() {
    const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
        getCount: jest.fn(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        execute: jest.fn(),
        setParameter: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
    };
    return queryBuilder;
}

// ===== Transaction Mock Factory =====

export interface MockTransactionOptions {
    /** Mock entity manager methods */
    managerMocks?: Partial<{
        findOne: jest.Mock;
        save: jest.Mock;
        create: jest.Mock;
        remove: jest.Mock;
    }>;
    /** Should transaction throw error? */
    shouldFail?: boolean;
    /** Error to throw if shouldFail is true */
    error?: Error;
}

/**
 * Creates a mock DataSource with transaction support
 * Useful for testing service methods that use transactions
 */
export function createMockDataSource(options: MockTransactionOptions = {}): jest.Mocked<DataSource> {
    const mockManager: Partial<EntityManager> = {
        findOne: options.managerMocks?.findOne ?? jest.fn(),
        save: options.managerMocks?.save ?? jest.fn(),
        create: options.managerMocks?.create ?? jest.fn((entity, data) => data),
        remove: options.managerMocks?.remove ?? jest.fn(),
    };

    const mockQueryRunner: Partial<QueryRunner> = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: mockManager as EntityManager,
    };

    const dataSource = {
        transaction: jest.fn().mockImplementation(async (callback: (manager: EntityManager) => Promise<unknown>) => {
            if (options.shouldFail) {
                throw options.error ?? new Error('Transaction failed');
            }
            return callback(mockManager as EntityManager);
        }),
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        manager: mockManager,
    } as unknown as jest.Mocked<DataSource>;

    return dataSource;
}

/**
 * Creates a mock QueryRunner for step-by-step transaction control
 */
export function createMockQueryRunner(options: MockTransactionOptions = {}): jest.Mocked<QueryRunner> {
    const mockManager: Partial<EntityManager> = {
        findOne: options.managerMocks?.findOne ?? jest.fn(),
        save: options.managerMocks?.save ?? jest.fn(),
        create: options.managerMocks?.create ?? jest.fn((entity, data) => data),
        remove: options.managerMocks?.remove ?? jest.fn(),
    };

    return {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: mockManager as EntityManager,
    } as unknown as jest.Mocked<QueryRunner>;
}

// ===== Service Mock Factories =====

/**
 * Creates a mock InvoiceService
 */
export function createMockInvoiceService() {
    return {
        createInvoice: jest.fn(),
        getInvoiceById: jest.fn(),
        updateInvoice: jest.fn(),
    };
}

/**
 * Creates a mock VNPayService
 */
export function createMockVNPayService() {
    return {
        generatePaymentUrl: jest.fn(),
        verifyCallback: jest.fn(),
        initiateRefund: jest.fn(),
        queryTransaction: jest.fn(),
        getGatewayName: jest.fn().mockReturnValue('VNPay'),
    };
}

/**
 * Creates a mock JwtService
 */
export function createMockJwtService() {
    return {
        sign: jest.fn().mockReturnValue('mock.jwt.token'),
        verify: jest.fn(),
        decode: jest.fn(),
    };
}

// ===== Entity Factory Helpers =====

/**
 * Creates a mock Invoice entity with business logic methods
 */
export function createMockInvoice(overrides: Partial<{
    invoiceId: number;
    status: string;
    totalAmount: number;
    canPayByCash: boolean;
    canStartOnlinePayment: boolean;
}> = {}) {
    return {
        invoiceId: overrides.invoiceId ?? 1,
        invoiceNumber: 'INV-001',
        totalAmount: overrides.totalAmount ?? 100000,
        status: overrides.status ?? 'PENDING',
        canPayByCash: jest.fn().mockReturnValue(overrides.canPayByCash ?? true),
        canStartOnlinePayment: jest.fn().mockReturnValue(overrides.canStartOnlinePayment ?? true),
        payByCash: jest.fn(),
        startOnlinePayment: jest.fn(),
        markPaid: jest.fn(),
        markFailed: jest.fn(),
    };
}

/**
 * Creates a mock Payment entity with business logic methods
 */
export function createMockPayment(overrides: Partial<{
    paymentId: number;
    paymentStatus: string;
    paymentMethod: string;
    amount: number;
    canRefund: boolean;
}> = {}) {
    return {
        paymentId: overrides.paymentId ?? 1,
        invoiceId: 1,
        amount: overrides.amount ?? 100000,
        paymentMethod: overrides.paymentMethod ?? 'VNPAY',
        paymentStatus: overrides.paymentStatus ?? 'PROCESSING',
        transactionId: 'TXN123',
        canRefund: jest.fn().mockReturnValue(overrides.canRefund ?? true),
        markSuccess: jest.fn(),
        markFailed: jest.fn(),
        refund: jest.fn(),
        invoice: {
            markPaid: jest.fn(),
            markFailed: jest.fn(),
        },
    };
}

/**
 * Creates a mock Appointment entity
 */
export function createMockAppointment(overrides: Partial<{
    appointmentId: number;
    status: string;
    petId: number;
    employeeId: number;
}> = {}) {
    return {
        appointmentId: overrides.appointmentId ?? 1,
        petId: overrides.petId ?? 1,
        employeeId: overrides.employeeId ?? 1,
        appointmentDate: new Date('2026-01-10'),
        startTime: '10:00',
        endTime: '11:00',
        status: overrides.status ?? 'PENDING',
        estimatedCost: 100,
        appointmentServices: [],
    };
}
