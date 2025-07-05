# AI Text Helper - Vite & TypeScript

This project contains the source code for a cross-browser extension built with Vite and TypeScript.

## One-Time Setup

1.  **Install Node.js**: If you don't have it, download and install Node.js from [nodejs.org](https://nodejs.org/). This project requires Node.js 22.0.0 or higher.
2.  **Install pnpm**: If you don't have pnpm installed, install it globally:
    ```bash
    npm install -g pnpm
    ```
3.  **Install Dependencies**: Open your command line or terminal in the project's root directory and run:
    ```bash
    pnpm install
    ```

## Development and Local Testing

This is the recommended workflow for actively developing the extension.

### Step 1: Start the Development Server

Run the `dev` command for the browser you are testing. This will start Vite in **watch mode**, which automatically recompiles the extension whenever you save a file.

```bash
# For Firefox development
pnpm run dev:firefox

# For Chrome development
pnpm run dev:chrome
```
Keep this terminal window open while you are coding.

### Step 2: Load the Unpacked Extension (Once)

You only need to do this the first time.

**For Firefox:**
1.  Open Firefox and navigate to `about:debugging`.
2.  Click on **"This Firefox"**.
3.  Click **"Load Temporary Add-on..."**.
4.  Navigate to your project folder and select the `dist/manifest.json` file.

**For Google Chrome:**
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** in the top-right corner.
3.  Click **"Load unpacked"**.
4.  Select the entire `dist` folder.

### Step 3: The "Code and Reload" Workflow

This is your main development loop.

1.  **Make a code change** in any of the files inside the `src` directory.
2.  **Save the file**.
3.  **Wait for Vite** to finish rebuilding (you'll see activity in your terminal).
4.  **Reload the extension** in your browser:
    * **In Firefox (`about:debugging`):** Click the **"Reload"** button next to the extension's entry.
    * **In Chrome (`chrome://extensions`):** Click the **reload icon** (a circular arrow) on the extension's card.
5.  Test your changes.

### Step 4: Debugging

Each part of an extension has its own developer console.

* **To debug the Options Page:** Open the options page, right-click on it, and select "Inspect".
* **To debug the Background Script:**
    * **In Firefox (`about:debugging`):** Click the **"Inspect"** button next to the extension's entry.
    * **In Chrome (`chrome://extensions`):** Click the **"Service Worker"** link on the extension's card.
    * All `console.log()` statements from `background.ts` will appear here.

**Best Practice:** It's highly recommended to use a separate, clean browser profile for testing to avoid conflicts with other extensions or your personal data.

## Building for Production

When you are ready to create the final files for publishing, run the build command:

```bash
# Build for both browsers
pnpm run build

# Or build for a specific browser
pnpm run build:firefox
pnpm run build:chrome
```

This will create an optimized and minified version of the extension in the `dist/` directory, ready to be zipped and uploaded to the extension stores.
