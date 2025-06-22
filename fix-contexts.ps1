# PowerShell script to ensure SEO and AuthContext components are properly placed

Write-Host "Setting up contexts and common components..." -ForegroundColor Green

# Create SEO component if it doesn't exist
$seoComponentDestination = "kelmah-frontend/src/modules/common/components/common/SEO.jsx"
if (-not (Test-Path $seoComponentDestination)) {
    Write-Host "Creating SEO component..." -ForegroundColor Cyan
    
    $seoContent = @"
import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title, description, keywords, ogImage }) => {
  const siteTitle = 'Kelmah - Connect with Professionals';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Social Media Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEO;
"@
    
    # Create directory if needed
    $seoComponentDir = Split-Path $seoComponentDestination -Parent
    if (-not (Test-Path $seoComponentDir)) {
        New-Item -Path $seoComponentDir -ItemType Directory -Force | Out-Null
    }
    
    # Write SEO component
    Set-Content -Path $seoComponentDestination -Value $seoContent
    Write-Host "SEO component created successfully" -ForegroundColor Green
}

# Check for AuthContext placement
$authContextSources = @(
    "kelmah-frontend/src/contexts/AuthContext.jsx",
    "kelmah-frontend/src/modules/auth/contexts/AuthContext.jsx"
)

$authContextDestination = "kelmah-frontend/src/modules/auth/contexts/AuthContext.jsx"

$authContextFound = $false
foreach ($source in $authContextSources) {
    if (Test-Path $source) {
        Write-Host "Found AuthContext at $source" -ForegroundColor Green
        
        # If it's not already in the correct location, move it
        if ($source -ne $authContextDestination) {
            Copy-Item -Path $source -Destination $authContextDestination -Force
            Write-Host "Copied AuthContext to proper location" -ForegroundColor Green
        }
        
        $authContextFound = $true
        break
    }
}

if (-not $authContextFound) {
    Write-Host "AuthContext not found in expected locations. Consider creating it." -ForegroundColor Yellow
}

Write-Host "Context setup completed!" -ForegroundColor Green 