import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { Cage } from '../../../src/entities/cage.entity';
import { CageSize, CageStatus } from '../../../src/entities/types/entity.types';

describe('CageController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerToken: string;
  let receptionistToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Manager
    const managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager_cage@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });

    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });

    // Create Receptionist
    const receptionistAccount = await dataSource.getRepository(Account).save({
      email: 'receptionist_cage@test.com',
      passwordHash,
      userType: UserType.RECEPTIONIST,
      isActive: true,
    });

    receptionistToken = jwtService.sign({
      id: receptionistAccount.accountId,
      email: receptionistAccount.email,
      role: receptionistAccount.userType,
    });
  });

  describe('POST /api/cages', () => {
    it('[C-01] should create a cage (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/cages')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          cageNumber: 'C001',
          size: CageSize.MEDIUM,
          location: 'Building A',
          dailyRate: 50.00,
        })
        .expect(201);

      expect(response.body.cageId).toBeDefined();
      expect(response.body.cageNumber).toBe('C001');
      expect(response.body.status).toBe(CageStatus.AVAILABLE);
    });

    it('[C-02] should return 409 if cage number exists', async () => {
      // Create first
      await dataSource.getRepository(Cage).save({
        cageNumber: 'C002',
        size: CageSize.SMALL,
        dailyRate: 30.00,
      });

      // Try duplicate
      await request(app.getHttpServer())
        .post('/api/cages')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          cageNumber: 'C002',
          size: CageSize.MEDIUM,
          dailyRate: 50.00,
        })
        .expect(409);

    });
  });

  describe('GET /api/cages', () => {
    beforeEach(async () => {
      // Seed cages
      await dataSource.getRepository(Cage).save([
        { cageNumber: 'C101', size: CageSize.SMALL, dailyRate: 30.00, status: CageStatus.AVAILABLE },
        { cageNumber: 'C102', size: CageSize.MEDIUM, dailyRate: 50.00, status: CageStatus.AVAILABLE },
        { cageNumber: 'C103', size: CageSize.LARGE, dailyRate: 75.00, status: CageStatus.OCCUPIED },
      ]);
    });

    it('[C-04] should get all cages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cages')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('[C-05] should filter by size', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/cages?size=${CageSize.SMALL}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].size).toBe(CageSize.SMALL);
    });

    it('[C-06] should filter by availability', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cages?isAvailable=true')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.length).toBe(2); // Only AVAILABLE cages
    });
  });

  describe('GET /api/cages/available', () => {
    beforeEach(async () => {
      await dataSource.getRepository(Cage).save([
        { cageNumber: 'C201', size: CageSize.SMALL, dailyRate: 30.00, status: CageStatus.AVAILABLE },
        { cageNumber: 'C202', size: CageSize.MEDIUM, dailyRate: 50.00, status: CageStatus.OCCUPIED },
      ]);
    });

    it('[C-07] should get available cages only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cages/available')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every(c => c.status === CageStatus.AVAILABLE)).toBe(true);
    });
  });

  describe('GET /api/cages/:id', () => {
    let cageId: number;

    beforeEach(async () => {
      const cage = await dataSource.getRepository(Cage).save({
        cageNumber: 'C301',
        size: CageSize.MEDIUM,
        dailyRate: 50.00,
      });
      cageId = cage.cageId;
    });

    it('[C-08] should get cage by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/cages/${cageId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(200);

      expect(response.body.cageId).toBe(cageId);
      expect(response.body.cageNumber).toBe('C301');
    });

    it('[C-09] should return 404 for non-existent cage', async () => {
      await request(app.getHttpServer())
        .get('/api/cages/99999')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/cages/:id', () => {
    let cageId: number;

    beforeEach(async () => {
      const cage = await dataSource.getRepository(Cage).save({
        cageNumber: 'C401',
        size: CageSize.SMALL,
        dailyRate: 30.00,
        location: 'Building A',
      });
      cageId = cage.cageId;
    });

    it('[C-10] should update cage (Manager only)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/cages/${cageId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          dailyRate: 35.00,
          location: 'Building B',
        })
        .expect(200);

      expect(response.body.dailyRate).toBe(35.00);
      expect(response.body.location).toBe('Building B');
    });
  });

  describe('DELETE /api/cages/:id', () => {
    let cageId: number;

    beforeEach(async () => {
      const cage = await dataSource.getRepository(Cage).save({
        cageNumber: 'C501',
        size: CageSize.SMALL,
        dailyRate: 30.00,
      });
      cageId = cage.cageId;
    });

    it('[C-11] should delete cage (Manager only)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/cages/${cageId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Verify cage is marked OUT_OF_SERVICE (soft delete)
      const updated = await dataSource.getRepository(Cage).findOne({
        where: { cageId },
      });
      expect(updated.status).toBe(CageStatus.OUT_OF_SERVICE);
    });
  });
});
