import puppeteer from 'puppeteer';
import download from 'download';

const facade = {
	links: [
		
	]
};

async function setLinks() {
	const browser = await puppeteer.launch({ headless: false });

	try {
		const page = await browser.newPage();

		await page.goto('https://www.pciconcursos.com.br/provas/tecnologia-da-informacao-comperve/');

		await page.waitForSelector('#lista_provas');

		const links = await page.evaluate(() => {
			const anchors = Array.from(document.querySelectorAll('.prova_download'));
			return anchors.map(anchor => {
				return anchor.href;
			});
		});

		facade.links = links;

		console.log("Links armazenados");
	} catch (ex) {
		console.log("Erro ao armazenar links");
		console.error(ex);
	} finally {
		await browser.close();
	}
}

async function getPDF() {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	const filePath = `./files`; 

	try {
		for (let i = 0; i < facade.links.length; i++) {
			const url = facade.links[i];

			await page.goto(`${url}`, {waitUntil: 'load', timeout: 0});

			const infosSelector = await page.waitForSelector(".link-d li");
			const infos = await infosSelector.evaluate(() => {
				const li = Array.from(document.querySelectorAll(".link-d li"));

				const cargo = li[0].textContent.split(':')[1].trim();
				const ano = li[1].textContent.split(':')[1].trim();
				const orgao = li[2].textContent.split(':')[1].trim();

				return {
					cargo,
					ano,
					orgao
				}
			});

			const anchorProva = await page.waitForSelector(".pdf_download > li > a");
			const anchorGabarito = await page.waitForSelector(".pdf_download li + li > a");
			const linkProva = await anchorProva.evaluate(e => e.href);
			const linkGabarito = await anchorGabarito.evaluate(e => e.href);

			Promise.all([
				await download(linkProva, `${filePath}/${infos.cargo}_${infos.ano}_${infos.orgao}`),
				await download(linkGabarito, `${filePath}/${infos.cargo}_${infos.ano}_${infos.orgao}`),
			]).then(() => {
				console.log(`[OK] ${linkProva}`);
				console.log(`[OK] ${linkGabarito}\n`);
			});
		}

		console.log("Downloads realizados :)");
	} catch (e) {
		console.log("Erro ao acessar link :(");
		console.log(e);
	} finally {
		await browser.close();
	}
}

async function main() {
	await setLinks();
	await getPDF();

	console.log("The end. :)")
}

main();
