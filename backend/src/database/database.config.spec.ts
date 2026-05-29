import { resolveDatabaseConfig } from './database.config';

describe('database config', () => {
  it('resolves PostgreSQL metadata from DATABASE_URL without exposing credentials', () => {
    const values: Record<string, string> = {
      DB_ENABLED: 'true',
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5432/dong_ho_nguyen_tri',
    };
    const config = resolveDatabaseConfig({
      get: (key: string) => values[key],
    });

    expect(config).toEqual({
      enabled: true,
      mode: 'postgres',
      orm: 'prisma',
      host: 'localhost',
      port: 5432,
      name: 'dong_ho_nguyen_tri',
      url: 'postgresql://postgres:postgres@localhost:5432/dong_ho_nguyen_tri',
    });
  });
});
