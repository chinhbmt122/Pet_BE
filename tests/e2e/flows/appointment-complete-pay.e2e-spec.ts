/**
 * Critical Flow E2E Tests
 *
 * Tests the complete user journey for critical business flows.
 * These tests verify end-to-end integration across multiple services.
 *
 * Run with: npm run test:e2e
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp, cleanDatabase } from '../../integration/test-helper';
import { Account, UserType } from '../../../src/entities/account.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { Veterinarian } from '../../../src/entities/veterinarian.entity';
import { Receptionist } from '../../../src/entities/receptionist.entity';
import { Pet } from '../../../src/entities/pet.entity';
import { Service } from '../../../src/entities/service.entity';
import { ServiceCategory } from '../../../src/entities/service-category.entity';
import { Appointment, AppointmentStatus } from '../../../src/entities/appointment.entity';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../../src/entities/payment.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';


/**
 * Critical Flow: Appointment → Complete → Pay
 *
 * This flow tests the complete user journey:
 * 1. Pet owner creates appointment
 * 2. Receptionist confirms appointment
 * 3. Veterinarian starts appointment
 * 4. Veterinarian completes appointment (creates invoice)
 * 5. Pet owner pays invoice
 *
 * This is one of the most critical business flows in the system.
 */
describe('Critical Flow: Appointment → Complete → Pay', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let jwtService: JwtService;

    // Test entities
    let petOwner: PetOwner;
    let veterinarian: Veterinarian;
    let receptionist: Receptionist;
    let pet: Pet;
    let service: Service;

    // Auth tokens
    let petOwnerToken: string;
    let vetToken: string;
    let receptionistToken: string;

    // Created entities during test
    let appointmentId: number;
    let invoiceId: number;

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
        await setupTestData();
    });

    async function setupTestData() {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Pet Owner
        const petOwnerAccount = await dataSource.getRepository(Account).save({
            email: 'owner@test.com',
            passwordHash: hashedPassword,
            userType: UserType.PET_OWNER,
            isActive: true,
        });

        petOwner = await dataSource.getRepository(PetOwner).save({
            accountId: petOwnerAccount.accountId,
            fullName: 'John Pet Owner',
            phoneNumber: '+1234567890',
            address: '123 Main St',
        });

        petOwnerToken = jwtService.sign({
            id: petOwnerAccount.accountId,
            email: petOwnerAccount.email,
        });

        // 2. Create Veterinarian
        const vetAccount = await dataSource.getRepository(Account).save({
            email: 'vet@test.com',
            passwordHash: hashedPassword,
            userType: UserType.VETERINARIAN,
            isActive: true,
        });

        veterinarian = await dataSource.getRepository(Veterinarian).save({
            accountId: vetAccount.accountId,
            fullName: 'Dr. Smith',
            phoneNumber: '+0987654321',
            address: '456 Vet Clinic',
            hireDate: new Date('2020-01-01'),
            salary: 5000.00,
            isAvailable: true,
            licenseNumber: 'VET123456',
            expertise: 'General Practice',
        });

        vetToken = jwtService.sign({
            id: vetAccount.accountId,
            email: vetAccount.email,
        });

        // 3. Create Receptionist
        const receptionistAccount = await dataSource.getRepository(Account).save({
            email: 'receptionist@test.com',
            passwordHash: hashedPassword,
            userType: UserType.RECEPTIONIST,
            isActive: true,
        });

        receptionist = await dataSource.getRepository(Receptionist).save({
            accountId: receptionistAccount.accountId,
            fullName: 'Jane Receptionist',
            phoneNumber: '+1122334455',
            address: '789 Office St',
            hireDate: new Date('2021-01-01'),
            salary: 3000.00,
            isAvailable: true,
            shift: 'Morning',
        });

        receptionistToken = jwtService.sign({
            id: receptionistAccount.accountId,
            email: receptionistAccount.email,
        });


        // 4. Create Pet
        pet = await dataSource.getRepository(Pet).save({
            ownerId: petOwner.petOwnerId,
            name: 'Buddy',
            species: 'Dog',
            breed: 'Golden Retriever',
            birthDate: new Date('2020-01-01'),
            gender: 'Male',
            weight: 25.5,
            initialHealthStatus: 'Healthy',
        });

        // 5. Create Service Category & Service
        const category = await dataSource.getRepository(ServiceCategory).save({
            categoryName: 'Medical',
            description: 'Medical services',
            isActive: true,
        });

        service = await dataSource.getRepository(Service).save({
            serviceName: 'General Checkup',
            categoryId: category.categoryId,
            basePrice: 50000, // 50,000 VND
            estimatedDuration: 30,
            requiredStaffType: 'Veterinarian',
            description: 'General health checkup',
            isAvailable: true,
        });
    }

    describe('Happy Path: Complete Flow', () => {
        it('should complete the entire appointment → complete → pay flow', async () => {
            // ===== STEP 1: Pet Owner Creates Appointment =====
            const createAppointmentResponse = await request(app.getHttpServer())
                .post('/api/appointments')
                .set('Authorization', `Bearer ${petOwnerToken}`)
                .send({
                    petId: pet.petId,
                    employeeId: veterinarian.employeeId,
                    services: [{ serviceId: service.serviceId, quantity: 1 }],
                    appointmentDate: '2026-02-01',
                    startTime: '10:00',
                    endTime: '10:30',
                })
                .expect(201);

            appointmentId = createAppointmentResponse.body.appointmentId;
            expect(createAppointmentResponse.body.status).toBe(AppointmentStatus.PENDING);
            expect(createAppointmentResponse.body.petId).toBe(pet.petId);

            // ===== STEP 2: Receptionist Confirms Appointment =====
            const confirmResponse = await request(app.getHttpServer())
                .put(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`)
                .expect(200);

            expect(confirmResponse.body.status).toBe(AppointmentStatus.CONFIRMED);

            // ===== STEP 3: Veterinarian Starts Appointment =====
            const startResponse = await request(app.getHttpServer())
                .put(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            expect(startResponse.body.status).toBe(AppointmentStatus.IN_PROGRESS);

            // ===== STEP 4: Veterinarian Completes Appointment =====
            // This should automatically create an invoice
            const completeResponse = await request(app.getHttpServer())
                .put(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            expect(completeResponse.body.status).toBe(AppointmentStatus.COMPLETED);

            // Verify invoice was created
            const invoice = await dataSource.getRepository(Invoice).findOne({
                where: { appointmentId },
            });
            expect(invoice).toBeDefined();
            expect(invoice!.status).toBe(InvoiceStatus.PENDING);
            expect(Number(invoice!.totalAmount)).toBe(55000); // Service base price + tax/fees
            invoiceId = invoice!.invoiceId;

            // ===== STEP 5: Pet Owner Pays Invoice (Cash) =====
            const paymentResponse = await request(app.getHttpServer())
                .post('/api/payments')
                .set('Authorization', `Bearer ${receptionistToken}`) // Receptionist processes cash
                .send({
                    invoiceId: invoiceId,
                    amount: 55000,
                    paymentMethod: PaymentMethod.CASH,
                    receivedBy: receptionist.employeeId,
                    notes: 'Cash payment received',
                })
                .expect(201);

            expect(paymentResponse.body.paymentStatus).toBe(PaymentStatus.SUCCESS);

            // Verify invoice is now PAID
            const updatedInvoice = await dataSource.getRepository(Invoice).findOne({
                where: { invoiceId },
            });
            expect(updatedInvoice!.status).toBe(InvoiceStatus.PAID);
            expect(updatedInvoice!.paidAt).toBeDefined();

            // ===== VERIFICATION: Check Complete Data Integrity =====

            // Appointment is COMPLETED
            const finalAppointment = await dataSource.getRepository(Appointment).findOne({
                where: { appointmentId },
                relations: ['invoice'],
            });
            expect(finalAppointment!.status).toBe(AppointmentStatus.COMPLETED);
            expect(finalAppointment!.invoice).toBeDefined();
            expect(finalAppointment!.invoice!.status).toBe(InvoiceStatus.PAID);

            // Payment is SUCCESS
            const payment = await dataSource.getRepository(Payment).findOne({
                where: { invoiceId },
            });
            expect(payment).toBeDefined();
            expect(payment!.paymentStatus).toBe(PaymentStatus.SUCCESS);
            expect(Number(payment!.amount)).toBe(55000);
        });
    });

    describe('Error Scenarios', () => {
        it('should prevent completing appointment that is not IN_PROGRESS', async () => {
            // Create appointment in PENDING status
            const appointment = await dataSource.getRepository(Appointment).save({
                petId: pet.petId,
                employeeId: veterinarian.employeeId,
                appointmentDate: new Date('2026-02-01'),
                startTime: '10:00',
                endTime: '10:30',
                status: AppointmentStatus.PENDING,
                estimatedCost: 55000,
            });

            // Try to complete without confirming/starting first
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(400);
        });

        it('should prevent double payment on same invoice', async () => {
            // Create appointment and complete flow
            const appointment = await dataSource.getRepository(Appointment).save({
                petId: pet.petId,
                employeeId: veterinarian.employeeId,
                appointmentDate: new Date('2026-02-01'),
                startTime: '11:00',
                endTime: '11:30',
                status: AppointmentStatus.COMPLETED,
                estimatedCost: 55000,
            });

            // Create invoice in PAID status
            const invoice = await dataSource.getRepository(Invoice).save({
                appointmentId: appointment.appointmentId,
                invoiceNumber: 'INV-TEST-001',
                issueDate: new Date(),
                subtotal: 55000,
                discount: 0,
                tax: 0,
                totalAmount: 55000,
                status: InvoiceStatus.PAID,
                paidAt: new Date(),
            });

            // Try to pay again
            await request(app.getHttpServer())
                .post('/api/payments')
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send({
                    invoiceId: invoice.invoiceId,
                    amount: 55000,
                    paymentMethod: PaymentMethod.CASH,
                    receivedBy: receptionist.employeeId,
                })
                .expect(400);
        });

        it('should prevent payment amount mismatch', async () => {
            // Create appointment and invoice
            const appointment = await dataSource.getRepository(Appointment).save({
                petId: pet.petId,
                employeeId: veterinarian.employeeId,
                appointmentDate: new Date('2026-02-01'),
                startTime: '12:00',
                endTime: '12:30',
                status: AppointmentStatus.COMPLETED,
                estimatedCost: 55000,
            });

            const invoice = await dataSource.getRepository(Invoice).save({
                appointmentId: appointment.appointmentId,
                invoiceNumber: 'INV-TEST-002',
                issueDate: new Date(),
                subtotal: 55000,
                discount: 0,
                tax: 0,
                totalAmount: 55000,
                status: InvoiceStatus.PENDING,
            });

            // Try to pay with wrong amount
            await request(app.getHttpServer())
                .post('/api/payments')
                .set('Authorization', `Bearer ${receptionistToken}`)
                .send({
                    invoiceId: invoice.invoiceId,
                    amount: 25000, // Wrong amount!
                    paymentMethod: PaymentMethod.CASH,
                    receivedBy: receptionist.employeeId,
                })
                .expect(400);
        });
    });

    describe('State Machine Integrity', () => {
        it('should enforce correct appointment state transitions', async () => {
            // Create PENDING appointment
            const appointment = await dataSource.getRepository(Appointment).save({
                petId: pet.petId,
                employeeId: veterinarian.employeeId,
                appointmentDate: new Date('2026-02-01'),
                startTime: '13:00',
                endTime: '13:30',
                status: AppointmentStatus.PENDING,
                estimatedCost: 55000,
            });

            // PENDING → Cannot START (must CONFIRM first)
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(400);

            // PENDING → CONFIRMED ✓
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`)
                .expect(200);

            // CONFIRMED → IN_PROGRESS ✓
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/start`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // IN_PROGRESS → COMPLETED ✓
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/complete`)
                .set('Authorization', `Bearer ${vetToken}`)
                .expect(200);

            // COMPLETED → Cannot go back
            await request(app.getHttpServer())
                .put(`/api/appointments/${appointment.appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`)
                .expect(400);
        });
    });
});
