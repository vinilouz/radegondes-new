import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isProduction = mode === 'production';

	const serverConfig = {
		port: parseInt(env.VITE_PORT || '3001'),
		host: true,
		cors: true,
		strictPort: false,
		hmr: {
			host: 'localhost',
		}
	};

	return {
		plugins: [
			tailwindcss(),
			tanstackRouter(),
			react(),
			VitePWA({
				registerType: "prompt",
				manifest: {
					name: env.VITE_APP_NAME,
					short_name: env.VITE_APP_SHORT_NAME,
					description: env.VITE_APP_DESCRIPTION,
					theme_color: env.VITE_THEME_COLOR || "#E66912",
				},
				pwaAssets: {
					disabled: false,
					config: true
				},
				devOptions: {
					enabled: true,
					type: "module"
				},
				workbox: {
					runtimeCaching: [
						{
							urlPattern: ({ url }) => url.pathname.startsWith('/assets/index-') && url.pathname.endsWith('.js'),
							handler: "NetworkFirst",
							options: {
								cacheName: "js-cache",
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 600
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: ({ url }) => url.pathname.startsWith('/assets/index-') && url.pathname.endsWith('.css'),
							handler: "NetworkFirst",
							options: {
								cacheName: "css-cache",
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 600
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
							handler: "CacheFirst",
							options: {
								cacheName: "image-cache",
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 86400 // 24 horas
								}
							}
						},
						{
							urlPattern: /\.(?:woff2?|eot|ttf|otf)$/,
							handler: "CacheFirst",
							options: {
								cacheName: "font-cache",
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 86400 // 24 horas
								}
							}
						}
					],
					clientsClaim: true,
					skipWaiting: true,
				}
			})
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: serverConfig,
		preview: {
			...serverConfig,
			allowedHosts: [
				env.VITE_ALLOWED_DOMAIN,
				`*.${env.VITE_ALLOWED_DOMAIN}`,
			]
		},
		define: {
			'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
			'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
		}
	};
});