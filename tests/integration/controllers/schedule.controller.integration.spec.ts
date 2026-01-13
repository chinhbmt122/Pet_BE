import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { WorkSchedule } from '../../../src/entities/work-schedule.entity';

describe('ScheduleController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerToken: string;
  let vetToken: string;
  let managerAccount: Account;
  let vetAccount: Account;
  let vetEmployee: Veterinarian;

  beforeAll(async () => {
    jest.setTimeout(60000); // Increase timeout
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
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager_schedule@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });
    
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });

    // Create Vet Account
    vetAccount = await dataSource.getRepository(Account).save({
      email: 'vet_schedule@test.com',
      passwordHash,
      userType: UserType.VETERINARIAN,
      isActive: true,
    });

    vetToken = jwtService.sign({
      id: vetAccount.accountId,
      email: vetAccount.email,
      role: vetAccount.userType,
    });

    // Create Vet Employee
    vetEmployee = await dataSource.getRepository(Veterinarian).save({
      accountId: vetAccount.accountId,
      fullName: 'Dr. Schedule',
      phoneNumber: '1234567890',
      address: 'Test Addr',
      hireDate: new Date(),
      salary: 5000,
      userType: UserType.VETERINARIAN,
      licenseNumber: 'VET-SCHED-001',
      expertise: 'General',
      isAvailable: true,
    });
  });

  describe('POST /api/schedules', () => {
    it('[S-01] should create a work schedule (Manager only)', async () => {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow
      const dateStr = scheduleDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '09:00',
          endTime: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          notes: 'Standard shift'
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.startTime).toContain('09:00'); 
      expect(response.body.employeeId).toBe(vetEmployee.employeeId);
    });

    it('[S-02] should return 409 if schedule exists for same date', async () => {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow
      const dateStr = scheduleDate.toISOString().split('T')[0];

      // Create first schedule
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(201);

      // Try create duplicate
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '10:00',
          endTime: '18:00',
        })
        .expect(409); // Conflict
    });

    it('[S-03] should return 400 if invalid times (end before start)', async () => {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 2);
      const dateStr = scheduleDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '17:00',
          endTime: '09:00', // Invalid
        })
        .expect(400); // Bad Request (Domain validation)
    });

    it('[S-04] should return 403 for non-manager', async () => {
       const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 3);
      const dateStr = scheduleDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${vetToken}`) // Vet trying to create
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(403);
    });
  });

  describe('GET /api/schedules', () => {
    beforeEach(async () => {
      // Seed a schedule
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1);
      const dateStr = scheduleDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '09:00',
          endTime: '17:00',
        });
    });

    it('[S-05] should get all schedules', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

     it('[S-06] should filter schedules by employeeId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/schedules?employeeId=${vetEmployee.employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].employeeId).toBe(vetEmployee.employeeId);
    });
  });

  describe('GET /api/schedules/:id', () => {
    let scheduleId: number;

    beforeEach(async () => {
      // Create a specific schedule to fetch
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 5);
      const dateStr = scheduleDate.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          employeeId: vetEmployee.employeeId,
          workDate: dateStr,
          startTime: '08:00',
          endTime: '16:00',
        });
      scheduleId = res.body.id;
    });

    it('[S-07] should get schedule by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.id).toBe(scheduleId);
      expect(response.body.startTime).toContain('08:00');
    });

    it('[S-08] should return 404 for non-existent schedule', async () => {
      await request(app.getHttpServer())
        .get('/api/schedules/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});
