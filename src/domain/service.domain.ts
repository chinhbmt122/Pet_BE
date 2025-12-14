/**
 * Service Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates service catalog with activation state.
 * Separated from TypeORM persistence entity per ADR-001.
 */
export class ServiceDomainModel {
    private readonly _id: number | null;
    private _serviceName: string;
    private readonly _categoryId: number;
    private _description: string | null;
    private _basePrice: number;
    private _estimatedDuration: number;
    private _requiredStaffType: string;
    private _isAvailable: boolean;
    private readonly _createdAt: Date;
    private readonly _updatedAt: Date;

    // ===== Private Constructor =====

    private constructor(data: {
        id: number | null;
        serviceName: string;
        categoryId: number;
        description: string | null;
        basePrice: number;
        estimatedDuration: number;
        requiredStaffType: string;
        isAvailable: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) {
        this._id = data.id;
        this._serviceName = data.serviceName;
        this._categoryId = data.categoryId;
        this._description = data.description;
        this._basePrice = data.basePrice;
        this._estimatedDuration = data.estimatedDuration;
        this._requiredStaffType = data.requiredStaffType;
        this._isAvailable = data.isAvailable;
        this._createdAt = data.createdAt;
        this._updatedAt = data.updatedAt;
    }

    // ===== Static Factory Methods =====

    static create(props: {
        serviceName: string;
        categoryId: number;
        basePrice: number;
        estimatedDuration: number;
        requiredStaffType: string;
        description?: string;
    }): ServiceDomainModel {
        return new ServiceDomainModel({
            id: null,
            serviceName: props.serviceName,
            categoryId: props.categoryId,
            description: props.description ?? null,
            basePrice: props.basePrice,
            estimatedDuration: props.estimatedDuration,
            requiredStaffType: props.requiredStaffType,
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static reconstitute(props: {
        id: number;
        serviceName: string;
        categoryId: number;
        description: string | null;
        basePrice: number;
        estimatedDuration: number;
        requiredStaffType: string;
        isAvailable: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): ServiceDomainModel {
        return new ServiceDomainModel(props);
    }

    // ===== Getters =====

    get id(): number | null {
        return this._id;
    }
    get serviceName(): string {
        return this._serviceName;
    }
    get categoryId(): number {
        return this._categoryId;
    }
    get description(): string | null {
        return this._description;
    }
    get basePrice(): number {
        return this._basePrice;
    }
    get estimatedDuration(): number {
        return this._estimatedDuration;
    }
    get requiredStaffType(): string {
        return this._requiredStaffType;
    }
    get isAvailable(): boolean {
        return this._isAvailable;
    }
    get createdAt(): Date {
        return this._createdAt;
    }
    get updatedAt(): Date {
        return this._updatedAt;
    }

    // ===== State Transition Methods =====

    /**
     * Suspends this service (marks as unavailable for booking).
     * @throws Error if already suspended
     */
    suspend(): void {
        if (!this._isAvailable) {
            throw new Error('Service is already suspended');
        }
        this._isAvailable = false;
    }

    /**
     * Activates this service (marks as available for booking).
     * @throws Error if already active
     */
    activate(): void {
        if (this._isAvailable) {
            throw new Error('Service is already active');
        }
        this._isAvailable = true;
    }

    // ===== Guard Methods =====

    /**
     * Checks if service can be booked.
     */
    canBook(): boolean {
        return this._isAvailable;
    }

    isSuspended(): boolean {
        return !this._isAvailable;
    }

    // ===== Update Methods =====

    updateDetails(props: {
        serviceName?: string;
        description?: string | null;
        requiredStaffType?: string;
    }): void {
        if (props.serviceName !== undefined) this._serviceName = props.serviceName;
        if (props.description !== undefined) this._description = props.description;
        if (props.requiredStaffType !== undefined)
            this._requiredStaffType = props.requiredStaffType;
    }

    updatePricing(props: { basePrice?: number; estimatedDuration?: number }): void {
        if (props.basePrice !== undefined) {
            if (props.basePrice < 0) throw new Error('Price cannot be negative');
            this._basePrice = props.basePrice;
        }
        if (props.estimatedDuration !== undefined) {
            if (props.estimatedDuration <= 0)
                throw new Error('Duration must be positive');
            this._estimatedDuration = props.estimatedDuration;
        }
    }
}
