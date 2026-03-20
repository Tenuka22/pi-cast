/**
 * Database Index Optimization Script
 * 
 * Creates performance indexes for commonly queried columns.
 * Run this after deploying new schema to optimize query performance.
 * 
 * Usage:
 *   bun run db:index
 */

import { createClient } from '@libsql/client';
import { ENV } from 'varlock/env';

// Convert relative file path to absolute file:// URL
const dbUrl = ENV.DATABASE_URL.startsWith('file:') 
  ? ENV.DATABASE_URL 
  : `file:${ENV.DATABASE_URL}`;

const client = createClient({
  url: dbUrl,
});

interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
  where?: string; // Partial index condition
}

const indexes: IndexDefinition[] = [
  // User indexes
  {
    name: 'user_email_idx',
    table: 'user',
    columns: ['email'],
    unique: true, // Already unique from schema
  },
  {
    name: 'user_role_idx',
    table: 'user',
    columns: ['role'],
  },
  {
    name: 'user_created_at_idx',
    table: 'user',
    columns: ['created_at'],
  },
  {
    name: 'user_email_verified_idx',
    table: 'user',
    columns: ['email_verified'],
  },

  // Session indexes
  {
    name: 'session_token_idx',
    table: 'session',
    columns: ['token'],
    unique: true,
  },
  {
    name: 'session_expires_at_idx',
    table: 'session',
    columns: ['expires_at'],
  },
  {
    name: 'session_user_id_expires_idx',
    table: 'session',
    columns: ['user_id', 'expires_at'],
  },

  // Account indexes
  {
    name: 'account_provider_idx',
    table: 'account',
    columns: ['provider_id', 'account_id'],
  },
  {
    name: 'account_user_id_idx',
    table: 'account',
    columns: ['user_id'],
  },

  // Verification indexes
  {
    name: 'verification_value_idx',
    table: 'verification',
    columns: ['value'],
  },
  {
    name: 'verification_expires_at_idx',
    table: 'verification',
    columns: ['expires_at'],
  },

  // Organization indexes
  {
    name: 'organization_slug_idx',
    table: 'organization',
    columns: ['slug'],
    unique: true,
  },
  {
    name: 'organization_created_at_idx',
    table: 'organization',
    columns: ['created_at'],
  },

  // Member indexes
  {
    name: 'member_user_org_idx',
    table: 'member',
    columns: ['user_id', 'organization_id'],
    unique: true,
  },
  {
    name: 'member_role_idx',
    table: 'member',
    columns: ['role'],
  },

  // Invitation indexes
  {
    name: 'invitation_email_status_idx',
    table: 'invitation',
    columns: ['email', 'status'],
  },
  {
    name: 'invitation_expires_at_idx',
    table: 'invitation',
    columns: ['expires_at'],
  },

  // Lesson indexes
  {
    name: 'lesson_creator_status_idx',
    table: 'lesson',
    columns: ['creator_id', 'status'],
  },
  {
    name: 'lesson_visibility_idx',
    table: 'lesson',
    columns: ['visibility'],
  },
  {
    name: 'lesson_category_idx',
    table: 'lesson',
    columns: ['category_id'],
  },
  {
    name: 'lesson_tags_idx',
    table: 'lesson',
    columns: ['tags'],
  },
  {
    name: 'lesson_created_at_idx',
    table: 'lesson',
    columns: ['created_at'],
  },
  {
    name: 'lesson_published_at_idx',
    table: 'lesson',
    columns: ['published_at'],
  },
  {
    name: 'lesson_views_idx',
    table: 'lesson',
    columns: ['views'],
  },
  {
    name: 'lesson_rating_idx',
    table: 'lesson',
    columns: ['average_rating'],
  },

  // Lesson block indexes
  {
    name: 'lesson_block_lesson_order_idx',
    table: 'lesson_block',
    columns: ['lesson_id', 'order'],
  },

  // Lesson recording indexes
  {
    name: 'lesson_recording_lesson_idx',
    table: 'lesson_recording',
    columns: ['lesson_id'],
  },

  // Lesson bookmark indexes
  {
    name: 'lesson_bookmark_lesson_timestamp_idx',
    table: 'lesson_bookmark',
    columns: ['lesson_id', 'timestamp'],
  },
  {
    name: 'lesson_bookmark_creator_idx',
    table: 'lesson_bookmark',
    columns: ['creator_id'],
  },
  {
    name: 'lesson_bookmark_type_idx',
    table: 'lesson_bookmark',
    columns: ['type'],
  },

  // Lesson note indexes
  {
    name: 'lesson_note_lesson_user_idx',
    table: 'lesson_note',
    columns: ['lesson_id', 'user_id'],
  },
  {
    name: 'lesson_note_timestamp_idx',
    table: 'lesson_note',
    columns: ['timestamp'],
  },

  // Lesson enrollment indexes
  {
    name: 'lesson_enrollment_user_lessons_idx',
    table: 'lesson_enrollment',
    columns: ['user_id', 'lesson_id'],
    unique: true,
  },
  {
    name: 'lesson_enrollment_progress_idx',
    table: 'lesson_enrollment',
    columns: ['progress'],
  },
  {
    name: 'lesson_enrollment_completed_idx',
    table: 'lesson_enrollment',
    columns: ['is_completed'],
  },
  {
    name: 'lesson_enrollment_last_accessed_idx',
    table: 'lesson_enrollment',
    columns: ['last_accessed_at'],
  },

  // Category indexes
  {
    name: 'category_slug_idx',
    table: 'category',
    columns: ['slug'],
    unique: true,
  },
  {
    name: 'category_parent_idx',
    table: 'category',
    columns: ['parent_category_id'],
  },
  {
    name: 'category_featured_idx',
    table: 'category',
    columns: ['is_featured'],
  },

  // Course indexes
  {
    name: 'course_creator_idx',
    table: 'course',
    columns: ['creator_id'],
  },
  {
    name: 'course_category_idx',
    table: 'course',
    columns: ['category_id'],
  },
  {
    name: 'course_published_idx',
    table: 'course',
    columns: ['is_published'],
  },

  // Course lesson indexes
  {
    name: 'course_lesson_course_order_idx',
    table: 'course_lesson',
    columns: ['course_id', 'order'],
  },
  {
    name: 'course_lesson_lesson_idx',
    table: 'course_lesson',
    columns: ['lesson_id'],
  },
];

async function createIndexIfNotExists(index: IndexDefinition) {
  // Use provided name or generate one
  const indexName = index.name || `${index.table}_${index.columns.join('_')}_idx`;
  const columns = index.columns.join(', ');
  const uniqueClause = index.unique ? 'UNIQUE ' : '';
  const whereClause = index.where ? ` WHERE ${index.where}` : '';

  try {
    // Check if index already exists
    const existing = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='index' AND name = ?`,
      args: [indexName],
    });

    if (existing.rows.length > 0 && existing.rows[0]) {
      console.log(`  ⏭️  Index ${indexName} already exists`);
      return false;
    }

    // Create index
    await client.execute({
      sql: `CREATE ${uniqueClause}INDEX ${indexName} ON ${index.table} (${columns})${whereClause}`,
      args: [],
    });

    console.log(`  ✅ Created index: ${indexName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create index ${indexName}:`, error);
    return false;
  }
}

async function getDatabaseStats() {
  const tables = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    args: [],
  });

  console.log('\n📊 Database Statistics:\n');
  console.log(`  Tables: ${tables.rows.length}`);

  const dbIndexes = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='index' ORDER BY name`,
    args: [],
  });

  console.log(`  Indexes: ${dbIndexes.rows.length}`);

  // Get table row counts
  for (const table of tables.rows) {
    const tableName = table?.name as string;
    if (tableName) {
      const count = await client.execute({
        sql: `SELECT COUNT(*) as count FROM "${tableName}"`,
        args: [],
      });
      const rowCount = count.rows[0]?.count as number;
      console.log(`  - ${tableName}: ${rowCount} rows`);
    }
  }
}

async function main() {
  console.log('🚀 Database Index Optimization\n');
  console.log(`Database: ${ENV.DATABASE_URL}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const index of indexes) {
    const result = await createIndexIfNotExists(index);
    if (result) created++;
    else if (result === false) skipped++;
    else failed++;
  }

  console.log('\n📈 Summary:\n');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);

  await getDatabaseStats();

  console.log('\n✅ Index optimization complete!\n');
  
  // Close connection
  client.close();
}

// Run migration
main().catch((error) => {
  console.error('❌ Index optimization failed:', error);
  client.close();
  process.exit(1);
});
