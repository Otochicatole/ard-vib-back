import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Activar modo WAL (Write-Ahead Logging) en SQLite para lecturas y escrituras concurrentes sin bloqueo
export async function initializeDatabase(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  } catch (error) {
    console.error('No se pudo activar el modo WAL en SQLite:', error);
  }
}
