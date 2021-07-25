const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const { pageExtend } = require('puppeteer-jquery');
const medalhas = require("./medalhas");

async function writeFile(data) {
    try {
        await fs.writeFile('medalhas-manual.json', JSON.stringify(data));
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
            const depara = {
                "JPN":"JAP",
                "USA":"EUA",
                "KOR":"CDS",
                "ECU":"EQU",
                "IRI":"IRA",
                "THA":"TAI",
                "NED":"HOL",
                "ROU":"ROM",
                "GER":"ALE",
                "KAZ":"CAZ",
                "MGL":"MOG",
                "UKR":"UCR"
            };

            const pos = jQuery(elm).find('td:eq(0) strong').text();
            let acron = jQuery(elm).find('td:eq(1) .playerTag').attr('country');
            if (depara.hasOwnProperty(acron)) acron = depara[acron];

            const ouro = parseInt(jQuery(elm).find('td:eq(2) a').text().replace(/\n/gi, "")) || 0;
            const prata = parseInt(jQuery(elm).find('td:eq(3) a').text().replace(/\n/gi, "")) || 0;
            const bronze = parseInt(jQuery(elm).find('td:eq(4) a').text().replace(/\n/gi, "")) || 0;
            const total = parseInt(jQuery(elm).find('td:eq(5) a').text().replace(/\n/gi, "")) || 0;
            
            return { acron, ouro, prata, bronze, total };
        
        }).pojo();

    
    // JSON da tabela
    let updates = [];
    data.map(item => {
        if (medalhas.countries[item.acron]) {
            updates.push(item.acron);

            medalhas.countries[item.acron].score = {
                total: item.total,
                ouro: item.ouro,
                prata: item.prata,
                bronze: item.bronze
            };
        } else {
            delete medalhas.countries[item.acron].score;
        }

        delete medalhas.countries[item.acron].medals;
    }); 
    
    console.log(updates, updates.length);

    await writeFile(medalhas);
    
    //console.log(medalhas);

    process.exit();
})();