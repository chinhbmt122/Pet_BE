import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PetService } from '../../../src/services/pet.service';
import { Pet } from '../../../src/entities/pet.entity';
import { Repository } from 'typeorm';

describe('PetService', () => {
  let service: PetService;
  let petRepository: Repository<Pet>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: getRepositoryToken(Pet),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
    petRepository = module.get<Repository<Pet>>(getRepositoryToken(Pet));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPet', () => {
    it('should create new pet profile', async () => {
      // TODO: Implement test with mock repository
    });
  });

  describe('getPetById', () => {
    it('should return pet with medical records', async () => {
      // TODO: Implement test
    });
  });

  describe('deletePet', () => {
    it('should soft delete pet', async () => {
      // TODO: Implement test
    });
  });
});
