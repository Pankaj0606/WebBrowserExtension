// content.js - This script runs directly on the newspaper article pages.

// Flag to ensure the transformation runs only once per page load
let isTransformed = false;

/**
 * Attempts to extract the main article title from the current page.
 * It tries a few common selectors used on news websites.
 * @returns {string|null} The extracted article title, or null if not found.
 */
function getArticleTitle() {
    const titleSelectors = [
        'h1.artTitle', // Common for Times of India articles
        'h1[itemprop="headline"]',
        'h1.story-title',
        'h1.headline',
        'h1', // Generic h1, less specific but sometimes necessary
        'meta[property="og:title"]', // Open Graph title from meta tags
        'title' // Fallback to page title
    ];

    for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            // Prioritize specific h1 classes, then general h1, then meta/title
            if (selector.startsWith('h1')) {
                console.log(`Found title for extraction using selector "${selector}".`);
                return element.textContent.trim();
            }
        }
    }
    // Fallback to meta/document title for extraction if no H1 was suitable
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta && ogTitleMeta.content) {
        console.log(`Found title for extraction using meta tag: ${ogTitleMeta.content}`);
        return ogTitleMeta.content.trim();
    }
    if (document.title) {
        console.log(`Found title for extraction using document.title: ${document.title}`);
        return document.title.trim();
    }

    console.warn("Could not find article title using common selectors for extraction.");
    return null;
}

/**
 * Attempts to extract the main article body content from the current page.
 * It tries to find a main article container and then collects all paragraph texts within it.
 * @returns {string|null} The extracted article body as a single string, or null if not found.
 */
function getArticleBody() {
    // Broader set of selectors for the main article content container
    const articleBodySelectors = [
        'div._3g2R-', // Very common wrapper on ToI article pages
        'div[itemprop="articleBody"]', // Standard semantic HTML for article content
        'article', // Semantic HTML5 tag for main content
        'div.story-content', // Generic container
        'div.article-body', // Generic container
        'div.section-article-text', // Generic container
        'div.content-wrapper', // Generic container
        'div.article-detail', // Generic container
        'div.entry-content', // Common in WordPress themes
        'div.td-post-content', // Specific to certain themes
        'div.primary-content', // More generic
        'div.fl-post-content', // Common for some page builders
        'div.inner-content', // Another generic container
        'div.story-element-text', // Seen on some news sites
        'div.detail-content', // Generic for news details
        'div._3MkB4', // Another common ToI-specific container
        'div[data-story-id]', // Data attribute based selector
        'div.article-content', // Generic content class
        'div.full_story', // Legacy news site class
        'div#content-area', // Common ID for main content area
        'div.story_content', // Generic story content class
        'div.Normal' // Sometimes individual paragraphs are targeted if no main wrapper
    ];

    let articleText = [];
    let mainArticleElement = null;

    // Try to find the most specific article container first
    for (const selector of articleBodySelectors) {
        const element = document.querySelector(selector);
        if (element) {
            mainArticleElement = element;
            console.log(`Found main article container for extraction using selector: ${selector}`);
            break; // Found a container, proceed to extract paragraphs
        }
    }

    if (!mainArticleElement) {
        console.warn("Could not find a specific article body container for extraction. Falling back to all paragraphs on page.");
        // If no specific container is found, try to get all paragraphs that look like main content
        const paragraphs = document.querySelectorAll('p, div.Normal'); // Also consider div.Normal for individual paragraphs
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            // Basic filtering to avoid empty, very short, or non-main-content paragraphs (e.g., captions, ads)
            // Heuristic: paragraph should contain a reasonable amount of words and not be purely numerical or too short.
            if (text.length > 100 && text.split(' ').length > 10) {
                articleText.push(text);
            }
        });
    } else {
        // If a main article container is found, get paragraphs only within it
        const paragraphs = mainArticleElement.querySelectorAll('p, div.Normal'); // Also consider div.Normal for individual paragraphs
        if (paragraphs.length > 0) {
            paragraphs.forEach(p => {
                const text = p.textContent.trim();
                if (text.length > 50) { // Ensure paragraph is not empty or too short
                    articleText.push(text);
                }
            });
        } else {
            // If no explicit p or div.Normal, use the direct text content of the main element
            const directText = mainArticleElement.textContent.trim();
            if (directText.length > 100) {
                articleText.push(directText);
            }
        }
    }

    if (articleText.length > 0) {
        const fullText = articleText.join('\n\n');
        console.log("Extracted article body content.");
        return fullText;
    }

    console.warn("Could not extract any meaningful article body content.");
    return null;
}

/**
 * Creates a modal or message box to display messages to the user,
 * avoiding the use of alert().
 * @param {string} message The message to display.
 * @param {string} type 'success' or 'error' for styling.
 */
function showMessageBox(message, type) {
    const existingBox = document.getElementById('extensionMessageBox');
    if (existingBox) {
        existingBox.remove();
    }

    const messageBox = document.createElement('div');
    messageBox.id = 'extensionMessageBox';
    messageBox.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-[9999] transition-opacity duration-500`;

    if (type === 'success') {
        messageBox.classList.add('bg-green-500');
    } else {
        messageBox.classList.add('bg-red-500');
    }

    messageBox.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button id="closeMessageBox" class="ml-4 text-white hover:text-gray-200 font-bold text-xl leading-none">&times;</button>
        </div>
    `;

    document.body.appendChild(messageBox);

    document.getElementById('closeMessageBox').addEventListener('click', () => {
        messageBox.remove();
    });

    // Automatically remove after 5 seconds
    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => messageBox.remove(), 500);
    }, 5000);
}


/**
 * Replaces the article title on the page with the generated movie title.
 * @param {string} newTitle The new movie title.
 */
function updateArticleTitle(newTitle) {
    // Only target H1s for visual update, meta tags are updated in getArticleTitle if no H1 is found
    const h1Elements = document.querySelectorAll('h1.artTitle, h1[itemprop="headline"], h1.story-title, h1.headline, h1');

    if (h1Elements.length > 0) {
        // Prioritize specific h1 classes, then general h1
        const mainTitleElement = document.querySelector('h1.artTitle') ||
                                 document.querySelector('h1[itemprop="headline"]') ||
                                 document.querySelector('h1.story-title') ||
                                 document.querySelector('h1.headline') ||
                                 h1Elements[0]; // Fallback to the first found h1

        if (mainTitleElement) {
            mainTitleElement.textContent = `🎬 ${newTitle} 🎶`; // Add emojis for flair
            mainTitleElement.style.color = '#8B0000'; // Dark red for dramatic effect
            mainTitleElement.style.fontSize = '2.5rem'; // Larger font size
            mainTitleElement.style.textAlign = 'center';
            mainTitleElement.style.fontWeight = 'bold';
            mainTitleElement.style.marginBottom = '20px';
            mainTitleElement.style.marginTop = '20px';
            console.log("Article title updated successfully.");
            return; // Stop after updating the most prominent H1
        }
    }
    // If no suitable H1 found, update the document title as a fallback (less visual impact)
    console.warn("No prominent H1 found to update visually. Attempting to update document.title.");
    document.title = newTitle;
}

/**
 * Replaces the article body with the generated song lyrics.
 * It will try to find the most suitable container for the article body
 * and replace its content.
 * @param {string} songLyrics The generated Bollywood song lyrics.
 */
function updateArticleBody(songLyrics) {
    // These selectors are ordered by how likely they are to be the main article content wrapper,
    // based on inspection of the provided ToI HTML.
    const articleBodyContainerSelectors = [
        'div[data-articlebody="1"]', // Strongest candidate from provided HTML
        'div.vSlIC',                 // Often the direct container of text within data-articlebody
        'div._3g2R-',                 // Common wrapper on ToI
        'article',             // Semantic HTML5 tag for main content
        'div.story-content',
        'div.article-body',
        'div.Normal',          // Sometimes individual paragraphs or small sections have this class
        'div.section-article-text',
        'div.content-wrapper',
        'div.article-detail',
        'div.entry-content',
        'div.td-post-content',
        'div.primary-content',
        'div.fl-post-content',
        'div.inner-content',
        'div.story-element-text',
        'div.detail-content',
        'div._3MkB4',
        'div[data-story-id]',
        'div.article-content',
        'div.full_story',
        'div#content-area',
        'div.story_content'
    ];

    let mainArticleElement = null;
    for (const selector of articleBodyContainerSelectors) {
        const element = document.querySelector(selector);
        // Check if element exists, is visible, and contains content (paragraphs or text)
        if (element && element.offsetParent !== null) {
            // Heuristic: Check if it contains any 'p' elements or 'div.Normal' elements,
            // OR if the element itself has significant text content (more than 200 characters),
            // OR if it's a known direct text container like '.vSlIC' and has text.
            if (element.querySelector('p') || element.querySelector('div.Normal') || element.textContent.trim().length > 200 || (selector === 'div.vSlIC' && element.textContent.trim().length > 50)) {
                mainArticleElement = element;
                console.log(`Found main article content container for update: ${selector}`);
                break; // Found the best match, stop searching
            }
        }
    }

    if (mainArticleElement) {
        console.log(`Attempting to clear and replace content of element: ${mainArticleElement.tagName} with ID: ${mainArticleElement.id || 'N/A'}, Class: ${mainArticleElement.className || 'N/A'}`);

        // Aggressively clear existing content within the chosen main article element.
        // This removes all child nodes and also clears any direct text content.
        mainArticleElement.innerHTML = ''; // This is usually sufficient and faster for clearing

        // Create a new div to hold the lyrics
        const lyricsContainer = document.createElement('div');
        lyricsContainer.className = 'bollywood-lyrics-container text-center py-8 px-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow-lg my-8 mx-auto max-w-2xl'; // Added max-width and auto margins for centering
        lyricsContainer.style.fontFamily = "'Dancing Script', cursive"; // A more artistic font
        lyricsContainer.style.fontSize = '1.2rem';
        lyricsContainer.style.lineHeight = '1.8';
        lyricsContainer.style.color = '#4A0033'; // Dark purple/maroon text
        lyricsContainer.style.width = '100%'; // Ensure it takes full width of its parent

        const lines = songLyrics.split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            p.className = 'my-2'; // Tailwind margin for paragraphs
            lyricsContainer.appendChild(p);
        });

        // Add a signature
        const signature = document.createElement('p');
        signature.textContent = "— Your Bollywood News Transformer";
        signature.className = 'mt-6 italic text-gray-600 text-sm';
        lyricsContainer.appendChild(signature);

        mainArticleElement.appendChild(lyricsContainer);
        console.log("Article body updated with song lyrics.");

        // Add a link to Google Fonts for 'Dancing Script' if it's not already loaded
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

    } else {
        console.warn("No suitable article body container found for update. Appending new content to body as fallback. This might be off-screen or not replace original content.");
        // Fallback: If no specific container, just append a new section to the body
        const newSection = document.createElement('div');
        newSection.className = 'bollywood-content-appended text-center py-8 px-4 mt-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-lg my-8 mx-auto max-w-2xl'; // Added max-width and auto margins for centering
        newSection.innerHTML = `
            <h2 class="text-2xl font-bold text-purple-700 mb-4">� A Bollywood Extravaganza! 🎶</h2>
            <div class="text-lg text-gray-800 whitespace-pre-wrap">${songLyrics}</div>
            <p class="mt-6 italic text-gray-600 text-sm">— Your Bollywood News Transformer</p>
        `;
        document.body.appendChild(newSection);
        console.log("New Bollywood content appended to body.");
    }
}

/**
 * Initiates the article transformation process.
 * Extracts title and body, then sends them to the background script.
 * Listens for the response and updates the page.
 */
async function transformArticle() {
    // Prevent multiple runs if the script is injected multiple times
    if (isTransformed) {
        console.log("Transformation already performed on this page. Skipping re-run.");
        return;
    }

    console.log("Attempting to transform article...");
    const title = getArticleTitle();
    const body = getArticleBody();

    if (title && body) {
        showMessageBox("Transforming article... Please wait for the magic!", 'success');
        console.log("Article title and body extracted. Sending to background script.");

        const response = await new Promise(resolve => {
            chrome.runtime.sendMessage({
                action: "transformArticle",
                articleTitle: title,
                articleBody: body
            }, response => {
                resolve(response);
            });
        });

        if (response && response.success) {
            console.log("Transformation successful. Updating page.");
            updateArticleTitle(response.movieTitle);
            updateArticleBody(response.songLyrics);
            showMessageBox("Article transformed into a Bollywood masterpiece!", 'success');
            isTransformed = true; // Set flag to true after successful transformation
        } else {
            console.error("Transformation failed:", response.error);
            showMessageBox(`Transformation failed: ${response.error || 'Unknown error'}`, 'error');
        }
    } else {
        console.error("Could not extract enough information to transform the article.");
        showMessageBox("Could not find enough article content to transform. Try a different article or newspaper.", 'error');
    }
}

// Automatically try to transform the article when the page loads
transformArticle();