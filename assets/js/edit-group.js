'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id');


async function loadGroupData() {
    const group = await service.readGroup(groupId);
    if (!group) return;

    // Fill basic info
    const nameField = document.getElementById('group-name'); 
    const genreField = document.getElementById('genre');
    const yearField = document.getElementById('formed-year'); 
    const titleElement = document.getElementById('edit-title');

    if (nameField) nameField.value = group.name || '';
    if (genreField) genreField.value = group.genre ?? '';
    if (yearField) yearField.value = group.establishedYear || '';
    if (titleElement) titleElement.innerText = `Redigera ${group.name}`;

    // Render the current "group member" and "album" lists
    renderMembers(group.artists || []);
    renderAlbums(group.albums || []);
}


function setupEventListeners() {

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
        <div class="list-row member-grid">
            <div class="col-name">
                <span class="first-name">${a.firstName}</span> 
                <span class="last-name">${a.lastName}</span>
            </div>
            <div class="col-actions">
                <button class="btn btn-edit" onclick="alert('Ändra kommer snart!')">Ändra</button>
                <button class="btn btn-delete" onclick="alert('Radera kommer snart!')">Radera</button>
            </div>
        </div>
    `).join('');
}

// Render the albums list
function renderAlbums(albums) {
    const container = document.getElementById('album-list-target');
    if (!container) return;

    container.innerHTML = albums.map(a => `
        <div class="list-row album-grid">
            <div class="col-name">${a.name}</div>
            <div class="col-year">${a.releaseYear}</div>
            <div class="col-actions">
                <button class="btn btn-edit" onclick="alert('Ändra kommer snart!')">Ändra</button>
                <button class="btn btn-delete" onclick="alert('Radera kommer snart!')">Radera</button>
            </div>
        </div>
    `).join('');
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