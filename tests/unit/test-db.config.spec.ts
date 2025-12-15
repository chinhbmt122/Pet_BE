import { getTestDatabaseConfig } from '../e2e/test-db.config';

describe('test DB config safety guard', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws when dropSchema true and DB name is not test and host is remote', () => {
    process.env.DATABASE_TYPE = 'postgres';
    process.env.DB_DROP_SCHEMA = 'true';
    process.env.DB_SYNCHRONIZE = 'false';
    process.env.DB_NAME = 'pet_care_db';
    process.env.DB_HOST = 'prod-db.example.com';

    expect(() => getTestDatabaseConfig()).toThrow(
      /Refusing to enable destructive DB operations on non-test DB/,
    );
  });

  it('does not throw for test DB name', () => {
    process.env.DATABASE_TYPE = 'postgres';
    process.env.DB_DROP_SCHEMA = 'true';
    process.env.DB_NAME = 'pet_care_test_db';
    process.env.DB_HOST = 'prod-db.example.com';

    expect(() => getTestDatabaseConfig()).not.toThrow();
  });
});
