const puppeteer = require('puppeteer');
const https = require('https');

// 🔐 Set your default password here
const DEFAULT_PASSWORD = '000000';

// 📥 Fetch accounts from GitHub-hosted raw .txt file
function fetchEmails() {
  return new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/coinmaster202/livu-checkin-data/main/accounts.txt', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim().split('\n').map(e => e.trim()).filter(Boolean)));
    }).on('error', reject);
  });
}

module.exports = async function runCheckins() {
  const emails = await fetchEmails();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const email of emails) {
    const password = DEFAULT_PASSWORD;
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    try {
      console.log(`🔐 Logging in as: ${email}`);
      await page.goto('https://www.livuapp.com/login', { waitUntil: 'networkidle2' });

      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);

      // Try to find a check-in or daily reward button
      const btn = await page.$x("//button[contains(text(), 'Check-in') or contains(text(), 'Daily Reward')]");
      if (btn.length > 0) {
        await btn[0].click();
        await page.waitForTimeout(2000);
        console.log(`✅ Checked in: ${email}`);
      } else {
        console.log(`⚠️ No check-in button found for ${email}`);
      }

    } catch (err) {
      console.error(`❌ Failed for ${email}: ${err.message}`);
    }

    await context.close();
  }

  await browser.close();
};
