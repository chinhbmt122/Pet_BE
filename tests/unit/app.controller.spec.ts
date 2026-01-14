import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { SeedService } from '../../src/services/seed.service';

// Mock SeedService
const mockSeedService = {
  forceSeed: jest.fn().mockResolvedValue(undefined),
  seedIfEmpty: jest.fn().mockResolvedValue(false),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: SeedService, useValue: mockSeedService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appController.getHello()).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return status ok', () => {
      const result = appController.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('forceSeed', () => {
    it('should call seedService.forceSeed', async () => {
      const result = await appController.forceSeed();
      expect(mockSeedService.forceSeed).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
