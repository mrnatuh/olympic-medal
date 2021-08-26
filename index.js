const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const { pageExtend } = require('puppeteer-jquery');
const medalhas = require("./medalhas_paraolympics.json");
const medalhasJson = require('./medalhas-manual_paraolympics.json');

async function writeFile(data) {
    try {
        await fs.writeFile('medalhas-manual_paraolympics.json', JSON.stringify(data));
        console.log('🌎', 'Cole o arquivo medalhas-manual_paraolympics.json em davs://upload.intranet/commons.uol.com.br/sistemas/odf');
    } catch (error) {
        console.error(`Got an error trying to write to a file: ${error.message}`);
    }
}

(async() => {
    let browser = await puppeteer.launch({headless: true});
    let pageOrg = await browser.newPage();

    await pageOrg.goto('https://olympics.com/tokyo-2020/paralympic-games/en/results/all-sports/medal-standings.htm', {
        waitUntil: 'networkidle2',
    });

    let jqPage = pageExtend(pageOrg);

    // get all li text in the page as an array
    const data = await jqPage
        .jQuery('#medal-standing-table tbody tr')
        .map((id, elm) => {
            const depara = {
                "BEN":"BEM",
                "BHU":"BUT",
                "BIH":"BOS",
                "BUR":"BFA",
                "BDI":"BUR",
                "CAM":"CBJ",
                "CMR":"CAM",
                "CPV":"CBV",
                "CAF":"RCA",
                "CGO":"CON",
                "CRC":"COS",
                "CIV":"CMA",
                "CYP":"CHP",
                "CZE":"RCH",
                "COD":"COG",
                "DEN":"DIN",
                "ECU":"EQU",
                "EGY":"EGI",
                "ETH":"ETI",
                "GER":"ALE",
                "GHA":"GAN",
                "GRN":"GRA",
                "IRI":"IRA",
                "JPN":"JAP",
                "KAZ":"CAZ",
                "KEN":"QUE",
                "KUW":"KUA",
                "KGZ":"QRG",
                "LAT":"LET",
                "LBN":"LIB",
                "LTU":"LIT",
                "MAS":"MAL",
                "MGL":"MOG",
                "MOZ":"MOC",
                "NED":"HOL",
                "NCA":"NIC",
                "MKD":"MCD",
                "PAK":"PAQ",
                "PHI":"FIL",
                "RPT":"AOR",
                "KOR":"CDS",
                "MDA":"MOL",
                "ROU":"ROM",
                "RWA":"RUA",
                "KSA":"SAL",
                "SGP":"CGP",
                "RSA":"SAL",
                "VIN":"SVI",
                "SWE":"SUE",
                "SYR":"SIR",
                "UKR":"UCR",
                "UAE":"EAU",
                "USA":"EUA",
                "YEM":"IEM"
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
    
    // todos acrons atualizados
    let updates = [];
    
    // todos acrons coletados (tabela inteira da ODF)
    let allAcron = [];

    data.map(item => {
        if (medalhas.countries[item.acron]) {
            let update = false;
            
            allAcron.push(item.acron);

            const country = medalhasJson.countries[item.acron] || null;

            if(country) {
                if (country.total && country.total !== item.total ||
                    country.ouro && country.ouro !== item.ouro || 
                    country.prata && country.prata !== item.prata ||
                    country.bronze && country.bronze !== item.bronze) {
                    update = true;
                }

                if (update) updates.push(item.acron);
            } else {
                updates.push(item.acron);   
            }

            medalhas.countries[item.acron].score = {
                total: item.total,
                ouro: item.ouro,
                prata: item.prata,
                bronze: item.bronze
            };

        } else {
            if (medalhas && medalhas.countries[item.acron] && medalhas.countries[item.acron].score) {
                delete medalhas.countries[item.acron].score;
            }
        }

        //if (medalhas && medalhas.countries[item.acron] && medalhas.countries[item.acron].medals) {
            //delete medalhas.countries[item.acron].medals;
        //}
    }); 

    // deleta acrons do medalhas.order desatualizado
    const oldAcron = medalhas.order.filter(acron => !allAcron.includes(acron));
    //console.log("[acrons restantes]", JSON.stringify(medalhas.order));

    // inclui order atualizado da ODF (quantos itens tiver)
    medalhas.order = [...allAcron, ...oldAcron];
    
    console.info("[acrons vindos da ODF]", JSON.stringify(allAcron));
    
    console.info("🆕 [acrons atualizados]", JSON.stringify(updates));

    await writeFile(medalhas);

    process.exit();
})();