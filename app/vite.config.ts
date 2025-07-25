import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sockets } from "./src/sockets"

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), sockets]
});
