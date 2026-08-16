import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
	const docs = await getCollection('docs');
	const items = docs
		.sort((a, b) => {
			const aDate = a.data.lastUpdated ? new Date(a.data.lastUpdated).valueOf() : 0;
			const bDate = b.data.lastUpdated ? new Date(b.data.lastUpdated).valueOf() : 0;
			return bDate - aDate;
		})
		.slice(0, 20)
		.map((doc) => ({
			title: doc.data.title,
			description: doc.data.description,
			link: `/${doc.id}/`,
			pubDate: doc.data.lastUpdated ? new Date(doc.data.lastUpdated) : new Date(),
		}));

	return rss({
		title: 'Syn_OS Documentation',
		description: 'Documentation updates for the Synaptic Operating System',
		site: context.site,
		items,
	});
}
