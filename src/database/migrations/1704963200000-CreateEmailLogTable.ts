import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailLogTable1704963200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_logs',
        columns: [
          {
            name: 'emailLogId',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'recipient',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'emailType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'failed', 'bounced'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'retryCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'idx_email_log_recipient',
        columnNames: ['recipient'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'idx_email_log_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'idx_email_log_sent_at',
        columnNames: ['sentAt'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'idx_email_log_type',
        columnNames: ['emailType'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_logs');
  }
}
