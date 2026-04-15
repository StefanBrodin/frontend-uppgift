'use strict';

// Dynamically update meta tags for better SEO and social media sharing based on the page content. This ensures 
// that when users share the page on social media platforms, they get relevant information in the preview.
function updateMetaData() {

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', window.location.href);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', `${window.location.origin}/assets/images/og-main.png`);

}

// Start the metadata updating when the page is fully loaded
document.addEventListener('DOMContentLoaded', updateMetaData);