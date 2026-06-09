import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = 'Pro AI Crypto Analytics',
  description = 'Supercharge your crypto trading with AI-powered technical analysis, real-time market data, and automated portfolio tracking.',
  keywords = 'crypto, ai crypto analysis, portfolio tracker, cryptocurrency, bitcoin, ethereum',
  image = 'https://www.cryptoneko.online/logo.png',
  url = 'https://www.cryptoneko.online/',
}: SEOProps) {
  const siteTitle = 'CryptoNeko';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
}
