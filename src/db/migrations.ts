import { pool } from "../config/db";
import { buildUmzug } from "./umzug";
import { logger } from "../config/logger";

const cmd = process.argv[2];

void (async () => {
  const umzug = buildUmzug(pool);
  try {
    if (cmd === 'up') {
      const ran = await umzug.up();
      logger.info(`Applied ${ran.length} migrations: ${ran.map((m) => m.name).join(', ') || '(none)'}`);
    } else if (cmd === 'down') {
      const reverted = await umzug.down();
      logger.info(`Reverted ${reverted.length} migrations: ${reverted.map((m) => m.name).join(', ') || '(none)'}`);
    } else if (cmd === 'pending') {
      const pending = await umzug.pending();
      logger.info(`Pending (${pending.length}): ${pending.map((m) => m.name).join(', ') || '(none)'}`);
    } else {
      throw new Error(`Unknown command "${cmd}". Use: up | down | pending`);
    }
  } catch (err) {
    logger.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();