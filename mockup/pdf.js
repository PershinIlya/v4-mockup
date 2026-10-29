// Prints a rendered report HTML to PDF with Chromium (pre-installed Playwright).
// Input on stdin: {"html": path, "pdf": path, "header": html, "footer": html, "margins": [t,r,b,l] mm}
const { chromium } = require('playwright');
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', async () => {
  const job = JSON.parse(input);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + job.html, { waitUntil: 'load' });
  const [t, r, b, l] = job.margins.map((m) => m + 'mm');
  await page.pdf({
    path: job.pdf, format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: job.header, footerTemplate: job.footer,
    margin: { top: t, right: r, bottom: b, left: l },
  });
  await browser.close();
});
