const express = require('express');
const Article = require('../models/articleModel');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// Escape XML special characters
const escapeXml = (str = '') =>
    str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

router.get('/feed.xml', catchAsync(async (req, res) => {
    const siteUrl = process.env.SITE_URL || 'https://polanco.dev';
    const articles = await Article.find({ published: true })
        .sort('-createdAt')
        .limit(20)
        .select('title description createdAt category tags imageCover _id');

    const items = articles.map(a => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${siteUrl}/articles/${a._id}</link>
      <guid isPermaLink="true">${siteUrl}/articles/${a._id}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>
      <category>${escapeXml(a.category)}</category>
      ${a.imageCover ? `<enclosure url="${escapeXml(a.imageCover)}" type="image/jpeg"/>` : ''}
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Polanco.dev — Technical Blog</title>
    <link>${siteUrl}</link>
    <description>Full Stack Engineering articles, quick tips, and cheat sheets by Diego Polanco.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rss);
}));

module.exports = router;
