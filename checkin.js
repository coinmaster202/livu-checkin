const puppeteer = require('puppeteer');
const https = require('https');

function fetchAccounts() {
  return new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/coinmaster202/livu-checkin-data/main/accounts.txt', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim().split('\n')));
    }).on('error', reject);
  });
}

module.exports = async function runCheckins() {
  const accounts = await fetchAccounts();
  const browser = await puppeteer.launch({ headless: true });

  for (const line of accounts) {
    const [email, password] = line.split(',');
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    try {
      await page.goto('https://www.livuapp.com/login', { waitUntil: 'networkidle2' });

      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);

      const btn = await page.$x("//button[contains(text(), 'Check-in') or contains(text(), 'Daily Reward')]");
      if (btn.length > 0) {
        await btn[0].click();
        await page.waitForTimeout(2000);
        console.log(`✅ Checked in: ${email}`);
      } else {
        console.log(`⚠️ No check-in button for ${email}`);
      }
    } catch (e) {
      console.log(`❌ Error with ${email}: ${e.message}`);
    }

    await context.close();
  }

  await browser.close();
};
