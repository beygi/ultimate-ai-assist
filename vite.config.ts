import { defineConfig, UserConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
// We import the base manifest as a JSON object
import baseManifest from './src/manifest.json';

// Define a new type that extends the base ManifestV3 type with Firefox-specific keys.
// This tells TypeScript that 'browser_specific_settings' is a valid property.
type FirefoxManifest = ManifestV3Export & {
  browser_specific_settings?: {
    gecko?: {
      id: string;
      strict_min_version?: string;
    };
  };
};

// We turn the config into a function that receives the build 'mode'
export default defineConfig(({ mode }): UserConfig => {
  // Use our new extended type for the manifest object
  const manifest: FirefoxManifest = {
    ...baseManifest,
  };

  // Apply browser-specific manifest configurations
  if (mode === 'firefox') {
    // For Firefox, we must use 'scripts' instead of 'service_worker'.
    manifest.background = {
      scripts: ['background.ts'],
      type: 'module',
    };
    // It's also best practice to include a specific ID for Firefox add-ons.
    manifest.browser_specific_settings = {
      gecko: {
        id: 'ai-text-helper@example.com',
        strict_min_version: '109.0',
      },
    };
    // Remove use_dynamic_url from web_accessible_resources for Firefox
    if (manifest.web_accessible_resources) {
      manifest.web_accessible_resources = manifest.web_accessible_resources.map((resource: any) => {
        const { use_dynamic_url, ...rest } = resource;
        return rest;
      });
    }
  } else {
    // For Chrome and other browsers
    manifest.background = {
      service_worker: 'background.ts',
      type: 'module',
    };
  }

  return {
    root: 'src',
    plugins: [crx({ manifest }), tailwindcss()],
    build: {
      outDir: `../dist/${mode}`,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          options: 'src/options.html', // Only HTML entry
          background: 'src/background.ts',
          content: 'src/content.ts',
        },
        output: {
          manualChunks: undefined, // Prevent code splitting
          inlineDynamicImports: false, // Do not inline imports
          entryFileNames: '[name].js', // Keep file names simple
          chunkFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        },
      },
      minify: false, // Do not minify output
    },
    // Add content.ts as a content script for all pages
    crx: {
      contentScripts: [
        {
          matches: ['<all_urls>'],
          js: ['content.js'],
          runAt: 'document_end',
        },
      ],
    },
  };
});
