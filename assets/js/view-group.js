'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

// 1. Catch ID from the URL (for example ?id=guid-string)
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');

async function init() {
    if (!groupId) {
        const titleElement = document.getElementById('group-name');
        if (titleElement) titleElement.innerText = "Gruppen hittades inte (inget ID angivet)";
        return;
    }

    // 2. Fetch data from the service (asynchronous call)
    // We use readGroup which calls the API with flat=false to get related data
try {
        const group = await service.readGroup(groupId);

        if (group) {
            // Here we pass 'group' directly because the service already 
            // stripped away the outer "item" layer.
            renderGroupDetails(group); 
        } else {
            const titleElement = document.getElementById('group-name');
            if (titleElement) titleElement.innerText = "Gruppen hittades inte (felaktigt ID)";
        }
    } catch (error) {
        // Catching errors thrown by the service and updating the UI to reflect the failure, instead of just logging it. 
        console.error('Initialization Error:', error);
        const titleElement = document.getElementById('group-name');
        if (titleElement) {
            titleElement.innerText = `Ett fel uppstod: ${error.message}`;
        }
    }
}

// 3. Render the page using the retrieved data
function renderGroupDetails(group) {
    document.title = `${group?.name ?? 'Musikgrupp'} | Evergreen Music`;

    // Dynamically update meta tags for better SEO and social media sharing based on the group details. This ensures 
    // that when users share the page on social media platforms, they get relevant information in the preview.
    
    // Update the meta description to include the group name 
    const description = `Lär dig mer om ${group?.name ?? 'gruppen'}. Se deras album, medlemmar och diskografi på Evergreen Music.`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Update the canonical URL to reflect the current *unique* page with the group ID to avoid potential duplicate content 
    // issues which can hurt SEO. Note to self: if the user should add some extra, non-relevant query parameters to the URL,
    // for example - &utm_source=facebook - then that part will also become part of the canonical URL. Not good. Best would be 
    // to render the canonical URL (as well as other dynamic meta tags) server-side instead of in JavaScript inside the browser
    // and output the result as static HTML, which would also be beneficial to web spiders and social media platforms that may
    // not wait for (or not even run at all) the javascript. But since this is a frontend project without a backend, I'll just
    // leave it at this for now. But the issue is noted! ;-)  
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', window.location.href);

    // Update the Open Graph meta tags for better social media sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${group?.name ?? 'Musikgrupp'} | Evergreen Music`);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // Note: While the API doesn't provide individual images for groups, a "dynamic" image can still be set. But for now 
    // it points to the same "Depeche Mode" default image for all groups. ;-)
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', `${window.location.origin}/assets/images/group-images/depeche-mode.jpg`);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);
   


    // Group details
    const nameElem = document.getElementById('group-name');
    if (nameElem) nameElem.innerText = group?.name ?? 'Okänd grupp';
    
    // API uses 'strGenre' for the text representation of the genre
    const genreElem = document.getElementById('group-genre');
    if (genreElem) genreElem.innerText = group?.strGenre ?? 'Ej angivet';

    const establishedElem = document.getElementById('group-established');
    if (establishedElem) establishedElem.innerText = group?.establishedYear ?? 'Ej angivet';
    
    // Group image - keeping the existing logic but providing a fallback
    const imgElement = document.getElementById('group-image');
    if (imgElement) {
        // Default image for all groups for now, since the API doesn't provide individual images. 
        imgElement.src = 'assets/images/group-images/depeche-mode.jpg'; 
        imgElement.alt = `Bild på ${group?.name ?? 'musikgrupp'}`;
    }

    // Setup Edit Button logic
    const editBtn = document.getElementById('edit-group-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `edit-group.html?id=${group?.musicGroupId ?? ''}`;
        });
    }

    // Render the members (artists) list
    const memberList = document.getElementById('member-list');
    if (memberList) {
        memberList.innerHTML = ''; // Clear static/dummy data
        const artists = group?.artists ?? [];
        
        if (artists.length > 0) {
            artists.forEach(artist => {
                const li = document.createElement('li');
                // Optional chaining ensures we don't crash if firstName/lastName is missing
                const fullName = `${artist?.firstName ?? ''} ${artist?.lastName ?? ''}`.trim();
                li.innerText = fullName !== '' ? fullName : 'Namnlös artist';
                memberList.appendChild(li);
            });
        } else {
            memberList.innerHTML = '<li>Inga medlemmar registrerade</li>';
        }
    }

    // Render the albums list
    const albumContainer = document.getElementById('album-list');
    if (albumContainer) {
        // Keep the header but clear the rest of the album list container
        const header = albumContainer.firstElementChild;
        albumContainer.innerHTML = '';
        if (header) albumContainer.appendChild(header);

        const albums = group?.albums ?? [];

        if (albums.length > 0) {
            albums.forEach(album => {
                const row = document.createElement('div');
                row.className = 'list-row album-view-grid';
                row.innerHTML = `
                    <div class="col-name">${album?.name ?? 'Okänt album'}</div>  
                    <div class="col-year">${album?.releaseYear ?? 'Ej angivet'}</div>
                `;
                albumContainer.appendChild(row);
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'list-row';
            emptyMsg.style.padding = '2rem';
            emptyMsg.innerText = 'Inga album hittades för denna grupp.';
            albumContainer.appendChild(emptyMsg);
        }
    }
}

// Start the initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);