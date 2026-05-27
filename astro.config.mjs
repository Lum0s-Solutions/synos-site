// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://synos-linux.pro',
	integrations: [
		starlight({
			title: 'Syn_OS',
			description:
				'The Synaptic Operating System — AI-aware Linux kernel, 209-crate Rust workspace, post-quantum crypto by default, gamified cybersecurity training. v80.0.0 "Sunlance" (1.0 GA).',
			logo: {
				src: './src/assets/phoenix-logo.png',
				alt: 'Syn_OS Phoenix',
				replacesTitle: false,
			},
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github',  label: 'GitHub',  href: 'https://github.com/Lum0s-Solutions/Syn_OS' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/synos' },
			],
			customCss: ['./src/styles/custom.css'],
			head: [
				// Open Graph
				{ tag: 'meta', attrs: { property: 'og:title',        content: 'Syn_OS — Synaptic Operating System' } },
				{ tag: 'meta', attrs: { property: 'og:description',  content: 'AI-aware Linux kernel, 209-crate Rust workspace, post-quantum crypto by default, GRIMOIRE 1.0 (108 labs), ARCANUM mesh. v80.0.0 Sunlance (1.0 GA).' } },
				{ tag: 'meta', attrs: { property: 'og:type',         content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:url',          content: 'https://synos-linux.pro/' } },
				{ tag: 'meta', attrs: { property: 'og:image',        content: 'https://synos-linux.pro/og-image.svg' } },
				{ tag: 'meta', attrs: { property: 'og:image:width',  content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },

				// Twitter / X
				{ tag: 'meta', attrs: { name: 'twitter:card',        content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:title',       content: 'Syn_OS — Synaptic Operating System' } },
				{ tag: 'meta', attrs: { name: 'twitter:description', content: 'AI-aware Linux kernel, post-quantum crypto by default, gamified cyber training. v80.0.0 Sunlance (1.0 GA).' } },
				{ tag: 'meta', attrs: { name: 'twitter:image',       content: 'https://synos-linux.pro/og-image.svg' } },

				// Theme
				{ tag: 'meta', attrs: { name: 'theme-color',  content: '#dc2626' } },
				{ tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' } },

				// Apple touch icon
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/phoenix-256.png' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '256x256', href: '/phoenix-256.png' } },
			],
			editLink: {
				baseUrl: 'https://github.com/Lum0s-Solutions/Syn_OS/edit/main/growth/LumOs-Repos/site/',
			},
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'What is Syn_OS?',           slug: 'guides/overview' },
						{ label: 'Three ISOs',                slug: 'guides/download' },
						{ label: 'Installation',              slug: 'guides/installation' },
						{ label: 'First Boot',                slug: 'guides/first-boot' },
					],
				},
				{
					label: 'GRIMOIRE',
					items: [
						{ label: 'Overview',                  slug: 'grimoire/overview' },
						{ label: 'Lab Catalog',               slug: 'grimoire/labs' },
						{ label: 'XP & Progression',          slug: 'grimoire/progression' },
						{ label: 'Competition Mode',          slug: 'grimoire/competition' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Six-Layer Stack',           slug: 'architecture/layers' },
						{ label: 'ALFRED AI Daemon',          slug: 'architecture/alfred' },
						{ label: 'Custom Kernel',             slug: 'architecture/kernel' },
						{ label: 'Icarus Post-Quantum',       slug: 'architecture/icarus' },
						{ label: 'ARCANUM Mesh',              slug: 'architecture/arcanum' },
						{ label: 'Curtain Capability Tokens', slug: 'architecture/curtain' },
						{ label: 'Reproducible Builds',       slug: 'architecture/forge' },
					],
				},
				{
					label: 'GoodLife',
					items: [
						{ label: 'AI Research ISO',           slug: 'goodlife/overview' },
						{ label: 'Included Tools',            slug: 'goodlife/tools' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
