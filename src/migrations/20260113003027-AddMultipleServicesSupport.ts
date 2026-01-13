import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AddMultipleServicesSupport20260113003027 implements MigrationInterface {
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

    // Add foreign key to appointments
    await queryRunner.createForeignKey(
      'appointment_services',
      new TableForeignKey({
        columnNames: ['appointmentId'],
        referencedColumnNames: ['appointmentId'],
        referencedTableName: 'appointments',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to services
    await queryRunner.createForeignKey(
      'appointment_services',
      new TableForeignKey({
        columnNames: ['serviceId'],
        referencedColumnNames: ['serviceId'],
        referencedTableName: 'services',
        onDelete: 'RESTRICT',
      }),
    );

    // Create index for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_appointment_services_appointmentId" ON "appointment_services" ("appointmentId")
    `);

    // Migrate existing data from appointments.serviceId to appointment_services
    await queryRunner.query(`
      INSERT INTO appointment_services (appointmentId, serviceId, quantity, unitPrice, notes)
      SELECT 
        a.appointmentId,
        a.serviceId,
        1 as quantity,
        COALESCE(s.basePrice, 0) as unitPrice,
        NULL as notes
      FROM appointments a
      INNER JOIN services s ON a.serviceId = s.serviceId
      WHERE a.serviceId IS NOT NULL
    `);

    console.log('✅ Multi-service support added successfully');
    console.log(
      '✅ Existing appointments migrated to appointment_services table',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const appointmentServicesTable = await queryRunner.getTable(
      'appointment_services',
    );
    const foreignKeys = appointmentServicesTable?.foreignKeys;

    if (foreignKeys) {
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('appointment_services', fk);
      }
    }

    // Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_appointment_services_appointmentId"`,
    );

    // Drop table
    await queryRunner.dropTable('appointment_services');

    console.log('✅ Multi-service support removed');
  }
}
