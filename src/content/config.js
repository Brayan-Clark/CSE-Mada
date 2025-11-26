import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Équipe CSEM'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
  events: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      location: z.string().optional(),
      image: z.string().optional(),
      description: z.string().optional(),
      isFlyerOnly: z.boolean().default(false),
      activity: z.string().optional(),
      draft: z.boolean().default(false),
    }),
  }),
};
