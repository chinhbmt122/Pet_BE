import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AddMultipleServicesSupport1735300000000 implements MigrationInterface {
  name = 'AddMultipleServicesSupport1735300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create appointment_services junction table
    await queryRunner.createTable(
      new Table({
        name: 'appointment_services',
        columns: [
          {
            name: 'appointmentServiceId',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'appointmentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'serviceId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'appointment_services',
      new TableForeignKey({
        columnNames: ['appointmentId'],
        referencedColumnNames: ['appointmentId'],
        referencedTableName: 'appointments',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'appointment_services',
      new TableForeignKey({
        columnNames: ['serviceId'],
        referencedColumnNames: ['serviceId'],
        referencedTableName: 'services',
        onDelete: 'RESTRICT',
      }),
    );

    // Migrate existing data from appointments.serviceId to appointment_services
    await queryRunner.query(`
      INSERT INTO appointment_services (appointmentId, serviceId, quantity, unitPrice, notes)
      SELECT 
        a.appointmentId,
        a.serviceId,
        1 as quantity,
        COALESCE(s.basePrice, a.estimatedCost, 0) as unitPrice,
        NULL as notes
      FROM appointments a
      LEFT JOIN services s ON a.serviceId = s.serviceId
      WHERE a.serviceId IS NOT NULL
    `);

    // Drop the old serviceId foreign key constraint
    const appointmentsTable = await queryRunner.getTable('appointments');
    if (appointmentsTable) {
      const serviceIdForeignKey = appointmentsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('serviceId') !== -1,
      );
      if (serviceIdForeignKey) {
        await queryRunner.dropForeignKey('appointments', serviceIdForeignKey);
      }
    }

    // Drop the old serviceId column (no longer needed with junction table)
    await queryRunner.dropColumn('appointments', 'serviceId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add serviceId column to appointments
    await queryRunner.query(`
      ALTER TABLE appointments 
      ADD COLUMN serviceId int NULL
    `);

    // Restore data: take the first service from appointment_services
    await queryRunner.query(`
      UPDATE appointments a
      SET serviceId = (
        SELECT serviceId 
        FROM appointment_services aps 
        WHERE aps.appointmentId = a.appointmentId 
        LIMIT 1
      )
    `);

    // Make serviceId NOT NULL
    await queryRunner.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN serviceId int NOT NULL
    `);

    // Re-create foreign key
    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        columnNames: ['serviceId'],
        referencedColumnNames: ['serviceId'],
        referencedTableName: 'services',
        onDelete: 'RESTRICT',
      }),
    );

    // Drop foreign keys
    const table = await queryRunner.getTable('appointment_services');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('appointment_services', foreignKey);
      }
    }

    // Drop appointment_services table
    await queryRunner.dropTable('appointment_services');
  }
}
