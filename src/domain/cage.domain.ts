import { CageSize, CageStatus } from '../entities/types/entity.types';

/**
 * Cage Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates cage state transitions with validation.
 * Implements State Pattern for cage availability.
 */
export class CageDomainModel {
    private readonly _id: number | null;
    private _cageNumber: string;
    private _size: CageSize;
    private _location: string | null;
    private _status: CageStatus;
    private _dailyRate: number;
    private _notes: string | null;
    private readonly _createdAt: Date;
    private readonly _updatedAt: Date;

    // ===== Private Constructor =====

    private constructor(data: {
        id: number | null;
        cageNumber: string;
        size: CageSize;
        location: string | null;
        status: CageStatus;
        dailyRate: number;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this._id = data.id;
        this._cageNumber = data.cageNumber;
        this._size = data.size;
        this._location = data.location;
        this._status = data.status;
        this._dailyRate = data.dailyRate;
        this._notes = data.notes;
        this._createdAt = data.createdAt;
        this._updatedAt = data.updatedAt;
    }

    // ===== Static Factory Methods =====

    static create(props: {
        cageNumber: string;
        size: CageSize;
        dailyRate: number;
        location?: string;
        notes?: string;
    }): CageDomainModel {
        if (props.dailyRate < 0) {
            throw new Error('Daily rate cannot be negative');
        }

        return new CageDomainModel({
            id: null,
            cageNumber: props.cageNumber,
            size: props.size,
            location: props.location ?? null,
            status: CageStatus.AVAILABLE,
            dailyRate: props.dailyRate,
            notes: props.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static reconstitute(props: {
        id: number;
        cageNumber: string;
        size: CageSize;
        location: string | null;
        status: CageStatus;
        dailyRate: number;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): CageDomainModel {
        return new CageDomainModel(props);
    }

    // ===== Getters =====

    get id(): number | null {
        return this._id;
    }
    get cageNumber(): string {
        return this._cageNumber;
    }
    get size(): CageSize {
        return this._size;
    }
    get location(): string | null {
        return this._location;
    }
    get status(): CageStatus {
        return this._status;
    }
    get dailyRate(): number {
        return this._dailyRate;
    }
    get notes(): string | null {
        return this._notes;
    }
    get createdAt(): Date {
        return this._createdAt;
    }
    get updatedAt(): Date {
        return this._updatedAt;
    }

    // ===== State Transition Methods =====

    /**
     * Mark cage as occupied (pet assigned)
     * @throws Error if cage is not available or reserved
     */
    markOccupied(): void {
        if (this._status !== CageStatus.AVAILABLE && this._status !== CageStatus.RESERVED) {
            throw new Error(`Cannot occupy cage in ${this._status} status`);
        }
        this._status = CageStatus.OCCUPIED;
    }

    /**
     * Mark cage as available (pet checked out or reservation cancelled)
     * @throws Error if cage is in maintenance
     */
    markAvailable(): void {
        if (this._status === CageStatus.MAINTENANCE) {
            throw new Error('Use completeMaintenance() to make cage available from maintenance');
        }
        if (this._status === CageStatus.AVAILABLE) {
            throw new Error('Cage is already available');
        }
        this._status = CageStatus.AVAILABLE;
    }

    /**
     * Mark cage for maintenance (needs repair/cleaning)
     * @throws Error if cage is occupied
     */
    markMaintenance(): void {
        if (this._status === CageStatus.OCCUPIED) {
            throw new Error('Cannot put occupied cage in maintenance');
        }
        this._status = CageStatus.MAINTENANCE;
    }

    /**
     * Complete maintenance and make cage available
     */
    completeMaintenance(): void {
        if (this._status !== CageStatus.MAINTENANCE) {
            throw new Error('Cage is not in maintenance');
        }
        this._status = CageStatus.AVAILABLE;
    }

    /**
     * Reserve cage for upcoming booking
     * @throws Error if cage is not available
     */
    reserve(): void {
        if (this._status !== CageStatus.AVAILABLE) {
            throw new Error(`Cannot reserve cage in ${this._status} status`);
        }
        this._status = CageStatus.RESERVED;
    }

    /**
     * Cancel reservation and make cage available
     * @throws Error if cage is not reserved
     */
    cancelReservation(): void {
        if (this._status !== CageStatus.RESERVED) {
            throw new Error('Cage is not reserved');
        }
        this._status = CageStatus.AVAILABLE;
    }

    // ===== Guard Methods =====

    canAssign(): boolean {
        return this._status === CageStatus.AVAILABLE || this._status === CageStatus.RESERVED;
    }

    isAvailable(): boolean {
        return this._status === CageStatus.AVAILABLE;
    }

    isOccupied(): boolean {
        return this._status === CageStatus.OCCUPIED;
    }

    // ===== Update Methods =====

    updateDetails(props: {
        cageNumber?: string;
        size?: CageSize;
        location?: string | null;
        notes?: string | null;
    }): void {
        if (props.cageNumber !== undefined) this._cageNumber = props.cageNumber;
        if (props.size !== undefined) this._size = props.size;
        if (props.location !== undefined) this._location = props.location;
        if (props.notes !== undefined) this._notes = props.notes;
    }

    updateDailyRate(rate: number): void {
        if (rate < 0) {
            throw new Error('Daily rate cannot be negative');
        }
        this._dailyRate = rate;
    }
}
