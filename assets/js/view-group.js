'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

// 1. Catch ID from the URL (for example ?id=guid-string)
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');

async function init() {
    if (!groupId) {
        const titleElement = document.getElementById('group-name');
        if (titleElement) titleElement.innerText = "Gruppen hittades inte (ingen ID angivet)";
        return;
    }

    // 2. Fetch data from the service (asynchronous call)
    // We use readGroup which calls the API with flat=false to get related data
    const group = await service.readGroup(groupId);

    if (group) {
        // Here we pass 'group' directly because the service already 
        // stripped away the outer "item" layer.
        renderGroupDetails(group); 
    } else {
        const titleElement = document.getElementById('group-name');
        if (titleElement) titleElement.innerText = "Gruppen hittades inte (felaktigt ID)";
    }
}

// 3. Render the page using the retrieved data
function renderGroupDetails(group) {
    document.title = `${group.name || 'Grupp'} - Evergreen Music`;

    // Group details
    const nameElem = document.getElementById('group-name');
    if (nameElem) nameElem.innerText = group.name || 'Okänd grupp';
    
    // API uses 'strGenre' for the text representation of the genre
    const genreElem = document.getElementById('group-genre');
    if (genreElem) genreElem.innerText = group.strGenre || 'N/A';

    const establishedElem = document.getElementById('group-established');
    if (establishedElem) establishedElem.innerText = group.establishedYear || 'N/A';
    
    // Group image - keeping the existing logic but providing a fallback
    const imgElement = document.getElementById('group-image');
    if (imgElement) {
        // Default image for all groups for now, since the API doesn't provide individual images. 
        // This can be updated later when the backend supports it.
        imgElement.src = 'assets/images/group-images/depeche-mode.jpg'; 
        imgElement.alt = `Bild på ${group.name || 'grupp saknas'}`;
    }

    // Setup Edit Button link if it exists on the page
    // This connects the presentation view to the editing flow
    const editBtn = document.getElementById('edit-group-btn');
    if (editBtn) {
        editBtn.href = `edit-group.html?id=${group.musicGroupId}`;
    }

    // Render the members (artists) list
    // In the API response, group members are found in the 'artists' array
    const memberList = document.getElementById('member-list');
    if (memberList) {
        memberList.innerHTML = ''; // Clear static/dummy data
        if (group.artists && group.artists.length > 0) {
            group.artists.forEach(artist => {
                const li = document.createElement('li');
                // API uses firstName and lastName for artists
                li.innerText = `${artist.firstName || ''} ${artist.lastName || ''}`.trim();
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

        if (group.albums && group.albums.length > 0) {
            group.albums.forEach(album => {
                const row = document.createElement('div');
                row.className = 'list-row album-view-grid';
                row.innerHTML = `
                    <div class="col-name">${album.name || 'Okänt album'}</div>  
                    <div class="col-year">${album.releaseYear || 'N/A'}</div>
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