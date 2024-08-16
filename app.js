const express = require('express');
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const mime = require('mime-types');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid'); // UUID for unique names

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files like index.html
app.use(express.json());

app.post('/scrape', async (req, res) => {
    const { url: baseUrl } = req.body;
    console.log("Received URL: ", baseUrl);

    try {
        console.log("Launching Puppeteer...");

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        console.log("Browser launched");

        const page = await browser.newPage();
        console.log("New page created");

        await page.goto(baseUrl, { waitUntil: 'networkidle2' });
        console.log("Page loaded");

        // Wait for the page content to load
        await page.waitForSelector('body');
        console.log("Body detected");

        // Scrape content from p, h1-h6, and a tags
        const { scrapedData, links, images } = await page.evaluate(() => {
            const data = [];
            const links = [];
            const images = [];

            // Function to collect text content and element type
            const collectContent = (selector, type) => {
                document.querySelectorAll(selector).forEach(element => {
                    const content = element.innerText.trim();
                    const href = element.tagName.toLowerCase() === 'a' ? element.href : null;

                    if (content || href) { // Filter out empty tags
                        data.push({
                            tag: type,
                            content: content,
                            href: href,
                        });
                        if (href) links.push(href);
                    }
                });
            };

            // Collect content from all required tags
            collectContent('p', 'p');
            collectContent('h1', 'h1');
            collectContent('h2', 'h2');
            collectContent('h3', 'h3');
            collectContent('h4', 'h4');
            collectContent('h5', 'h5');
            collectContent('h6', 'h6');
            collectContent('a', 'a');

            // Collect image URLs
            document.querySelectorAll('img').forEach(img => {
                const src = img.src.trim();
                if (src) {
                    images.push(src);
                }
            });

            return { scrapedData: data, links: links, images: images };
        });

        // Construct full URLs from base URL and anchor hrefs
        const fullUrls = links.map(link => {
            try {
                const parsedUrl = new URL(link);
                return parsedUrl.href;
            } catch {
                // If the link is a relative path, resolve it against the base URL
                return new URL(link, baseUrl).href;
            }
        });

        // Scrape data from all constructed URLs
        const pageDataPromises = fullUrls.map(async (fullUrl) => {
            if (fullUrl.startsWith('http')) { // Check if the link is a valid URL
                try {
                    const newPage = await browser.newPage();
                    await newPage.goto(fullUrl, { waitUntil: 'networkidle2' });
                    await newPage.waitForSelector('body');
                    const linkData = await newPage.evaluate(() => {
                        const linkData = [];
                        const collectContent = (selector, type) => {
                            document.querySelectorAll(selector).forEach(element => {
                                const content = element.innerText.trim();
                                const href = element.tagName.toLowerCase() === 'a' ? element.href : null;

                                if (content || href) { // Filter out empty tags
                                    linkData.push({
                                        tag: type,
                                        content: content,
                                        href: href,
                                    });
                                }
                            });
                        };
                        collectContent('p', 'p');
                        collectContent('h1', 'h1');
                        collectContent('h2', 'h2');
                        collectContent('h3', 'h3');
                        collectContent('h4', 'h4');
                        collectContent('h5', 'h5');
                        collectContent('h6', 'h6');
                        collectContent('a', 'a');
                        return linkData;
                    });
                    await newPage.close();
                    return linkData;
                } catch (error) {
                    console.error(`Failed to scrape link ${fullUrl}:`, error);
                    return [];
                }
            }
            return [];
        });

        const linkDataArrays = await Promise.all(pageDataPromises);
        linkDataArrays.forEach(array => scrapedData.push(...array)); // Merge all data

        // Generate unique names
        const uniqueId = uuidv4();
        const imagesDir = path.join(__dirname, 'public', 'images', uniqueId);
        const zipFileName = `images_${uniqueId}.zip`;
        const zipFilePath = path.join(__dirname, 'public', zipFileName);
        
        // Ensure the images directory exists
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Download images
        const downloadImage = async (src, index) => {
            try {
                const response = await axios({ url: src, responseType: 'arraybuffer' });
                const ext = mime.extension(response.headers['content-type']) || 'jpg'; // Default to jpg
                const fileName = `image_${index + 1}.${ext}`;
                const filePath = path.join(imagesDir, fileName);
                fs.writeFileSync(filePath, response.data);
                return fileName;
            } catch (error) {
                console.error(`Failed to download image ${src}:`, error);
                return null;
            }
        };

        const imageFiles = await Promise.all(images.map((src, index) => downloadImage(src, index)));

        // Create a zip file for all images
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', function () {
            console.log(`${archive.pointer()} total bytes`);
            console.log('Zip file created at:', zipFilePath);
        });

        archive.pipe(output);

        fs.readdirSync(imagesDir).forEach(file => {
            archive.file(path.join(imagesDir, file), { name: file });
        });

        await archive.finalize();

        // Prepare the data to write into Excel file
        const organizedData = scrapedData.map((item, index) => ({
            ...item,
            pageUrl: baseUrl,
            image: item.href && imageFiles.includes(item.href) ? item.href : null,
        }));

        const workbook = xlsx.utils.book_new(); // Create a new workbook
        const worksheet = xlsx.utils.json_to_sheet(organizedData); // Convert JSON data to worksheet
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Scraped Data'); // Append the worksheet to the workbook

        // Define the file path for the Excel file
        const excelFileName = `scrapedData_${uniqueId}.xlsx`;
        const filePath = path.join(__dirname, 'public', excelFileName);
        xlsx.writeFile(workbook, filePath); // Write the workbook to a file

        console.log("Excel file created at: ", filePath);

        // Send response back with the file paths
        res.json({
            success: true,
            excelFilePath: `/${excelFileName}`,
            zipFilePath: `/${zipFileName}`
        });
    } catch (error) {
        console.error("Error during scraping:", error);
        res.status(500).json({ error: 'Failed to scrape the website.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
