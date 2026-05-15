import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig( ({ mode }) => {
	  
  // Загружаем переменные из .env файлов
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
	base: '/chat2/',
	cacheDir: 'node_modules/.vite_vue',
	plugins: [
		vue(),
		vueJsx(),
		vueDevTools(),
	],
	server: {
		host: '0.0.0.0',
		port: 5182,
		strictPort: true,
		cors: true,
		hmr: {
			host: env.VITE_WS_HOST,
			protocol: env.VITE_WSS_PROTOCOL,
			clientPort: env.VITE_WSS_PORT,
		}
	},
	resolve: {
		alias: {
		  '@': fileURLToPath(new URL('./src', import.meta.url))
		}
	}
  }
})
