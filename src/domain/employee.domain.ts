/**
 * Employee Domain Model Hierarchy
 *
 * Pure domain models with strict encapsulation.
 * Separated from TypeORM persistence entities per ADR-001.
 *
 * Hierarchy:
 * - EmployeeDomainModel (abstract base)
 *   - VeterinarianDomainModel
 *   - CareStaffDomainModel
 *   - ManagerDomainModel
 *   - ReceptionistDomainModel
 *
 * @see epics.md → ADR-001, ADR-003 (Inheritance, Polymorphism)
 */

/**
 * Employee Role Enum (matches persistence layer)
 */
export type EmployeeRole = 'MANAGER' | 'VETERINARIAN' | 'CARE_STAFF' | 'RECEPTIONIST';

/**
 * Base props interface for Employee domain model
 */
export interface EmployeeBaseProps {
    employeeId: number | null;
    accountId: number;
    hireDate: Date;
    salary: number;
    isAvailable: boolean;
    createdAt: Date;
}

/**
 * Abstract Base: Employee Domain Model
 */
export abstract class EmployeeDomainModel {
    protected readonly _employeeId: number | null;
    protected readonly _accountId: number;
    protected _hireDate: Date;  // Mutable: allows typo correction
    protected _salary: number;
    protected _isAvailable: boolean;
    protected readonly _createdAt: Date;

    protected constructor(props: EmployeeBaseProps) {
        this._employeeId = props.employeeId;
        this._accountId = props.accountId;
        this._hireDate = props.hireDate;
        this._salary = props.salary;
        this._isAvailable = props.isAvailable;
        this._createdAt = props.createdAt;
    }

    // ===== Getters =====

    get employeeId(): number | null {
        return this._employeeId;
    }

    get accountId(): number {
        return this._accountId;
    }

    get hireDate(): Date {
        return this._hireDate;
    }

    get salary(): number {
        return this._salary;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    // ===== Domain Methods =====

    /**
     * Checks if employee is currently available
     */
    isEmployeeAvailable(): boolean {
        return this._isAvailable;
    }

    /**
     * Marks employee as unavailable
     */
    markUnavailable(): void {
        this._isAvailable = false;
    }

    /**
     * Marks employee as available
     */
    markAvailable(): void {
        this._isAvailable = true;
    }

    /**
     * Updates salary
     */
    updateSalary(newSalary: number): void {
        if (newSalary < 0) {
            throw new Error('Salary cannot be negative');
        }
        this._salary = newSalary;
    }

    /**
     * Updates hire date (for typo corrections)
     */
    updateHireDate(newDate: Date): void {
        this._hireDate = newDate;
    }

    /**
     * Returns the role type (polymorphic method)
     */
    abstract getRole(): EmployeeRole;
}

// ===== Child Domain Models =====

/**
 * Veterinarian Domain Model
 */
export class VeterinarianDomainModel extends EmployeeDomainModel {
    private _licenseNumber: string;  // Mutable: allows typo correction
    private _expertise: string | null;

    private constructor(
        baseProps: EmployeeBaseProps,
        props: { licenseNumber: string; expertise: string | null },
    ) {
        super(baseProps);
        this._licenseNumber = props.licenseNumber;
        this._expertise = props.expertise;
    }

    static create(props: {
        accountId: number;
        hireDate: Date;
        salary: number;
        licenseNumber: string;
        expertise?: string | null;
    }): VeterinarianDomainModel {
        return new VeterinarianDomainModel(
            {
                employeeId: null,
                accountId: props.accountId,
                hireDate: props.hireDate,
                salary: props.salary,
                isAvailable: true,
                createdAt: new Date(),
            },
            {
                licenseNumber: props.licenseNumber,
                expertise: props.expertise ?? null,
            },
        );
    }

    static reconstitute(props: {
        employeeId: number;
        accountId: number;
        hireDate: Date;
        salary: number;
        isAvailable: boolean;
        createdAt: Date;
        licenseNumber: string;
        expertise: string | null;
    }): VeterinarianDomainModel {
        return new VeterinarianDomainModel(
            {
                employeeId: props.employeeId,
                accountId: props.accountId,
                hireDate: props.hireDate,
                salary: props.salary,
                isAvailable: props.isAvailable,
                createdAt: props.createdAt,
            },
            {
                licenseNumber: props.licenseNumber,
                expertise: props.expertise,
            },
        );
    }

    get licenseNumber(): string {
        return this._licenseNumber;
    }

    get expertise(): string | null {
        return this._expertise;
    }

    updateExpertise(expertise: string): void {
        this._expertise = expertise;
    }

    /**
     * Updates license number (for typo corrections or renewal)
     */
    updateLicenseNumber(newLicense: string): void {
        this._licenseNumber = newLicense;
    }

    getRole(): EmployeeRole {
        return 'VETERINARIAN';
    }
}

/**
 * CareStaff Domain Model
 */
export class CareStaffDomainModel extends EmployeeDomainModel {
    private _skills: string[];

    private constructor(
        baseProps: EmployeeBaseProps,
        props: { skills: string[] },
    ) {
        super(baseProps);
        this._skills = [...props.skills];
    }

    static create(props: {
        accountId: number;
        hireDate: Date;
        salary: number;
        skills?: string[];
    }): CareStaffDomainModel {
        return new CareStaffDomainModel(
            {
                employeeId: null,
                accountId: props.accountId,
                hireDate: props.hireDate,
                salary: props.salary,
                isAvailable: true,
                createdAt: new Date(),
            },
            { skills: props.skills ?? [] },
        );
    }

    static reconstitute(props: {
        employeeId: number;
        accountId: number;
        hireDate: Date;
        salary: number;
        isAvailable: boolean;
        createdAt: Date;
        skills: string[];
    }): CareStaffDomainModel {
        return new CareStaffDomainModel(
            {
                employeeId: props.employeeId,
                accountId: props.accountId,
                hireDate: props.hireDate,
                salary: props.salary,
                isAvailable: props.isAvailable,
                createdAt: props.createdAt,
            },
            { skills: props.skills },
        );
    }

    get skills(): string[] {
        return [...this._skills];
    }

    addSkill(skill: string): void {
        if (!this._skills.includes(skill)) {
            this._skills.push(skill);
        }
    }

    removeSkill(skill: string): void {
        this._skills = this._skills.filter((s) => s !== skill);
    }

    getRole(): EmployeeRole {
        return 'CARE_STAFF';
    }
}

/**
 * Manager Domain Model
 */
export class ManagerDomainModel extends EmployeeDomainModel {
    private constructor(baseProps: EmployeeBaseProps) {
        super(baseProps);
    }

    static create(props: {
        accountId: number;
        hireDate: Date;
        salary: number;
    }): ManagerDomainModel {
        return new ManagerDomainModel({
            employeeId: null,
            accountId: props.accountId,
            hireDate: props.hireDate,
            salary: props.salary,
            isAvailable: true,
            createdAt: new Date(),
        });
    }

    static reconstitute(props: {
        employeeId: number;
        accountId: number;
        hireDate: Date;
        salary: number;
        isAvailable: boolean;
        createdAt: Date;
    }): ManagerDomainModel {
        return new ManagerDomainModel(props);
    }

    getRole(): EmployeeRole {
        return 'MANAGER';
    }
}

/**
 * Receptionist Domain Model
 */
export class ReceptionistDomainModel extends EmployeeDomainModel {
    private constructor(baseProps: EmployeeBaseProps) {
        super(baseProps);
    }

    static create(props: {
        accountId: number;
        hireDate: Date;
        salary: number;
    }): ReceptionistDomainModel {
        return new ReceptionistDomainModel({
            employeeId: null,
            accountId: props.accountId,
            hireDate: props.hireDate,
            salary: props.salary,
            isAvailable: true,
            createdAt: new Date(),
        });
    }

    static reconstitute(props: {
        employeeId: number;
        accountId: number;
        hireDate: Date;
        salary: number;
        isAvailable: boolean;
        createdAt: Date;
    }): ReceptionistDomainModel {
        return new ReceptionistDomainModel(props);
    }

    getRole(): EmployeeRole {
        return 'RECEPTIONIST';
    }
}
