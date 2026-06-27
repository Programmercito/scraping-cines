import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const POSITION_FILE = process.env.POSITION_FILE || '/opt/osbo/current-position.png';

export async function trackPosition(page: Page): Promise<void> {
  const dir = path.dirname(POSITION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  page.on('framenavigated', async (frame) => {
    if (frame !== page.mainFrame()) return;
    try {
      await frame.waitForLoadState('domcontentloaded', { timeout: 5000 });
      await page.screenshot({ path: POSITION_FILE, fullPage: true });
    } catch {
      try {
        await page.screenshot({ path: POSITION_FILE, fullPage: true });
      } catch {
      }
    }
  });
}