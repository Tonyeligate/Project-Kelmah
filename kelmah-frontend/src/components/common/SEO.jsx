import React from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

/**
 * SEO component that manages document head metadata
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Comma separated keywords
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.canonical - Canonical URL
 * @param {string} props.type - Open Graph type (website, article, etc.)
 */
const SEO = ({
  title = 'Kelmah - Connect with Professional Services',
  description = 'Find skilled professionals for your projects or find work opportunities matching your skills on Kelmah.',
  keywords = 'jobs, freelance, services, hiring, professionals, skills',
  ogImage = '/images/og-image.jpg',
  canonical = '',
  type = 'website'
}) => {
  // Construct the full title with site name
  const fullTitle = title.includes('Kelmah') ? title : `${title} | Kelmah`;
  
  // Get base URL from environment or use default
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://kelmah.com';
  
  // Construct canonical URL
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;
  
  // Construct full OG image URL if not absolute
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical link */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  ogImage: PropTypes.string,
  canonical: PropTypes.string,
  type: PropTypes.string
};

export default SEO; 