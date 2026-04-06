'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');

// Define currentGroup outside of loadGroupData() to make it a global variable to hold the full group data
// including members and albums, which will be needed to "update" the group using PUT requests to the API, 
// since the API expects the full object *including* related entities when updating.
let currentGroup = null; 

async function loadGroupData() {
    const group = await service.readGroup(groupId);
    if (!group) return;

    currentGroup = group; // Store the full group data to the global currentGroup variable for later use in updates

    // Fill basic info
    const nameField = document.getElementById('group-name'); 
    const genreField = document.getElementById('genre');
    const yearField = document.getElementById('formed-year'); 
    const titleElement = document.getElementById('edit-title');

    if (nameField) nameField.value = group.name ?? '';
    if (genreField) genreField.value = group.genre ?? '';
    if (yearField) yearField.value = group.establishedYear || '';
    if (titleElement) titleElement.innerText = `Redigera ${group.name}`;

    // Render the current "group member" and "album" lists
    renderMembers(group.artists || []);
    renderAlbums(group.albums || []);
}


function setupEventListeners() {

    // Update group details 
    document.getElementById('edit-group-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Create a DTO (Data Transfer Object) for the updated group information based on the form fields. 
        // This complete DTO will be sent to the API by the updateGroup() method in the service.
        const groupDto = {
            musicGroupId: groupId,
            name: document.getElementById('group-name').value.trim(),
            establishedYear: parseInt(document.getElementById('formed-year').value),
            genre: parseInt(document.getElementById('genre').value),
            seeded: false,
            
            // Important to include any existing albumsId and artistsId arrays from currentGroup when updating,
            // since the API expects the full object including related entities for updates. If not included,
            // any existing group members and albums from the group will be removed when updating.
            albumsId: currentGroup.albums ? currentGroup.albums.map(a => a.albumId) : [],
            artistsId: currentGroup.artists ? currentGroup.artists.map(a => a.artistId) : []
        };

        const result = await service.updateGroup(groupId, groupDto);
        if (result) {
            alert("Gruppens information har sparats!");
            
            // Update the global currentGroup variable with the new data so that it stays in sync for future updates 
            // to members and albums without needing to re-fetch the group data from the API.
            currentGroup = result; 
            
            const title = document.getElementById('edit-title');
            if (title) title.innerText = `Redigera ${groupDto.name}`;
        } else {
            alert("Kunde inte uppdatera gruppen.");
        }
    });


    // Add new group member
    document.getElementById('add-member-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const artistDto = {
            firstName: document.getElementById('member-firstname').value.trim(),
            lastName: document.getElementById('member-lastname').value.trim(),
            seeded: false,
            musicGroupsId: [groupId] // Connect the new artist to the current group by including the groupId in the musicGroupsId array
        };

        const result = await service.createArtist(artistDto);
        if (result) {
            document.getElementById('add-member-form').reset();
            await loadGroupData(); // Refresh the group data to show the new member in the list
        } else {
            alert("Kunde inte skapa gruppmedlemmen.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.");
        }
    }); 


    // Add new album
    document.getElementById('add-album-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const albumDto = {
            name: document.getElementById('album-name').value.trim(),
            releaseYear: parseInt(document.getElementById('album-year').value),
            musicGroupId: groupId,
            seeded: false
        };

        const result = await service.createAlbum(albumDto);
        if (result) {
            document.getElementById('add-album-form').reset();
            await loadGroupData(); // Refresh the group data to show the new album in the list
        } else {
            alert("Kunde inte skapa albumet.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.");
        }
    });


    // Go to groupview page after finishing edits
    document.getElementById('btn-finish')?.addEventListener('click', () => {
        window.location.href = `view-group.html?id=${groupId}`;
    });

}

// Render the group members list
function renderMembers(artists) {
    const container = document.getElementById('member-list-target');
    if (!container) return;
    
    container.innerHTML = artists.map(a => `
        <div class="list-row member-grid" id="member-row-${a.artistId}">
            <div class="col-name">
                <span class="first-name">${a.firstName}</span> 
                <span class="last-name">${a.lastName}</span>
            </div>
            <div class="col-actions">
                <button class="btn btn-edit" data-id="${a.artistId}">Ändra</button>
                <button class="btn btn-delete" onclick="alert('Radera kommer snart!')">Radera</button>
            </div>
        </div>
    `).join('');

    // Attach events to the edit buttons
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => showEditMemberForm(btn.dataset.id));
    });
}

// Function to show inline edit form for a group member
async function showEditMemberForm(artistId) {
    const row = document.getElementById(`member-row-${artistId}`);
    const firstName = row.querySelector('.first-name').innerText;
    const lastName = row.querySelector('.last-name').innerText;

    row.innerHTML = `
        <div class="col-name">
            <div class="inline-edit-group">
                <input type="text" id="edit-fname-${artistId}" value="${firstName}" class="form-input" placeholder="Förnamn">
                <input type="text" id="edit-lname-${artistId}" value="${lastName}" class="form-input" placeholder="Efternamn">
            </div>
        </div>
        <div class="col-actions">
            <button class="btn btn-save-small" id="save-member-${artistId}">Spara</button>
            <button class="btn btn-cancel-small" id="cancel-member-${artistId}">Avbryt</button>
        </div>
    `;

    // Save button for editing group members
    document.getElementById(`save-member-${artistId}`).addEventListener('click', async () => {
        const dto = {
            artistId: artistId,
            firstName: document.getElementById(`edit-fname-${artistId}`).value.trim(),
            lastName: document.getElementById(`edit-lname-${artistId}`).value.trim(),
            seeded: false,
            // Importatnt to include the current groupId in the musicGroupsId array to keep the connection between the artist and the group when updating.
            musicGroupsId: [groupId] 
        };
        
        const result = await service.updateArtist(artistId, dto);
        if (result) {
            await loadGroupData();
        } else {
            alert("Kunde inte uppdatera medlem. Kontrollera att fälten inte är tomma.");
        }
    });

    // Cancel button for editing group members
    document.getElementById(`cancel-member-${artistId}`).addEventListener('click', () => {
        loadGroupData();
    });
}

// Render the albums list
function renderAlbums(albums) {
    const container = document.getElementById('album-list-target');
    if (!container) return;

    container.innerHTML = albums.map(a => `
        <div class="list-row album-grid" id="album-row-${a.albumId}">
            <div class="col-name">${a.name}</div>
            <div class="col-year">${a.releaseYear}</div>
            <div class="col-actions">
                <button class="btn btn-edit" data-id="${a.albumId}" data-type="album">Ändra</button>
                <button class="btn btn-delete" onclick="alert('Radera kommer snart!')">Radera</button>
            </div>
        </div>
    `).join('');

    // Attach events to the newly rendered edit buttons
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => showEditAlbumForm(btn.dataset.id));
    });
}

// Function to show inline edit form for an album
async function showEditAlbumForm(albumId) {
    const row = document.getElementById(`album-row-${albumId}`);
    const currentName = row.querySelector('.col-name').innerText;
    const currentYear = row.querySelector('.col-year').innerText;

    row.innerHTML = `
        <div class="col-name">
            <input type="text" id="edit-aname-${albumId}" value="${currentName}" class="form-input">
        </div>
        <div class="col-year">
            <input type="number" id="edit-ayear-${albumId}" value="${currentYear}" class="form-input">
        </div>
        <div class="col-actions">
            <button class="btn btn-save-small" id="save-album-${albumId}">Spara</button>
            <button class="btn btn-cancel-small" id="cancel-album-${albumId}">Avbryt</button>
        </div>
    `;

    // Save button for editing albums
    document.getElementById(`save-album-${albumId}`).addEventListener('click', async () => {
        const dto = {
            albumId: albumId,
            name: document.getElementById(`edit-aname-${albumId}`).value.trim(),
            releaseYear: parseInt(document.getElementById(`edit-ayear-${albumId}`).value),
            musicGroupId: groupId,
            // Important to include the current groupId in the musicGroupId field to keep the connection between the album and the group when updating.
            seeded: false
        };
        const result = await service.updateAlbum(albumId, dto);
        if (result) await loadGroupData();
        else alert("Kunde inte uppdatera album.");
    });

    // Cancel button for editing albums
    document.getElementById(`cancel-album-${albumId}`).addEventListener('click', () => {
        loadGroupData();
    });
}


// Wait for the DOM to be fully loaded before trying to access elements or attach event listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (!groupId) {
        alert("Inget ID angivet! Återgår till startsidan.");
        window.location.href = 'index.html';
        return;
    }

    // Retrieve the group data from the API and render it on the page
    await loadGroupData();

    // Connect the buttons and forms to their respective event handlers for editing the data
    setupEventListeners();
});