const puppeteer = require('puppeteer');
const puppeteerConfig = require('./.puppeteerrc.cjs');
const fs = require('fs');
// import path from 'path';
const path = require('path');
const { Client: FTP } = require('basic-ftp');  // Import the FTP library
const { Readable } = require('stream');
// Merge the Puppeteer configuration with the default options
const mergedConfig = Object.assign({}, puppeteerConfig, {
    // Add other default options here if needed
});

// Launch Puppeteer with the merged configuration
const launchOptions = {
    headless: "new", // Set to true for headless mode, or false for visible mode
    ...mergedConfig, // Spread the merged configuration here
    args: ['--no-sandbox']
};

const runAutomation = async () => {
    try {
        console.log("Iniciando ejecución del flujo automatizado");

        // Iniciar una instancia de Puppeteer
        const browser = await puppeteer.launch(launchOptions);

        // Crear una nueva página
        const page = await browser.newPage();

        // Configurar los datos de inicio de sesión
        const username = 'duran';
        const password = 'Schloss!19!21';

        // Navegar a la página de inicio de sesión
        await page.goto('https://app.debevet.de/signin?cna=72416&redirect=dashboard');

        // Esperar a que se cargue el formulario de inicio de sesión
        await page.waitForSelector('input[name="username"]');

        // Rellenar el formulario de inicio de sesión y hacer clic en el botón de inicio de sesión
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        await page.click('button[class="btn btn-default"]');

        // Navegar a la página deseada (cambiar por la nueva URL)
        await page.goto('https://app.debevet.de/contact/contact');

        // Esperar a que se cargue la tabla
        await page.waitForSelector('table#contactList tbody tr');

        // Simular el scrolling hacia abajo para cargar todas las filas de la tabla
        await autoScroll(page);


        // Obtener los datos de la tabla
        const data = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table#contactList tbody tr'));
            return rows.map((row) => {
                const columns = row.querySelectorAll('td');
                const customerNoUrl = columns[1].querySelector('a').getAttribute('href');
                const customerNo = columns[1].querySelector('a').innerText;
                const customerNumber = customerNoUrl.split('/').pop();
                return {
                    CUSTOMER_NO_URL: customerNoUrl,
                    CUSTOMER_NO: customerNo,
                    CUSTOMER_NUMBER: customerNumber
                };
            });
        });

        // Cerrar el navegador
        await browser.close();

        // // Crear el contenido del CSV
        // const csvContent = `CUSTOMER_NO_URL;CUSTOMER_NO;CUSTOMER_NUMBER\n${data.map((row) => `${row.CUSTOMER_NO_URL};${row.CUSTOMER_NO};${row.CUSTOMER_NUMBER}`).join('\n')}`;

        // // Ruta donde se guardará el archivo CSV (cambiar por la ruta deseada)
        // const filePath = path.join(__dirname, 'customer_data.csv');

        // // Escribir el contenido en el archivo CSV
        // fs.writeFileSync(filePath, csvContent);

        // Create the CSV content
        const csvContent = `CUSTOMER_NO_URL;CUSTOMER_NO;CUSTOMER_NUMBER\n${data.map((row) => `${row.CUSTOMER_NO_URL};${row.CUSTOMER_NO};${row.CUSTOMER_NUMBER}`).join('\n')}`;

        // Connect to the FTP server
        const client = new FTP();
        await client.access({
            host: 's240.goserver.host',
            user: 'web266f5',
            password: '7g2inkjG3YEFLQWR',
        });


        const rootFolder = 'DBvet_daily_Data';
        const subFolder1 = 'zips';

        await client.cd(rootFolder); // Change to the root folder

        await client.cd(subFolder1); // Change to the sub_folder1

        // Get the list of subdirectories in sub_folder1
        const subFolders = await client.list();

        // // Check if the root folder exists on the FTP server
        // const rootFolderExists = subFolders.some(folder => folder.name === rootFolder);
        // if (!rootFolderExists) {
        //     await client.send('MKD', rootFolder);
        // }

        // await client.cd(rootFolder); // Change to the root folder

        // // Check if the sub_folder1 exists on the FTP server
        // const subFolder1Exists = subFolders.some(folder => folder.name === subFolder1);
        // if (!subFolder1Exists) {
        //     await client.send('MKD', subFolder1);
        // }

        // await client.cd(subFolder1); // Change to the sub_folder1
        
        // Extract version numbers from folder names and filter out NaN values
        const versionNumbers = subFolders.map(folder => parseInt(folder.name)).filter(version => !isNaN(version));

        // Find the highest version number
        const highestVersion = Math.max(...versionNumbers);

        // Find the folder with the highest version number
        const highestVersionFolder = subFolders.find(folder => parseInt(folder.name) === highestVersion);

        console.log('folderhighest:', highestVersionFolder.name);
        await client.cd(highestVersionFolder.name); 
        // Upload the CSV content to the FTP server
        const csvFileName = 'customers_url.csv';
        const remoteCsvFilePath = path.join(highestVersionFolder.name, csvFileName);

        // Create a Readable stream from the csvContent string
        const csvStream = new Readable();
        csvStream.push(csvContent);
        csvStream.push(null); // Signal the end of the stream

        try {
            await client.uploadFrom(csvStream, csvFileName, remoteCsvFilePath);
            console.log('CSV data uploaded to FTP server successfully.');
        } catch (uploadError) {
            console.error('Error uploading CSV file:', uploadError);
        } finally {
            // Close the FTP connection
            client.close();
        }
        console.log('CSV data uploaded to FTP server successfully.');

        console.log('Datos extraídos y CSV creado exitosamente');

        return 'Automatización realizada exitosamente!';
    } catch (error) {
        console.error('Error al ejecutar la automatización:', error);
        return 'Error al ejecutar la automatización';
    }
};


const autoScroll = async (page) => {
    const tableSelector = '.table-selectable tbody'; // Selector de la tabla (ajústalo según tu HTML)
    let previousRowCount = 0; // Contador de registros en el scroll anterior

    while (true) {
        // Obtener el número actual de registros en la tabla
        const rowCountBeforeScroll = await page.$$eval(`${tableSelector} tr`, (rows) => rows.length);

        // Simular el desplazamiento hacia abajo
        await page.evaluate(() => {
            const table = document.querySelector('table'); // Selector de la tabla (ajústalo según tu HTML)
            table.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
        });

        // Esperar a que se carguen más elementos
        await page.waitForTimeout(3000); // Ajusta el tiempo según sea necesario

        // Esperar a que se carguen los nuevos elementos en la tabla
        try {
            await page.waitForSelector(`${tableSelector} tr:nth-child(${rowCountBeforeScroll + 1})`, { timeout: 30000 });
        } catch (error) {
            console.log("No se encontraron más elementos en la tabla. Terminando el desplazamiento.");
            break;
        }

        // Si el número de registros no ha cambiado desde el último scroll, significa que no hay más registros y salimos del bucle
        if (rowCountBeforeScroll === previousRowCount) {
            console.log("No se encontraron más elementos en la tabla. Terminando el desplazamiento.");
            break;
        }

        // Actualizar el contador de registros en el scroll anterior
        previousRowCount = rowCountBeforeScroll;
    }
};


const main13 = (req, res) => {
    runAutomation()
        .then((result) => {
            console.log(result);
            res.status(200).send(result);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error al ejecutar la automatización');
        });
};
module.exports = { runAutomation, main13 };