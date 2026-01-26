import { neon } from '@neondatabase/serverless';

// Get database URL from environment variable
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env.local file or Vercel environment variables.');
  }
  return url;
};

// Create SQL query function
export const sql = neon(getDatabaseUrl());

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}
