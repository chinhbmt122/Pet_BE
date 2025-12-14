/**
 * PetOwner Domain Model
 *
 * Pure domain model with strict encapsulation.
 * Separated from TypeORM persistence entity per ADR-001.
 *
 * @see epics.md → ADR-001, ADR-003 (Encapsulation)
 */

export class PetOwnerDomainModel {
  private readonly _petOwnerId: number | null;
  private readonly _accountId: number;
  // Profile fields (moved from Account - thin account pattern)
  private _fullName: string;
  private _phoneNumber: string;
  private _address: string | null;
  // PetOwner-specific fields
  private _preferredContactMethod: string;
  private _emergencyContact: string | null;
  private readonly _registrationDate: Date;

  private constructor(props: {
    petOwnerId: number | null;
    accountId: number;
    fullName: string;
    phoneNumber: string;
    address: string | null;
    preferredContactMethod: string;
    emergencyContact: string | null;
    registrationDate: Date;
  }) {
    this._petOwnerId = props.petOwnerId;
    this._accountId = props.accountId;
    this._fullName = props.fullName;
    this._phoneNumber = props.phoneNumber;
    this._address = props.address;
    this._preferredContactMethod = props.preferredContactMethod;
    this._emergencyContact = props.emergencyContact;
    this._registrationDate = props.registrationDate;
  }

  // ===== Static Factory Methods =====

  static create(props: {
    accountId: number;
    fullName: string;
    phoneNumber: string;
    address?: string | null;
    preferredContactMethod?: string;
    emergencyContact?: string | null;
  }): PetOwnerDomainModel {
    return new PetOwnerDomainModel({
      petOwnerId: null,
      accountId: props.accountId,
      fullName: props.fullName,
      phoneNumber: props.phoneNumber,
      address: props.address ?? null,
      preferredContactMethod: props.preferredContactMethod ?? 'Email',
      emergencyContact: props.emergencyContact ?? null,
      registrationDate: new Date(),
    });
  }

  static reconstitute(props: {
    petOwnerId: number;
    accountId: number;
    fullName: string;
    phoneNumber: string;
    address: string | null;
    preferredContactMethod: string;
    emergencyContact: string | null;
    registrationDate: Date;
  }): PetOwnerDomainModel {
    return new PetOwnerDomainModel(props);
  }

  // ===== Getters =====

  get petOwnerId(): number | null {
    return this._petOwnerId;
  }

  get accountId(): number {
    return this._accountId;
  }

  get fullName(): string {
    return this._fullName;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get address(): string | null {
    return this._address;
  }

  get preferredContactMethod(): string {
    return this._preferredContactMethod;
  }

  get emergencyContact(): string | null {
    return this._emergencyContact;
  }

  get registrationDate(): Date {
    return this._registrationDate;
  }

  // ===== Domain Methods =====

  /**
   * Update contact preferences
   */
  updateContactPreferences(props: {
    preferredContactMethod?: string;
    emergencyContact?: string | null;
  }): void {
    if (props.preferredContactMethod !== undefined) {
      this._preferredContactMethod = props.preferredContactMethod;
    }
    if (props.emergencyContact !== undefined) {
      this._emergencyContact = props.emergencyContact;
    }
  }

  /**
   * Update profile information (moved from Account)
   */
  updateProfile(props: {
    fullName?: string;
    phoneNumber?: string;
    address?: string | null;
  }): void {
    if (props.fullName !== undefined) this._fullName = props.fullName;
    if (props.phoneNumber !== undefined) this._phoneNumber = props.phoneNumber;
    if (props.address !== undefined) this._address = props.address;
  }
}
