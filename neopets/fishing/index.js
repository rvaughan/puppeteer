require('dotenv').load();
var fs = require('fs');
const puppeteer = require('puppeteer');
const {neopets_login} = require('../login/index.js');

const whereto1 = "http://www.neopets.com/quickref.phtml";
const whereto2 = "http://www.neopets.com/process_changepet.phtml?new_active_pet=";
const whereto3 = "http://www.neopets.com/water/fishing.phtml";

(async () => {

  console.log("Launching Headless Chrome");
  const browser = await neopets_login(
    process.env.NEOPETS_USERNAME,
    process.env.NEOPETS_PASSWORD
  );

  console.log("Browser opening new tab");
  const page = await browser.newPage();

  console.log(`Page going to ${whereto1}`);
  await page.goto(whereto1);

  const neopets = await page.$$eval("img[width='50'][height='50'][border='0']", imgs => {
    const names = [...imgs]
      .filter(el => el.id.length > 0)
      .map(el => el.title);
    return [...new Set(names)];
  });

  const date = new Date().toISOString().split("T")[0];
  const save_dir = `dump/${date}`;
  if (!fs.existsSync(save_dir)) fs.mkdirSync(save_dir);

  for (let neopet of neopets) {

    console.log(`Going fishing with ${neopet}`);
    await page.goto(whereto2 + neopet);
    await page.goto(whereto3);

    await page.click("input[type='submit'][value='Reel In Your Line']");
    await page.waitForNavigation({waitUntil: "load"});

    const save_path = `${save_dir}/${neopet}_fishing_results.png`;
    if (!fs.existsSync(save_path)) {
      console.log(`Saving ${neopet}'s fishing results as ${save_path}`);
      await page.screenshot({path: save_path});
    } else console.log(`Already fished with ${neopet} today`);

  }

  console.log("Closing Headless Chrome")
  await browser.close();

})();