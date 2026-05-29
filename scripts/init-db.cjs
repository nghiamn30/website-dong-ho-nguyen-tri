const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createRequire } = require('module');

const requireFromBackend = createRequire(
  path.resolve(__dirname, '../backend/package.json'),
);
const { Client } = requireFromBackend('pg');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const envPath = path.resolve(process.cwd(), options.env);

  loadDotEnv(envPath);

  if (!isTruthy(process.env.DB_ENABLED)) {
    throw new Error(
      'DB_ENABLED is not true. Set DB_ENABLED=true in backend/.env before initializing the database.',
    );
  }

  const settings = resolveDatabaseSettings();
  const maintenanceClient = new Client({
    ...settings.clientConfig,
    database: 'postgres',
  });

  await maintenanceClient.connect();
  try {
    const exists = await maintenanceClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [settings.databaseName],
    );

    if (exists.rowCount === 0) {
      await maintenanceClient.query(
        `CREATE DATABASE "${escapeIdentifier(settings.databaseName)}"`,
      );
      console.log(`Created database: ${settings.databaseName}`);
    } else {
      console.log(`Database already exists: ${settings.databaseName}`);
    }
  } finally {
    await maintenanceClient.end();
  }

  if (options.skipPrisma) {
    return;
  }

  await runPrismaMigrateDeploy();
}

function isTruthy(value) {
  return ['true', '1', 'yes', 'on'].includes(
    String(value || '').trim().toLowerCase(),
  );
}

function parseArgs(args) {
  const options = {
    env: 'backend/.env',
    skipPrisma: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--env') {
      options.env = readValue(args, (index += 1), arg);
      continue;
    }

    if (arg === '--skip-prisma') {
      options.skipPrisma = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function runPrismaMigrateDeploy() {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  return new Promise((resolve, reject) => {
    const child = spawn(
      command,
      ['--dir', 'backend', 'prisma', 'migrate', 'deploy'],
      {
        cwd: process.cwd(),
        env: process.env,
        shell: process.platform === 'win32',
        stdio: 'inherit',
      },
    );

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Prisma migrate deploy failed with exit code ${code}.`));
    });
  });
}

function readValue(args, index, name) {
  const value = args[index];
  if (!value) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    process.env[key] = value;
  }
}

function resolveDatabaseSettings() {
  let databaseName = process.env.DB_NAME || 'dong_ho_nguyen_tri';
  let clientConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };

  if (process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);

    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      throw new Error('DATABASE_URL must use postgresql:// or postgres://.');
    }

    databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    clientConfig = {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username || clientConfig.user),
      password: decodeURIComponent(parsed.password || clientConfig.password),
    };
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)) {
    throw new Error(
      'DB_NAME must contain only letters, numbers, and underscores.',
    );
  }

  return { databaseName, clientConfig };
}

function escapeIdentifier(value) {
  return value.replace(/"/g, '""');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
