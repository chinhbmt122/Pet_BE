import request from 'supertest';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase } from '../test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';

describe('PetOwnerController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  
  let managerToken: string;
  let ownerToken: string;
  let managerAccount: Account;
  let ownerAccount: Account;
  let owner: PetOwner;

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
    managerAccount = await dataSource.getRepository(Account).save({
      email: 'manager_po@test.com',
      passwordHash,
      userType: UserType.MANAGER,
      isActive: true,
    });

    managerToken = jwtService.sign({
      id: managerAccount.accountId,
      email: managerAccount.email,
      role: managerAccount.userType,
    });

    // Create Pet Owner
    ownerAccount = await dataSource.getRepository(Account).save({
      email: 'owner_po@test.com',
      passwordHash,
      userType: UserType.PET_OWNER,
      isActive: true,
    });

    ownerToken = jwtService.sign({
      id: ownerAccount.accountId,
      email: ownerAccount.email,
      role: ownerAccount.userType,
    });

    owner = await dataSource.getRepository(PetOwner).save({
      accountId: ownerAccount.accountId,
      fullName: 'Test Owner',
      phoneNumber: '1234567890',
      address: 'Test Address',
    });
  });

  describe('POST /api/pet-owners/register', () => {
    it('[PO-01] should register new pet owner (public)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/pet-owners/register')
        .send({
          email: 'newowner@test.com',
          password: 'password123',
          fullName: 'New Owner',
          phoneNumber: '9876543210',
          address: '123 New St',
        })
        .expect(201);

      expect(response.body.petOwnerId).toBeDefined();
      expect(response.body.fullName).toBe('New Owner');
    });

    it('[PO-02] should return 409 if email already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/pet-owners/register')
        .send({
          email: 'owner_po@test.com', // Already exists
          password: 'password123',
          fullName: 'Duplicate Owner',
          phoneNumber: '1111111111',
        })
        .expect(409);
    });

    it('[PO-03] should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/pet-owners/register')
        .send({
          email: 'invalid-email', // Invalid
          password: '123', // Too short
          fullName: '',
        })
        .expect(400);
    });
  });

  describe('GET /api/pet-owners', () => {
    beforeEach(async () => {
      // Seed more owners
      const account2 = await dataSource.getRepository(Account).save({
        email: 'owner2@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        userType: UserType.PET_OWNER,
        isActive: true,
      });

      await dataSource.getRepository(PetOwner).save({
        accountId: account2.accountId,
        fullName: 'Another Owner',
        phoneNumber: '5555555555',
        address: 'Another Address',
      });
    });

    it('[PO-04] should get all pet owners', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pet-owners')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('[PO-05] should filter by fullName', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pet-owners?fullName=Test Owner')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
    });

    it('[PO-06] should filter by phoneNumber', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pet-owners?phoneNumber=1234567890')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].phoneNumber).toBe('1234567890');
    });
  });

  describe('GET /api/pet-owners/me', () => {
    it('[PO-07] should return 403 if not PET_OWNER role', async () => {
      await request(app.getHttpServer())
        .get('/api/pet-owners/me')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403); // Manager can't access PET_OWNER /me endpoint
    });
  });

  describe('GET /api/pet-owners/:id', () => {
    it('[PO-08] should get pet owner by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/pet-owners/${owner.accountId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.petOwnerId).toBe(owner.petOwnerId);
      expect(response.body.fullName).toBe('Test Owner');
    });

    it('[PO-09] should return 404 for non-existent owner', async () => {
      await request(app.getHttpServer())
        .get('/api/pet-owners/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/pet-owners/me', () => {
    it('[PO-10] should return 403 if not PET_OWNER role', async () => {
      await request(app.getHttpServer())
        .put('/api/pet-owners/me')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fullName: 'Updated Name',
        })
        .expect(403); // Manager can't update PET_OWNER profile
    });
  });
});
