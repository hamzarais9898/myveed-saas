import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://maveed.io';
    const lastModified = new Date();

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/fr`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/en`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/ar`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/shorts`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/generate`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/stars`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/create-influencer`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/text-to-speech`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/analytics`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/subscriptions`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];
}
