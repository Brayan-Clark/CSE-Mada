// Helpers de contenu — exécutés CÔTÉ SERVEUR (build) dans le frontmatter Astro.
// Sert à amorcer la démo admin avec les vrais articles du blog.
import { getCollection } from 'astro:content';
import type { Article, EventItem } from './store';

/** Convertit la collection `blog` en données de départ pour l'admin (localStorage). */
export async function getArticleSeed(): Promise<Article[]> {
  const posts = await getCollection('blog');
  return posts
    .map((post) => ({
      id: post.slug,
      title: post.data.title,
      description: post.data.description,
      author: post.data.author,
      tags: post.data.tags ?? [],
      image: post.data.image,
      content: post.body,
      draft: post.data.draft ?? false,
      pubDate: new Date(post.data.pubDate).toISOString(),
    }))
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

/** Convertit la collection `events` en données de départ pour l'admin (localStorage). */
export async function getEventSeed(): Promise<EventItem[]> {
  const events = await getCollection('events');
  return events
    .map((event) => ({
      id: event.slug,
      title: event.data.title,
      date: new Date(event.data.date).toISOString(),
      location: event.data.location,
      activity: event.data.activity,
      image: event.data.image,
      description: event.data.description,
      draft: event.data.draft ?? false,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
