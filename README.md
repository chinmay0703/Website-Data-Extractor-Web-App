#Web Scraper Tool
This web scraper tool allows you to scrape and extract content from any website by providing its URL. It collects specific HTML elements, gathers URLs, and exports the data to an Excel sheet. Additionally, it automatically downloads all images from the given URL and packages them for easy access.

Features
Extracts content from anchor (<a>), paragraph (<p>), and heading (<h1> to <h6>) tags.
Exports scraped data in Excel sheet format.
Auto-downloads all images from the specified URL.
Organized and easy-to-navigate output.
Installation
To set up the application, follow these simple steps:

1. Clone the Repository
bash
Copy code
git clone https://github.com/yourusername/web-scraper-tool.git
2. Install Dependencies
Navigate to the project directory and run:

bash
Copy code
npm install
3. Start the Application
To start the web scraper, use:

bash
Copy code
npm start
The application will be up and running at http://localhost:3000.

Usage
Enter the URL of any website you'd like to scrape.
The tool will fetch and display content from:
Anchor tags (<a>)
Paragraph tags (<p>)
Heading tags (<h1> to <h6>)
An Excel sheet will be generated with the extracted content and URLs.
All images from the page will automatically download to a folder for easy access.
Output
Excel Sheet: Contains URLs and text content found in the <a>, <p>, and heading tags.
Image Folder: All images from the URL will be downloaded into a folder named after the webpage.
Example
Scrape a blog post, extract all URLs, paragraphs, and headings, and automatically download all images in one go.
Use the tool to analyze the content structure of any website.
Dependencies
Puppeteer: For automating the scraping process.
Express: For setting up the server.
Node.js: Backend environment.
