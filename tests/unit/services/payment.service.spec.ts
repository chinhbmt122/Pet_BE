import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from '../../../src/services/payment.service';
import { Invoice, InvoiceStatus } from '../../../src/entities/invoice.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../../../src/entities/payment.entity';
import { PaymentGatewayArchive } from '../../../src/entities/payment-gateway-archive.entity';
import { PetOwner } from '../../../src/entities/pet-owner.entity';
import { VNPayService } from '../../../src/services/vnpay.service';
import { CreatePaymentDto, InitiateOnlinePaymentDto, VNPayCallbackDto, ProcessRefundDto } from '../../../src/dto/payment';
import { UserType } from '../../../src/entities/account.entity';

// ===== Use new test helpers =====
import { createMockRepository, createMockVNPayService } from '../../helpers';

describe('PaymentService - Full Unit Tests', () => {
  let service: PaymentService;

  // ===== Use helper types for cleaner declarations =====
  let invoiceRepository: ReturnType<typeof createMockRepository<Invoice>>;
  let paymentRepository: ReturnType<typeof createMockRepository<Payment>>;
  let paymentGatewayArchiveRepository: ReturnType<typeof createMockRepository<PaymentGatewayArchive>>;
  let petOwnerRepository: ReturnType<typeof createMockRepository<PetOwner>>;
  let vnpayService: ReturnType<typeof createMockVNPayService>;

  beforeEach(async () => {
    // ===== Use shared helpers - less code, consistent behavior =====
    invoiceRepository = createMockRepository<Invoice>();
    paymentRepository = createMockRepository<Payment>();
    paymentGatewayArchiveRepository = createMockRepository<PaymentGatewayArchive>();
    petOwnerRepository = createMockRepository<PetOwner>();
    vnpayService = createMockVNPayService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: VNPayService,
          useValue: vnpayService,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: invoiceRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepository,
        },
        {
          provide: getRepositoryToken(PaymentGatewayArchive),
          useValue: paymentGatewayArchiveRepository,
        },
        {
          provide: getRepositoryToken(PetOwner),
          useValue: petOwnerRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {

    jest.clearAllMocks();
  });

  describe('P0: processPayment (5 tests)', () => {
    it('[P0-93] should process cash payment successfully', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 100000,
        status: InvoiceStatus.PENDING,
        canPayByCash: jest.fn().mockReturnValue(true),
        payByCash: jest.fn(),
      } as unknown as Invoice;

      const dto: CreatePaymentDto = {
        invoiceId: 1,
        amount: 100000,
        paymentMethod: PaymentMethod.CASH,
        receivedBy: 5,
        notes: 'Cash payment received',
      };

      const mockPayment = {
        paymentId: 1,
        invoiceId: 1,
        amount: 100000,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.SUCCESS,
        paidAt: new Date(),
      } as Payment;

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      paymentRepository.save.mockResolvedValue(mockPayment);
      invoiceRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.processPayment(dto);

      expect(invoiceRepository.findOne).toHaveBeenCalledWith({
        where: { invoiceId: 1 },
      });
      expect(mockInvoice.canPayByCash).toHaveBeenCalled();
      expect(mockInvoice.payByCash).toHaveBeenCalled();
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('[P0-94] should throw 404 if invoice not found', async () => {
      const dto: CreatePaymentDto = {
        invoiceId: 999,
        amount: 100000,
        paymentMethod: PaymentMethod.CASH,
        receivedBy: 5,
      };

      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.invoice',
          }),
        }),
      );
    });

    it('[P0-95] should throw 400 if invoice status invalid for cash payment', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 100000,
        status: InvoiceStatus.PAID,
        canPayByCash: jest.fn().mockReturnValue(false),
      } as unknown as Invoice;

      const dto: CreatePaymentDto = {
        invoiceId: 1,
        amount: 100000,
        paymentMethod: PaymentMethod.CASH,
        receivedBy: 5,
      };

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.processPayment(dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.invalidInvoiceStatus',
          }),
        }),
      );
    });

    it('[P0-96] should throw 400 if payment amount mismatch', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 100000,
        status: InvoiceStatus.PENDING,
        canPayByCash: jest.fn().mockReturnValue(true),
      } as unknown as Invoice;

      const dto: CreatePaymentDto = {
        invoiceId: 1,
        amount: 50000, // Wrong amount
        paymentMethod: PaymentMethod.CASH,
        receivedBy: 5,
      };

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.processPayment(dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.paymentAmountMismatch',
          }),
        }),
      );
    });

    it('[P0-97] should throw 400 if receivedBy is missing for cash payment', async () => {
      const mockInvoice = {
        invoiceId: 1,
        totalAmount: 100000,
        status: InvoiceStatus.PENDING,
        canPayByCash: jest.fn().mockReturnValue(true),
      } as unknown as Invoice;

      const dto: CreatePaymentDto = {
        invoiceId: 1,
        amount: 100000,
        paymentMethod: PaymentMethod.CASH,
        receivedBy: null as any,
      };

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);

      await expect(service.processPayment(dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.missingRequiredField',
          }),
        }),
      );
    });
  });

  describe('P0: initiateOnlinePayment (3 tests)', () => {
    it('[P0-98] should initiate online payment and return payment URL', async () => {
      const mockInvoice = {
        invoiceId: 1,
        invoiceNumber: 'INV-001',
        totalAmount: 200000,
        status: InvoiceStatus.PENDING,
        canStartOnlinePayment: jest.fn().mockReturnValue(true),
        startOnlinePayment: jest.fn(),
      } as unknown as Invoice;

      const dto: InitiateOnlinePaymentDto = {
        invoiceId: 1,
        paymentMethod: PaymentMethod.VNPAY,
        returnUrl: 'https://example.com/return',
        ipAddress: '192.168.1.1',
        locale: 'vn',
      };

      const mockPayment = {
        paymentId: 10,
        invoiceId: 1,
        amount: 200000,
        paymentMethod: PaymentMethod.VNPAY,
        paymentStatus: PaymentStatus.PROCESSING,
      } as Payment;

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      paymentRepository.save.mockResolvedValue(mockPayment);
      invoiceRepository.save.mockResolvedValue(mockInvoice);
      vnpayService.generatePaymentUrl.mockResolvedValue({
        paymentUrl: 'https://vnpay.vn/pay?order=10&amount=200000',
      });

      const result = await service.initiateOnlinePayment(dto);

      expect(result.paymentUrl).toContain('vnpay.vn');
      expect(result.paymentId).toBe(10);
      expect(mockInvoice.startOnlinePayment).toHaveBeenCalled();
    });

    it('[P0-99] should throw 404 if invoice not found', async () => {
      const dto: InitiateOnlinePaymentDto = {
        invoiceId: 999,
        paymentMethod: PaymentMethod.VNPAY,
        returnUrl: 'https://example.com/return',
      };

      invoiceRepository.findOne.mockResolvedValue(null);

      await expect(service.initiateOnlinePayment(dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.invoice',
          }),
        }),
      );
    });

    it('[P0-100] should validate PET_OWNER can only pay their own invoices', async () => {
      const mockInvoice = {
        invoiceId: 1,
        invoiceNumber: 'INV-001',
        totalAmount: 200000,
        appointment: {
          pet: {
            ownerId: 5, // Different owner
          },
        },
      } as unknown as Invoice;

      const mockPetOwner = {
        petOwnerId: 10,
        accountId: 100,
      } as PetOwner;

      const dto: InitiateOnlinePaymentDto = {
        invoiceId: 1,
        paymentMethod: PaymentMethod.VNPAY,
        returnUrl: 'https://example.com/return',
      };

      const user = { accountId: 100, userType: UserType.PET_OWNER };

      invoiceRepository.findOne.mockResolvedValue(mockInvoice);
      petOwnerRepository.findOne.mockResolvedValue(mockPetOwner);

      await expect(service.initiateOnlinePayment(dto, user)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.notFound.invoice',
          }),
        }),
      );
    });
  });

  describe('P0: handleVNPayCallback (2 tests)', () => {
    it('[P0-101] should process successful payment callback', async () => {
      const callbackDto: VNPayCallbackDto = {
        vnp_TxnRef: '10',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'VNP12345',
        vnp_SecureHash: 'valid_hash',
      } as VNPayCallbackDto;

      const mockPayment = {
        paymentId: 10,
        invoiceId: 1,
        amount: 200000,
        paymentStatus: PaymentStatus.PROCESSING,
        markSuccess: jest.fn(),
        invoice: {
          markPaid: jest.fn(),
        },
      } as unknown as Payment;

      const mockArchive = {} as PaymentGatewayArchive;

      paymentRepository.findOne.mockResolvedValue(mockPayment);
      vnpayService.verifyCallback.mockResolvedValue({
        isValid: true,
        status: 'SUCCESS',
        message: 'Payment successful',
        transactionId: 'VNP12345',
        rawData: { vnp_ResponseCode: '00' },
      });
      paymentRepository.save.mockResolvedValue(mockPayment);
      paymentGatewayArchiveRepository.create.mockReturnValue(mockArchive);
      paymentGatewayArchiveRepository.save.mockResolvedValue(mockArchive);

      const result = await service.handleVNPayCallback(callbackDto);

      expect(result.success).toBe(true);
      expect(mockPayment.markSuccess).toHaveBeenCalledWith('VNP12345', { vnp_ResponseCode: '00' });
      expect(mockPayment.invoice.markPaid).toHaveBeenCalled();
      expect(paymentGatewayArchiveRepository.save).toHaveBeenCalled();
    });

    it('[P0-102] should process failed payment callback', async () => {
      const callbackDto: VNPayCallbackDto = {
        vnp_TxnRef: '10',
        vnp_ResponseCode: '24',
        vnp_SecureHash: 'valid_hash',
      } as VNPayCallbackDto;

      const mockPayment = {
        paymentId: 10,
        invoiceId: 1,
        amount: 200000,
        paymentStatus: PaymentStatus.PROCESSING,
        markFailed: jest.fn(),
        invoice: {
          // New behavior: invoice is returned to PENDING, not FAILED
          status: InvoiceStatus.PROCESSING_ONLINE,
        },
      } as unknown as Payment;

      paymentRepository.findOne.mockResolvedValue(mockPayment);
      vnpayService.verifyCallback.mockResolvedValue({
        isValid: true,
        status: 'FAILED',
        message: 'Payment cancelled',
        rawData: { vnp_ResponseCode: '24' },
      });
      paymentRepository.save.mockResolvedValue(mockPayment);
      invoiceRepository.save.mockResolvedValue(mockPayment.invoice);
      paymentGatewayArchiveRepository.create.mockReturnValue({} as PaymentGatewayArchive);
      paymentGatewayArchiveRepository.save.mockResolvedValue({} as PaymentGatewayArchive);

      const result = await service.handleVNPayCallback(callbackDto);

      expect(result.success).toBe(false);
      expect(mockPayment.markFailed).toHaveBeenCalled();
      // New behavior: invoice is returned to PENDING to allow retry (not FAILED)
      expect(mockPayment.invoice.status).toBe(InvoiceStatus.PENDING);
    });
  });

  describe('P1: processRefund (2 tests)', () => {
    it('[P1-73] should process refund for online payment', async () => {
      const mockPayment = {
        paymentId: 10,
        amount: 200000,
        paymentMethod: PaymentMethod.VNPAY,
        transactionId: 'VNP12345',
        paymentStatus: PaymentStatus.SUCCESS,
        canRefund: jest.fn().mockReturnValue(true),
        refund: jest.fn(),
      } as unknown as Payment;

      const dto: ProcessRefundDto = {
        amount: 200000,
        reason: 'Customer request',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment);
      vnpayService.initiateRefund.mockResolvedValue({
        success: true,
        message: 'Refund successful',
        rawData: {},
      });
      paymentRepository.save.mockResolvedValue(mockPayment);
      paymentGatewayArchiveRepository.create.mockReturnValue({} as PaymentGatewayArchive);
      paymentGatewayArchiveRepository.save.mockResolvedValue({} as PaymentGatewayArchive);

      const result = await service.processRefund(10, dto);

      expect(mockPayment.refund).toHaveBeenCalledWith(200000, 'Customer request');
      expect(vnpayService.initiateRefund).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('[P1-74] should throw 400 if refund amount exceeds payment amount', async () => {
      const mockPayment = {
        paymentId: 10,
        amount: 200000,
        paymentMethod: PaymentMethod.VNPAY,
        paymentStatus: PaymentStatus.SUCCESS,
        canRefund: jest.fn().mockReturnValue(true),
      } as unknown as Payment;

      const dto: ProcessRefundDto = {
        amount: 300000, // Exceeds payment amount
        reason: 'Customer request',
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(service.processRefund(10, dto)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            i18nKey: 'errors.badRequest.refundAmountExceeded',
          }),
        }),
      );
    });
  });
});
