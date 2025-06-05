# Bollywood News Transformer - Extension Documentation
## Project Overview
### Purpose
The "Bollywood News Transformer" is a Chrome extension designed to inject a bit of fun into news consumption. It transforms news articles into fictional Bollywood movie titles and song lyrics, providing a lighthearted and creative twist on current events.
### Key Features
*   **Article Transformation:** Automatically extracts the title and body of news articles from supported websites.
*   **Gemini API Integration:** Uses the Gemini API to generate a Bollywood movie title and song lyrics based on the article content.
*   **Page Update:** Replaces the original article title with the generated movie title and the article body with the generated song lyrics.
*   **User Feedback:** Provides visual cues and message boxes to inform the user about the transformation process.
*   **Supported Websites:** Works on a predefined set of news websites (Times of India, The Hindu, Hindustan Times, Indian Express).
### Supported Platforms or Requirements
*   Google Chrome or Chromium-based browsers.
*   Internet connection (for API calls).
*   A Gemini API key (though the extension is designed to work without explicitly setting one, relying on Canvas to provide it at runtime).
## Getting Started
### Installation
1.  Download the extension files (e.g., as a ZIP archive).
2.  Unzip the archive to a local directory.
3.  Open Google Chrome and navigate to `chrome://extensions`.
4.  Enable "Developer mode" in the top right corner.
5.  Click "Load unpacked" and select the directory where you unzipped the extension files.
6.  The extension should now be installed and active.
### Dependencies
*   No external libraries are required. The extension uses standard JavaScript and the Chrome Extension API.
*   The extension relies on the Gemini API for generating the movie title and song lyrics.
## Code Structure
### Folder and File Organization
```
.
├── .gitignore
├── background.js
├── content.js
├── manifest.json
└── popup.html
```
### Brief Descriptions of Key Components
- **.gitignore**: Specifies intentionally untracked files that Git should ignore.  
- **background.js**: The background script that runs as a service worker. It listens for messages from the content script and handles the Gemini API calls.
- **content.js**: The content script that runs on the news article pages. It extracts the article title and body, sends them to the background script, and updates the page with the generated movie title and song lyrics.
- **manifest.json**: The manifest file that describes the extension to Chrome. It specifies the extension's name, version, permissions, content scripts, and background script.
- **images/**: This folder contains the icon files (icon16.png, icon48.png, icon128.png) that represent your extension in the Chrome browser (e.g., in the extensions menu, toolbar, and Chrome Web Store).
- **popup.html**: The HTML file for the extension's popup window. It provides a simple interface for the user.

## API Documentation
The extension interacts with the Gemini API to generate the movie title and song lyrics.
### Endpoints
#### POST 
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}`
### Input and Output Formats
## Input (Request Body)
The request body is a JSON object with the following structure:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Prompt text based on article title and content"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 50
  }
}
```
*   `contents`: An array containing a single object with the role "user" and the prompt text.
*   `parts`: An array containing a single object with the text of the prompt.
*   `generationConfig`: An object containing the generation configuration parameters.
    *   `temperature`: Controls the randomness of the output (0.0 - 1.0).
    *   `maxOutputTokens`: The maximum number of tokens in the output.
**Output (Response Body)**
The response body is a JSON object with the following structure:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Generated text"
          }
        ]
      }
    }
  ]
}
```
*   `candidates`: An array of possible responses.
*   `content`: An object containing the generated content.
*   `parts`: An array containing a single object with the generated text.
**Error Handling**
The API may return an error object in the response body if something goes wrong.
```json
{
  "error": {
    "code": 400,
    "message": "Error message",
    "status": "INVALID_ARGUMENT"
  }
}
```
### Example API Requests and Responses
**Example Request (Movie Title)**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Given the following news article title and content, suggest a catchy and dramatic Bollywood movie title (Hindi or English, but Bollywood-themed) that captures its essence. Provide only the title, nothing else.
        Article Title: \"Breaking News: Local Dog Wins National Dog Show\"
        Article Content: \"The local dog, a golden retriever named Buddy, won the national dog show...\""
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 50
  }
}
```
**Example Response (Movie Title)**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Buddy: The Golden Heart"
          }
        ]
      }
    }
  ]
}
```
**Example Request (Song Lyrics)**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Based on the following news article, write a short, fictional Bollywood song (2-3 stanzas with a chorus) that captures its main theme, emotions, or narrative. Use Bollywood song conventions (e.g., mix of Hindi/English, dramatic themes, relatable emotions). Focus on the core message.
        Article Title: \"Breaking News: Local Dog Wins National Dog Show\"
        Article Content: \"The local dog, a golden retriever named Buddy, won the national dog show...\""
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "maxOutputTokens": 500
  }
}
```
**Example Response (Song Lyrics)**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "(Verse 1)
Buddy, Buddy, star of the show,
Golden fur, a heart of gold, you know.
From our town, you rose so high,
Reaching for the stars in the sky.
(Chorus)
Buddy, oh Buddy, champion bright,
Shining like a Bollywood light!
Every heart beats just for you,
Dreams come true, it's all brand new!
(Verse 2)
Tail a-wagging, eyes so keen,
Victory's song, a joyful scene.
With every step, a graceful dance,
Taking us to a Bollywood trance."
          }
        ]
      }
    }
  ]
}
```
## FAQ
### Common Issues and Resolutions
*   **Extension not working on a specific website:**
    *   Check if the website is included in the `matches` array in the `manifest.json` file.
    *   Verify that the website's HTML structure is compatible with the selectors used in `content.js` to extract the article title and body.
*   **Gemini API calls failing:**
    *   Ensure that you have a valid Gemini API key. While the extension is designed to work without explicitly setting one, relying on Canvas to provide it at runtime, ensure that Canvas is configured correctly.
    *   Check your API usage limits and quotas.
    *   Verify that the API is accessible from your network.
*   **Transformation not happening:**
    *   Check the console for errors in `content.js` and `background.js`.
    *   Make sure the `isTransformed` flag is working correctly to prevent multiple transformations.
*   **Styling issues:**
    *   The extension uses inline styles in `content.js` to update the page. Ensure that these styles are compatible with the website's existing styles.
    *   The extension also uses Tailwind CSS classes. Ensure that these classes are properly applied.
