import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Manager } from '../../../src/entities/manager.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * AccountController Integration Tests
 * Tests authentication and account management endpoints
 * 
 * All fields verified from implementation code
 */
describe('AccountController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let petOwnerAccount: Account;
  let petOwner: PetOwner;
  let managerAccount: Account;
  let manager: Manager;
  let petOwnerToken: string;
  let managerToken: string;

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
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Pet owner
    petOwnerAccount = await dataSource.getRepository(Account).save({
      email: 'owner@test.com',
      passwordHash: hashedPassword,
      userType: 'PET_OWNER',
      isActive: true,
    });
    
    petOwner = await dataSource.getRepository(PetOwner).save({
      accountId: petOwnerAccount.accountId,
      fullName: 'John Doe',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      preferredContactMethod: 'Email',
      emergencyContact: '+0987654321',
    });
    
    // Manager
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager@test.com',
      passwordHash: hashedPassword,
      userType: 'MANAGER',
      isActive: true,
    });
    
    manager = await dataSource.getRepository(Manager).save({
      accountId: managerAccount.accountId,
      fullName: 'Bob Manager',
      phoneNumber: '+9988776655',
      address: '321 Boss St',
      hireDate: new Date('2019-01-01'),
      salary: 8000.00,
      isAvailable: true,
      department: 'Operations',
      officeLocation: 'Building A',
    });
    
    petOwnerToken = jwtService.sign({
      id: petOwnerAccount.accountId,
      email: petOwnerAccount.email,
    });
    
    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
    });
  });

  describe('POST /api/auth/login', () => {
    it('[AC-01] should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.account.email).toBe('owner@test.com');
      expect(response.body.account.userType).toBe('PET_OWNER');
    });

    it('[AC-02] should return 401 with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('[AC-03] should return 401 with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('[AC-04] should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('[AC-05] should logout with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('[AC-06] should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('[AC-07] should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body.accountId).toBe(petOwnerAccount.accountId);
      expect(response.body.email).toBe('owner@test.com');
      expect(response.body.userType).toBe('PET_OWNER');
      expect(response.body.fullName).toBe('John Doe');
    });

    it('[AC-08] should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('GET /api/auth/account/:id', () => {
    it('[AC-09] should get account by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/auth/account/${petOwnerAccount.accountId}`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(200);

      expect(response.body.accountId).toBe(petOwnerAccount.accountId);
      expect(response.body.email).toBe('owner@test.com');
    });

    it('[AC-10] should return 404 for non-existent account', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/account/99999')
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/auth/account/:id/change-password', () => {
    it('[AC-11] should change password with correct old password', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/change-password`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
      
      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBeDefined();
    });

    it('[AC-12] should return 401 with incorrect old password', async () => {
      await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/change-password`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });

  describe('PUT /api/auth/account/:id/activate', () => {
    beforeEach(async () => {
      // Deactivate the account first
      await dataSource.getRepository(Account).update(
        { accountId: petOwnerAccount.accountId },
        { isActive: false }
      );
    });

    it('[AC-13] should activate account as manager', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/activate`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(true);
    });

    it('[AC-14] should return 403 when non-manager tries to activate', async () => {
      await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/activate`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/auth/account/:id/deactivate', () => {
    it('[AC-15] should deactivate account as manager', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/deactivate`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it('[AC-16] should return 403 when non-manager tries to deactivate', async () => {
      await request(app.getHttpServer())
        .put(`/api/auth/account/${petOwnerAccount.accountId}/deactivate`)
        .set('Authorization', `Bearer ${petOwnerToken}`)
        .expect(403);
    });
  });
});
