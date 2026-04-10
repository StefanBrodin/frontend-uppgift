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
    try {
        const group = await service.readGroup(groupId);
        if (!group) return;

        currentGroup = group;  // Store the full group data to the global currentGroup variable for later use in updates

        // Fill the main form fields with the current group data for editing. 
        const nameField = document.getElementById('group-name'); 
        const genreField = document.getElementById('genre');
        const yearField = document.getElementById('formed-year'); 
        const titleElement = document.getElementById('edit-title');

        if (nameField) nameField.value = group?.name ?? '';
        if (genreField) genreField.value = group?.genre ?? '';
        if (yearField) yearField.value = group?.establishedYear ?? '';

        // If the user cames to this page from the "Add Group" flow (identified by the "mode=new" query parameter), then    
        // the title should reflect that they are now in step 2 of the process (editing the newly created group to add 
        // members and albums). This is set at the bottom of this page. Otherwise, if they are in the normal edit flow, 
        // the standard title with the group name is set here.
        if (titleElement && urlParams.get('mode') !== 'new') {
            titleElement.innerText = `Redigera ${group?.name ?? 'musikgrupp'}`;
        }

        // Render the current "group member" and "album" lists
        renderMembers(group?.artists ?? []);
        renderAlbums(group?.albums ?? []);
    } catch (error) {
        console.error('Load Error:', error);
        alert(`Kunde inte ladda gruppdata: ${error.message}`);
    }
}


function setupEventListeners() {

// Update group details 
    document.getElementById('edit-group-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validation constants for the "established year" to ensure it's within a reasonable range.
        const ceilingYear = new Date().getFullYear(); 
        const floorYear   = 1900; 

        // Reading and parsing input values from the DOM
        const name = document.getElementById('group-name').value.trim();
        const yearInput = document.getElementById('formed-year').value.trim();
        const genreInput = document.getElementById('genre').value;

        // *** Validation Logic ***

        // Validation of the group name to ensure it's not empty.
        if (!name) {
            alert("Du måste ange ett namn på musikgruppen.");
            return;
        }

        // Parsing and validating the established year.
        const establishedYear = parseInt(yearInput);
        if (isNaN(establishedYear) || establishedYear < floorYear || establishedYear > ceilingYear) {
            alert(`Vänligen ange ett giltigt startår mellan ${floorYear} och ${ceilingYear}.`);
            return;
        }

        // Parsing the genre. If the select-dropdown is empty or invalid, we ensure it's a number.
        // We also ensure it's a positive number (or 0) as required by the system.
        const genre = parseInt(genreInput);
        if (isNaN(genre) || genre < 0) {
            alert("Vänligen välj en giltig genre från listan.");
            return;
        }
        
        // Create a DTO (Data Transfer Object) using the updated group information based on the form fields. 
        // This complete DTO will be sent to the API by the updateGroup() method in the service.
        const groupDto = {
            musicGroupId: groupId,
            name: name,
            establishedYear: establishedYear,
            genre: genre,
            seeded: false,
            
            // Important to include any existing albums and artists arrays from currentGroup when updating,
            // since the API expects the full object including related entities for updates. If not included,
            // any existing group members and albums from the group will be *removed* from DB when updating.
            albumsId: currentGroup?.albums?.map(a => a.albumId) ?? [],
            artistsId: currentGroup?.artists?.map(a => a.artistId) ?? []
        };

        try {
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
        } catch (error) {
            console.error('Update Error:', error);
            alert(`Ett fel uppstod vid uppdatering: ${error.message}`);
        }
    });

    // Add new group member
    document.getElementById('add-member-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('member-firstname').value.trim();
        const lastName = document.getElementById('member-lastname').value.trim();

        // Validate that at least one of the name fields is filled out before allowing the user to save changes to prevent creating members without any name data.
        if (!firstName && !lastName) {
            alert("Du måste ange minst ett namn (förnamn eller efternamn) för medlemmen.");
            return;
        }

        const artistDto = {
            firstName: firstName,
            lastName: lastName,
            seeded: false,
            musicGroupsId: [groupId] 
        };

        try {
            const result = await service.createArtist(artistDto);
            if (result) {
                document.getElementById('add-member-form').reset();
                await loadGroupData(); 
            } else {
                alert("Kunde inte skapa gruppmedlemmen.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.");
            }
        } catch (error) {
            console.error('Create Artist Error:', error);
            alert(`Kunde inte lägga till medlem: ${error.message}`);
        }
    });


    // Add new album
    document.getElementById('add-album-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('album-name').value.trim();
        const yearInput = document.getElementById('album-year').value.trim();
        
        // Valid year range used for validation in the next step.
        const ceilingYear = new Date().getFullYear(); // Future albums can not exist
        const floorYear   = 1900;                     // Albums older than 1900 are invalid

        // Validation for the "release year" input to ensure it's a valid number and within a reasonable range before allowing the user to save changes.
        // This prevents sending invalid data to the API and ensures data integrity for album release years.
        const releaseYear = parseInt(yearInput);
        if (isNaN(releaseYear) || releaseYear < floorYear || releaseYear > ceilingYear) {
            alert(`Vänligen ange ett giltigt utgivningsår mellan ${floorYear} och ${ceilingYear}.`);
            return;
        }

        // Validation: Name
        if (!name) {
            alert("Vänligen ange ett namn på albumet.");
            return;
        }

        // Create a new album DTO (Data Transfer Object) that matches the expected format of the API as defined in the backend schema.
        const albumDto = {
            name: name,
            releaseYear: releaseYear,
            musicGroupId: groupId,
            seeded: false
        };

        try {
            const result = await service.createAlbum(albumDto);
            if (result) {
                document.getElementById('add-album-form').reset();
                await loadGroupData(); 
            } else {
                alert("Kunde inte skapa albumet.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.");
            }
        } catch (error) {
            console.error('Create Album Error:', error);
            alert(`Kunde inte skapa album: ${error.message}`);
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
    
    // Check if there are no artists and render an informative empty state row
    if (artists.length === 0) {
        container.innerHTML = `
            <div class="list-row empty-row">
                <div class="col-name empty-text">
                    Inga gruppmedlemmar ännu, lägg till nya i formuläret ovan.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = artists.map(a => `
        <div class="list-row member-grid" id="member-row-${a.artistId}">
            <div class="col-name">
                <span class="first-name">${a.firstName}</span> 
                <span class="last-name">${a.lastName}</span>
            </div>
            <div class="col-actions">
                <button class="btn btn-edit" data-id="${a.artistId}">Ändra</button>
                <button class="btn btn-delete" data-id="${a.artistId}">Radera</button>
            </div>
        </div>
    `).join('');

    // Attach events to the edit buttons
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => showEditMemberForm(btn.dataset.id));
    });

    // Attach events to the delete buttons for group members
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const artistId = btn.dataset.id;
            const artistName = btn.closest('.list-row')?.querySelector('.col-name')?.innerText ?? "artisten";
            
            if (confirm(`Vill du verkligen radera ${artistName}?`)) {
                try {
                    const deletedArtist = await service.deleteArtist(artistId);
                    if (deletedArtist) {
                        alert(`Artisten "${deletedArtist.firstName} ${deletedArtist.lastName}" har raderats.`);
                        await loadGroupData(); // Refresh the group data to show the updated members list after deletion
                    } else {
                        alert("Kunde inte radera artisten.");
                    }
                } catch (error) {
                    console.error('Delete Artist Error:', error);
                    alert(`Ett fel uppstod: ${error.message}`);
                }
            }
        });
    });

}

// Function to show inline edit form for a group member
async function showEditMemberForm(artistId) {
    const row = document.getElementById(`member-row-${artistId}`);
    const firstName = row.querySelector('.first-name')?.innerText ?? '';
    const lastName = row.querySelector('.last-name')?.innerText ?? '';

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
        const firstName = document.getElementById(`edit-fname-${artistId}`).value.trim();
        const lastName = document.getElementById(`edit-lname-${artistId}`).value.trim();

        // Validation: Ensure we have at least some name data before allowing the user to save changes
        if (!firstName && !lastName) {
            alert("Medlemmen måste ha minst ett förnamn eller efternamn.");
            return;
        }

        const dto = {
            artistId: artistId,
            firstName: firstName,
            lastName: lastName,
            seeded: false,
            musicGroupsId: [groupId] 
        };
        
        try {
            const result = await service.updateArtist(artistId, dto);
            if (result) {
                await loadGroupData();
            } else {
                alert("Kunde inte uppdatera medlem.");
            }
        } catch (error) {
            console.error('Update Artist Error:', error);
            alert(`Kunde inte spara ändringar: ${error.message}`);
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

    // Check if there are no albums and render an informative empty state row
    if (albums.length === 0) {
        container.innerHTML = `
            <div class="list-row empty-row">
                <div class="col-name empty-text">
                    Inga album ännu, lägg till nya album i formuläret ovan.
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = albums.map(a => `
        <div class="list-row album-grid" id="album-row-${a.albumId}">
            <div class="col-name">${a.name}</div>
            <div class="col-year">${a.releaseYear}</div>
            <div class="col-actions">
                <button class="btn btn-edit" data-id="${a.albumId}">Ändra</button>
                <button class="btn btn-delete" data-id="${a.albumId}">Radera</button>
            </div>
        </div>
    `).join('');

    // Attach events to the edit buttons
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => showEditAlbumForm(btn.dataset.id));
    });

    // Attach events to the newly rendered delete buttons for albums
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const albumId = btn.dataset.id;
            const albumName = btn.closest('.list-row')?.querySelector('.col-name')?.innerText ?? "albumet";

            if (confirm(`Vill du verkligen radera albumet "${albumName}"?`)) {
                try {
                    const deletedAlbum = await service.deleteAlbum(albumId);
                    if (deletedAlbum) {
                        alert(`Albumet "${deletedAlbum.name}" har raderats.`);
                        await loadGroupData(); // Refresh the group data to show the updated album list after deletion
                    } else {
                        alert("Kunde inte radera albumet.");
                    }
                } catch (error) {
                    console.error('Delete Album Error:', error);
                    alert(`Ett fel uppstod: ${error.message}`);
                }
            }
        });
    });
}

// Function to show inline edit form for an album
async function showEditAlbumForm(albumId) {
    const row = document.getElementById(`album-row-${albumId}`);
    const currentName = row.querySelector('.col-name')?.innerText ?? '';
    const currentYear = row.querySelector('.col-year')?.innerText ?? '';

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

        // Validation for the "release year" input to ensure it's a valid number and within a reasonable range before allowing the user to save changes.
        // This prevents sending invalid data to the API and ensures data integrity for album release years.
        const ceilingYear = new Date().getFullYear(); // Future albums can not exist
        const floorYear   = 1900;                     // Albums older than 1900 are invalid 
        
        // Reading and parsing the year input from the DOM to validate it before allowing the user to save changes 
        const yearInputElement = document.getElementById(`edit-ayear-${albumId}`);
        if (!yearInputElement) return; 

        const yearInput = yearInputElement.value.trim();
        const releaseYear = parseInt(yearInput);

        // Check if the user input is a valid number (and a reasonable year)
        if (isNaN(releaseYear) || releaseYear < floorYear || releaseYear > ceilingYear) {
            alert(`Vänligen ange ett giltigt och rimligt årtal mellan ${floorYear} och ${ceilingYear}.`);
            return; // STOP the save operation if the year is invalid to prevent sending bad data to the API
        }

        // Validation of the album name to ensure it's not empty before allowing the user to save changes.
        const albumName = document.getElementById(`edit-aname-${albumId}`).value.trim();
        if (!albumName) {
            alert("Albumet måste ha ett namn.");
            return;
        }

        const dto = {
            albumId: albumId,
            name: albumName,
            releaseYear: releaseYear,
            musicGroupId: groupId,
            // Important to include the current groupId in the musicGroupId field to keep the connection between the album and the group when updating.
            seeded: false
        };

        try {
            const result = await service.updateAlbum(albumId, dto);
            if (result) await loadGroupData(); // Refresh the group data to show the updated album info after saving changes
            else alert("Kunde inte uppdatera album.");
        } catch (error) {
            console.error('Update Album Error:', error);
            alert(`Kunde inte spara albumet: ${error.message}`);
        }
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

    // Check if we are in "new group" mode to customize the UI
    const mode = urlParams.get('mode');
    if (mode === 'new') {
        const titleElement = document.getElementById('edit-title');
        const mainForm = document.getElementById('edit-group-form-container');
        
        if (titleElement) {
            titleElement.innerText = "Steg 2: Lägg till gruppmedlemmar och album";
        }
        
        if (mainForm) {
            mainForm.classList.add('hidden-mode-new');
        }
    }

    // Retrieve the group data from the API and render it on the page
    await loadGroupData();

    // Connect the buttons and forms to their respective event handlers for editing the data
    setupEventListeners();
});