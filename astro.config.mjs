// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://synos-linux.pro',
	integrations: [
		starlight({
			title: 'Syn_OS',
			description:
				'The Synaptic Operating System — AI-aware Linux kernel, 245-crate Rust workspace, post-quantum crypto by default, gamified cybersecurity training. v111.0.0 "Last Light" (1.0 GA).',
			logo: {
				src: './src/assets/phoenix-logo.png',
				alt: 'Syn_OS Phoenix',
				replacesTitle: false,
			},
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/synos-linux/synos' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/synos' },
				{ icon: 'x.com', label: 'X / Twitter', href: 'https://x.com/synos_linux' },
			],
			editLink: {
				baseUrl: 'https://github.com/synos-linux/synos/edit/main/growth/development/docs/internal/eyesonly/development/project-status/reference/research/research/knowledge-sync/architecture/infra/a_LumOs-Repos/synos-ops/LumOs-Repos/SynOSdev/com-public/synos-site/src/content/docs/',
			},
			customCss: ['./src/styles/custom.css'],
			components: {
				Footer: './src/components/Footer.astro',
			},
			head: [
				// Open Graph
				{ tag: 'meta', attrs: { property: 'og:title',        content: 'Syn_OS — Synaptic Operating System' } },
				{ tag: 'meta', attrs: { property: 'og:description',  content: 'AI-aware Linux kernel, 245-crate Rust workspace, post-quantum crypto by default, GRIMOIRE 1.0 (117 labs), ARCANUM mesh. v111.0.0 Last Light (1.0 GA).' } },
				{ tag: 'meta', attrs: { property: 'og:type',         content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:url',          content: 'https://synos-linux.pro/' } },
				{ tag: 'meta', attrs: { property: 'og:image',        content: 'https://synos-linux.pro/og-image.svg' } },
				{ tag: 'meta', attrs: { property: 'og:image:width',  content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },

				// Twitter / X
				{ tag: 'meta', attrs: { name: 'twitter:card',        content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:title',       content: 'Syn_OS — Synaptic Operating System' } },
				{ tag: 'meta', attrs: { name: 'twitter:description', content: 'AI-aware Linux kernel, post-quantum crypto by default, gamified cyber training. v111.0.0 Last Light (1.0 GA).' } },
				{ tag: 'meta', attrs: { name: 'twitter:image',       content: 'https://synos-linux.pro/og-image.svg' } },

				// Theme
				{ tag: 'meta', attrs: { name: 'theme-color',  content: '#08060a' } },
				{ tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' } },

				// Apple touch icon
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/phoenix-256.png' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '256x256', href: '/phoenix-256.png' } },

				// I1 — preload self-hosted fonts (eliminates Google Fonts DNS round-trip)
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/jetbrains-mono-latin.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/inter-latin.woff2',         as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/saira-latin.woff2',         as: 'font', type: 'font/woff2', crossorigin: 'anonymous' } },
			],
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
			sidebar: [
				{
					label: '◈ LumOs Solutions',
					link: 'https://solutions.synos-linux.pro/',
					attrs: { target: '_blank', rel: 'noopener' },
				},
				{
					label: '▶ Getting Started',
					items: [
						{ label: 'What is Syn_OS?',           slug: 'guides/overview' },
						{ label: 'Two ISOs',                  slug: 'guides/download' },
						{ label: 'Installation',              slug: 'guides/installation' },
						{ label: 'First Boot',                slug: 'guides/first-boot' },
					],
				},
				{
					label: '⚔ GRIMOIRE',
					items: [
						{ label: 'Overview',                  slug: 'grimoire/overview' },
						{ label: 'Lab Catalog',               slug: 'grimoire/labs' },
						{ label: 'XP & Progression',          slug: 'grimoire/progression' },
						{ label: 'Competition Mode',          slug: 'grimoire/competition' },
						{ label: 'Tool Manifest',             slug: 'grimoire/tool-manifest' },
					],
				},
				{
					label: '■ User Guide',
					items: [
						{ label: 'GRIMOIRE Guide',            slug: 'user-guide/grimoire-guide' },
						{ label: 'Troubleshooting',           slug: 'user-guide/troubleshooting' },
						{ label: 'Support FAQ',                slug: 'user-guide/faq' },
						{
							label: 'Tutorials',
							items: [
								{ label: 'Using AI Features',        slug: 'user-guide/tutorials/using-ai-features' },
								{ label: 'First Security Scan',      slug: 'user-guide/tutorials/first-security-scan' },
								{ label: 'Customizing Your Desktop', slug: 'user-guide/tutorials/customizing-desktop' },
								{ label: 'Benchmarking',             slug: 'user-guide/tutorials/benchmarking' },
							],
						},
					],
				},
				{
					label: '◇ Church of Malware',
					items: [
						{ label: 'Membership & /claim',       slug: 'churchofmalware/membership' },
					],
				},
			{
				label: '◈ Architecture',
				autogenerate: { directory: 'architecture' },
			},
				{
					label: '◆ Reference',
					autogenerate: { directory: 'reference' },
				},
			{
				label: '⚙ Operator Guide',
				autogenerate: { directory: 'operator-guide' },
			},
				{
					label: '◇ Contributing',
					items: [
						{ label: 'Contributor Onboarding',    slug: 'contributing/onboarding' },
						{ label: 'Doc Writing Standards',    slug: 'contributing/standards' },
					],
				},
			],
		}),
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			lastmod: new Date(),
		}),
	],
});
