import { Injectable } from '@nestjs/common';
import { PetOwner } from '../entities/pet-owner.entity';

/**
 * PetOwnerFactory - Creates PetOwner entities
 * KISS: Simple factory, single responsibility
 */
@Injectable()
export class PetOwnerFactory {
  create(props: {
    accountId: number;
    fullName: string;
    phoneNumber: string;
    address?: string | null;
    preferredContactMethod?: string;
    emergencyContact?: string | null;
  }): PetOwner {
    const petOwner = new PetOwner();
    petOwner.accountId = props.accountId;
    petOwner.fullName = props.fullName;
    petOwner.phoneNumber = props.phoneNumber;
    petOwner.address = props.address ?? '';
    petOwner.preferredContactMethod = props.preferredContactMethod ?? 'Email';
    petOwner.emergencyContact = props.emergencyContact ?? '';
    return petOwner;
  }
}
