
# Web Sraper

This web scraper tool allows you to scrape and extract content from any website by providing its URL. It collects specific HTML elements, gathers URLs, and exports the data to an Excel sheet. Additionally, it automatically downloads all images from the given URL and packages them for easy access.



## Features

Extracts content from anchor (<a>), paragraph (<p>), and heading (<h1> to <h6>) tags.
Exports scraped data in Excel sheet format.
Auto-downloads all images from the specified URL.
Organized and easy-to-navigate output.


## Installation

Clone the Repository

```bash
git clone https://github.com/chinmay0703/web-scraper-tool.git
```
Install Dependencies

```bash
npm install
```
Start the Application

```bash
npm start
```


## Usage

Enter the URL of any website you'd like to scrape.
The tool will fetch and display content from:
Anchor tags (<a>)
Paragraph tags (<p>)
Heading tags (<h1> to <h6>)
An Excel sheet will be generated with the extracted content and URLs.
All images from the page will automatically download to a folder for easy access.

## Output
Output
Excel Sheet: Contains URLs and text content found in the <a>, <p>, and heading tags.
Image Folder: All images from the URL will be downloaded into a folder named after the webpage.


    
## Deployment

To deploy this project run

```bash
  npm run deploy
```


## Dependencies

`Puppeteer: For automating the scraping process.`

`Express: For setting up the server.`

`Node.js: Backend environment`

