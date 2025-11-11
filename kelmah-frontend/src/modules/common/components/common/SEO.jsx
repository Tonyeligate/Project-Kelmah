import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE_SUFFIX = 'Kelmah';
const DEFAULT_DESCRIPTION =
  'Kelmah connects skilled vocational workers with hirers looking for trusted talent across Ghana.';

const SEO = ({
  title = DEFAULT_TITLE_SUFFIX,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  robots = 'index,follow',
  noIndex = false,
  openGraph = {},
  twitter = {},
}) => {
  const normalizedTitle = title.includes(DEFAULT_TITLE_SUFFIX)
    ? title
    : `${title} | ${DEFAULT_TITLE_SUFFIX}`;
  const robotsValue = noIndex ? 'noindex,nofollow' : robots;
  const resolvedUrl =
    openGraph.url ||
    canonical ||
    (typeof window !== 'undefined' ? window.location.href : undefined);

  return (
    <Helmet>
      <title>{normalizedTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {robotsValue && <meta name="robots" content={robotsValue} />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:title" content={openGraph.title || normalizedTitle} />
      <meta
        property="og:description"
        content={openGraph.description || description}
      />
      <meta property="og:type" content={openGraph.type || 'website'} />
      {resolvedUrl && <meta property="og:url" content={resolvedUrl} />}
      {openGraph.image && <meta property="og:image" content={openGraph.image} />}

      <meta name="twitter:card" content={twitter.card || 'summary_large_image'} />
      <meta name="twitter:title" content={twitter.title || normalizedTitle} />
      <meta
        name="twitter:description"
        content={twitter.description || description}
      />
      {twitter.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter.handle && <meta name="twitter:site" content={twitter.handle} />}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  robots: PropTypes.string,
  noIndex: PropTypes.bool,
  openGraph: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    url: PropTypes.string,
    image: PropTypes.string,
  }),
  twitter: PropTypes.shape({
    card: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    handle: PropTypes.string,
  }),
};

export default SEO;
