import * as dotenv from 'dotenv';
import { getDb, schema } from '../src/server/db/index';

dotenv.config();

async function seed() {
  try {
    console.log('[Seed] Starting database seed...');

    const db = await getDb();

    // Parse domains from env variable
    const domainsStr = process.env.ALLOWED_EMAIL_DOMAINS || 'unifacig.edu.br';
    const domains = domainsStr.split(',').map(d => d.trim()).filter(d => d);

    console.log(`[Seed] Adding allowed domains: ${domains.join(', ')}`);

    // Insert allowed domains
    for (const domain of domains) {
      try {
        await db.insert(schema.allowedDomains).values({
          domain,
          isActive: true
        }).onDuplicateKeyUpdate({ set: { isActive: true } });
        console.log(`[Seed] ✓ Added domain: ${domain}`);
      } catch (error: any) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`[Seed] Error adding domain ${domain}:`, error);
        }
      }
    }

    console.log('[Seed] Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Fatal error:', error);
    process.exit(1);
  }
}

seed();
