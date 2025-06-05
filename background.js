// background.js - This script runs in the background as a service worker.

// Listen for messages from content scripts (e.g., content.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check if the message action is "transformArticle"
    if (request.action === "transformArticle") {
        console.log("Background script received transform request.");
        const articleTitle = request.articleTitle;
        const articleBody = request.articleBody;

        // Call the asynchronous function to handle API calls
        transformArticleWithGemini(articleTitle, articleBody)
            .then(response => {
                // Send the response back to the content script
                sendResponse(response);
            })
            .catch(error => {
                console.error("Error during Gemini API call (catch block):", error);
                sendResponse({ success: false, error: error.message || "An unexpected error occurred during API call." });
            });

        // Return true to indicate that sendResponse will be called asynchronously
        return true;
    }
});

/**
 * Calls the Gemini API to generate a Bollywood movie title and song lyrics
 * based on the provided article content.
 * @param {string} articleTitle The title of the news article.
 * @param {string} articleBody The main content of the news article.
 * @returns {Promise<object>} An object containing the generated movie title and song lyrics,
 * or an error message.
 */
async function transformArticleWithGemini(articleTitle, articleBody) {
    // API key for Gemini. Canvas will automatically provide it at runtime if left empty.
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        // --- Generate Bollywood Movie Title ---
        const moviePrompt = `Given the following news article title and content, suggest a catchy and dramatic Bollywood movie title (Hindi or English, but Bollywood-themed) that captures its essence. Provide only the title, nothing else.

        Article Title: "${articleTitle}"
        Article Content: "${articleBody.substring(0, Math.min(articleBody.length, 500))}..."`; // Use a truncated body for prompt brevity

        const moviePayload = {
            contents: [{ role: "user", parts: [{ text: moviePrompt }] }],
            generationConfig: {
                temperature: 0.7, // Adjust creativity
                maxOutputTokens: 50 // Keep output short
            }
        };

        console.log("Calling Gemini API for movie title...");
        const movieResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moviePayload)
        });
        const movieResult = await movieResponse.json();

        let generatedMovieTitle = "A Filmy Twist"; // Default title

        // Check for specific error property in the response
        if (movieResult.error) {
            console.error("Gemini API Error (Movie Title):", movieResult.error);
        }

        if (movieResult.candidates && movieResult.candidates.length > 0 &&
            movieResult.candidates[0].content && movieResult.candidates[0].content.parts &&
            movieResult.candidates[0].content.parts.length > 0) {
            generatedMovieTitle = movieResult.candidates[0].content.parts[0].text.trim();
            console.log("Generated Movie Title:", generatedMovieTitle);
        } else {
            console.warn("Could not generate movie title from Gemini. Full response:", movieResult);
        }

        // --- Generate Bollywood Song Lyrics ---
        const songPrompt = `Based on the following news article, write a short, fictional Bollywood song (2-3 stanzas with a chorus) that captures its main theme, emotions, or narrative. Use Bollywood song conventions (e.g., mix of Hindi/English, dramatic themes, relatable emotions). Focus on the core message.

        Article Title: "${articleTitle}"
        Article Content: "${articleBody.substring(0, Math.min(articleBody.length, 1000))}..."`; // Use a truncated body for prompt brevity

        const songPayload = {
            contents: [{ role: "user", parts: [{ text: songPrompt }] }],
            generationConfig: {
                temperature: 0.9, // Higher temperature for more creative lyrics
                maxOutputTokens: 500 // Allow more tokens for lyrics
            }
        };

        console.log("Calling Gemini API for song lyrics...");
        const songResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songPayload)
        });
        const songResult = await songResponse.json();

        let generatedSongLyrics = "A melodious tale awaits..."; // Default lyrics

        // Check for specific error property in the response
        if (songResult.error) {
            console.error("Gemini API Error (Song Lyrics):", songResult.error);
        }

        if (songResult.candidates && songResult.candidates.length > 0 &&
            songResult.candidates[0].content && songResult.candidates[0].content.parts &&
            songResult.candidates[0].content.parts.length > 0) {
            generatedSongLyrics = songResult.candidates[0].content.parts[0].text.trim();
            console.log("Generated Song Lyrics:", generatedSongLyrics);
        } else {
            console.warn("Could not generate song lyrics from Gemini. Full response:", songResult);
        }

        return {
            success: true,
            movieTitle: generatedMovieTitle,
            songLyrics: generatedSongLyrics
        };

    } catch (error) {
        console.error("Failed to fetch from Gemini API (network/parsing error):", error);
        return { success: false, error: error.message || "Network or API response parsing error." };
    }
}
