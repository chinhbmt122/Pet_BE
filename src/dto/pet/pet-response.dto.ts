import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PetDomainModel } from '../../domain/pet.domain';

export class PetResponseDto {
  @ApiProperty({ description: 'Pet ID' })
  id: number;

  @ApiProperty({ description: 'Owner ID' })
  ownerId: number;

  @ApiProperty({ description: 'Pet name' })
  name: string;

  @ApiProperty({ description: 'Species' })
  species: string;

  @ApiPropertyOptional({ description: 'Breed', nullable: true })
  breed: string | null;

  @ApiPropertyOptional({ description: 'Birth date', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ description: 'Gender' })
  gender: string;

  @ApiPropertyOptional({ description: 'Weight in kg', nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ description: 'Color', nullable: true })
  color: string | null;

  @ApiProperty({ description: 'Computed age in years from birthDate' })
  age: number;



  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  static fromDomain(domain: PetDomainModel): PetResponseDto {
    const dto = new PetResponseDto();
    dto.id = domain.id!;
    dto.ownerId = domain.ownerId;
    dto.name = domain.name;
    dto.species = domain.species;
    dto.breed = domain.breed;
    dto.birthDate = domain.birthDate;
    dto.gender = domain.gender;
    dto.weight = domain.weight;
    dto.color = domain.color;
    dto.age = domain.age;
    dto.createdAt = domain.createdAt;
    return dto;
  }

  static fromDomainList(domains: PetDomainModel[]): PetResponseDto[] {
    return domains.map((d) => PetResponseDto.fromDomain(d));
  }
}
