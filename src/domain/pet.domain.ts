/**
 * Pet Domain Model (per ADR-002 Full DDD)
 *
 * Encapsulates pet data with computed properties and validation.
 * Separated from TypeORM persistence entity per ADR-001.
 */
export class PetDomainModel {
  private readonly _id: number | null;
  private readonly _ownerId: number;
  private _name: string;
  private _species: string;
  private _breed: string | null;
  private _birthDate: Date | null;
  private _gender: string;
  private _weight: number | null;
  private _color: string | null;
  private _initialHealthStatus: string | null;
  private _specialNotes: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;
  private readonly _deletedAt: Date | null;

  // ===== Private Constructor =====

  private constructor(data: {
    id: number | null;
    ownerId: number;
    name: string;
    species: string;
    breed: string | null;
    birthDate: Date | null;
    gender: string;
    weight: number | null;
    color: string | null;
    initialHealthStatus: string | null;
    specialNotes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    this._id = data.id;
    this._ownerId = data.ownerId;
    this._name = data.name;
    this._species = data.species;
    this._breed = data.breed;
    this._birthDate = data.birthDate;
    this._gender = data.gender;
    this._weight = data.weight;
    this._color = data.color;
    this._initialHealthStatus = data.initialHealthStatus;
    this._specialNotes = data.specialNotes;
    this._isActive = data.isActive;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
    this._deletedAt = data.deletedAt;
  }

  // ===== Static Factory Methods =====

  static create(props: {
    ownerId: number;
    name: string;
    species: string;
    breed?: string;
    birthDate?: Date;
    gender?: string;
    weight?: number;
    color?: string;
    initialHealthStatus?: string;
    specialNotes?: string;
  }): PetDomainModel {
    return new PetDomainModel({
      id: null,
      ownerId: props.ownerId,
      name: props.name,
      species: props.species,
      breed: props.breed ?? null,
      birthDate: props.birthDate ?? null,
      gender: props.gender ?? 'Unknown',
      weight: props.weight ?? null,
      color: props.color ?? null,
      initialHealthStatus: props.initialHealthStatus ?? null,
      specialNotes: props.specialNotes ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: {
    id: number;
    ownerId: number;
    name: string;
    species: string;
    breed: string | null;
    birthDate: Date | null;
    gender: string;
    weight: number | null;
    color: string | null;
    initialHealthStatus: string | null;
    specialNotes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): PetDomainModel {
    return new PetDomainModel(props);
  }

  // ===== Getters =====

  get id(): number | null {
    return this._id;
  }
  get ownerId(): number {
    return this._ownerId;
  }
  get name(): string {
    return this._name;
  }
  get species(): string {
    return this._species;
  }
  get breed(): string | null {
    return this._breed;
  }
  get birthDate(): Date | null {
    return this._birthDate;
  }
  get gender(): string {
    return this._gender;
  }
  get weight(): number | null {
    return this._weight;
  }
  get color(): string | null {
    return this._color;
  }
  get initialHealthStatus(): string | null {
    return this._initialHealthStatus;
  }
  get specialNotes(): string | null {
    return this._specialNotes;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== Computed Properties =====

  /**
   * Calculate age in years from birthDate
   */
  get age(): number {
    if (!this._birthDate) return 0;
    const diff = Date.now() - new Date(this._birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * Check if pet is soft-deleted
   */
  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ===== Update Methods =====

  updateProfile(props: {
    name?: string;
    species?: string;
    breed?: string | null;
    birthDate?: Date | null;
    gender?: string;
    weight?: number | null;
    color?: string | null;
    specialNotes?: string | null;
  }): void {
    if (props.name !== undefined) this._name = props.name;
    if (props.species !== undefined) this._species = props.species;
    if (props.breed !== undefined) this._breed = props.breed;
    if (props.birthDate !== undefined) this._birthDate = props.birthDate;
    if (props.gender !== undefined) this._gender = props.gender;
    if (props.weight !== undefined) this._weight = props.weight;
    if (props.color !== undefined) this._color = props.color;
    if (props.specialNotes !== undefined)
      this._specialNotes = props.specialNotes;
  }

  updateHealthStatus(status: string): void {
    this._initialHealthStatus = status;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }
}
