const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const { pageExtend } = require('puppeteer-jquery');

async function writeFile(data) {
    try {
        await fs.writeFile('data.json', JSON.stringify(data));
        console.log(';)');
    } catch (error) {
        console.error(`Got an error trying to write to a file: ${error.message}`);
    }
}

(async() => {
    let browser = await puppeteer.launch({headless: true});
    let pageOrg = await browser.newPage();

    await pageOrg.goto('https://olympics.com/tokyo-2020/olympic-games/en/results/all-sports/medal-standings.htm', {
        waitUntil: 'networkidle2',
    });

    let jqPage = pageExtend(pageOrg);
    
    // get all li text in the page as an array
    const data = await jqPage
        .jQuery('#medal-standing-table tbody tr')
        .map((id, elm) => {
            const pos = jQuery(elm).find('td:eq(0) strong').text();
            const country = jQuery(elm).find('td:eq(1)').attr('data-text');
            const acron = jQuery(elm).find('td:eq(1) .playerTag').attr('country');
            const gold = parseInt(jQuery(elm).find('td:eq(2) a').text().replace(/\n/gi, "")) || 0;
            const silver = parseInt(jQuery(elm).find('td:eq(3) a').text().replace(/\n/gi, "")) || 0;
            const bronze = parseInt(jQuery(elm).find('td:eq(4) a').text().replace(/\n/gi, "")) || 0;
            const total = parseInt(jQuery(elm).find('td:eq(5) a').text().replace(/\n/gi, "")) || 0;
            const rank = parseInt(jQuery(elm).find('td:eq(6)').text().replace(/\n/gi, "")) || 0;
            return { pos, country, acron, gold, silver, bronze, total, rank };
        }).pojo();

    await writeFile(data);

    process.exit(1);
})();