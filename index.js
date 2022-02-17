const fs = require('fs');
const puppeteer = require('puppeteer');
const https = require('https');

const download = (url, destination) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close(resolve(true));
        });
      })
      .on('error', (error) => {
        fs.unlink(destination);

        reject(error.message);
      });
  });

const generateHash = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array(6)
    .fill()
    .map((_) => chars[Math.floor(Math.random() * chars.length)])
    .join('');
};

const linksArray = Array(100)
  .fill()
  .map((_) => generateHash());

const len = linksArray.length;

(async () => {
  console.log('start...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 400,
      devtools: false,
    });
    let page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 768 });

    for (let i = 0; i < linksArray.length; i++) {
      const url = linksArray[i];
      try {
        await page.goto(`https://prnt.sc/${url}`, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.no-click.screenshot-image');

        const image = await page.evaluate(
          () => document.querySelector('.no-click.screenshot-image').src,
        );

        /* detect removed screen placeholder ??
        if (image.includes('https://st.prntscr.com/')) {
          console.log(`fail ${url}.png | ${i > 9 ? ' ' : ''}-/${len} | was removed`);
          linksArray[i] = generateHash();
          i--;
          continue;
        }

        
        if (image === '') { // detect empty screen placeholder ??
          console.log(`fail ${url}.png | ${i > 9 ? ' ' : ''}-/${len} | bad hash >> empty`);
          linksArray[i] = generateHash();
          i--;
          continue;
        }
        */

        await download(image, `images/${url}.png`);
        console.log(`save ${url}.png | ${i + 1}/${len}`);
      } catch (error) {
        // console.log(error);
        console.log(`fail ${url}.png | ${i > 9 ? ' ' : ''}-/${len} | download failed`);
        linksArray[i] = generateHash();
        i--;
      }
    }
    console.log('done!');
    await browser.close();
  } catch (error) {
    console.log(error);
    await browser.close();
  }
})();
