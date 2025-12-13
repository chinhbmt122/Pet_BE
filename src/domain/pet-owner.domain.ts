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
    private _preferredContactMethod: string;
    private _emergencyContact: string | null;
    private readonly _registrationDate: Date;

    private constructor(props: {
        petOwnerId: number | null;
        accountId: number;
        preferredContactMethod: string;
        emergencyContact: string | null;
        registrationDate: Date;
    }) {
        this._petOwnerId = props.petOwnerId;
        this._accountId = props.accountId;
        this._preferredContactMethod = props.preferredContactMethod;
        this._emergencyContact = props.emergencyContact;
        this._registrationDate = props.registrationDate;
    }

    // ===== Static Factory Methods =====

    static create(props: {
        accountId: number;
        preferredContactMethod?: string;
        emergencyContact?: string | null;
    }): PetOwnerDomainModel {
        return new PetOwnerDomainModel({
            petOwnerId: null,
            accountId: props.accountId,
            preferredContactMethod: props.preferredContactMethod ?? 'Email',
            emergencyContact: props.emergencyContact ?? null,
            registrationDate: new Date(),
        });
    }

    static reconstitute(props: {
        petOwnerId: number;
        accountId: number;
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
}
