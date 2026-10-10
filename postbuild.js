const fs = require('fs');
const path = require('path');

const prefix = '[postbuild]';

const browserPath = path.join(__dirname, 'dist', 'julian-scholz', 'browser');
// The german source locale is built into the root, every other locale into its own directory
const localeDirectories = ['', 'en'];
// The assets are copied into every locale, these only matter at the root of the site
const rootOnlyFiles = ['_headers', 'robots.txt', 'sitemap.xml'];

for (const localeDirectory of localeDirectories) {
  const filesToDelete = ['index.csr.html', ...(localeDirectory ? rootOnlyFiles : [])];
  for (const fileToDelete of filesToDelete) {
    const fileToDeletePath = path.join(browserPath, localeDirectory, fileToDelete);
    if (fs.existsSync(fileToDeletePath)) {
      try {
        fs.rmSync(fileToDeletePath);
        console.log(`${prefix} Deleted ${path.join(localeDirectory, fileToDelete)}.`);
      } catch (err) {
        console.error(`${prefix}`, err);
        process.exit(1);
      }
    }
  }
}

const sitemapPath = path.join(browserPath, 'sitemap.xml');
fs.readFile(sitemapPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`${prefix}`, err);
    process.exit(1);
  }

  const dateToday = new Date();
  const correctDateToday = new Date(dateToday.getTime() - (dateToday.getTimezoneOffset() * 60 * 1000));
  const sitemapResult = data.replaceAll(
    '<lastmod></lastmod>',
    `<lastmod>${correctDateToday.toISOString().split('T')[0]}</lastmod>`
  );

  fs.writeFile(sitemapPath, sitemapResult, 'utf8', (err) => {
    if (err) {
      console.error(`${prefix}`, err);
      process.exit(1);
    } else {
      console.log(`${prefix} Edited sitemap.xml.`);
    }
  });
});
