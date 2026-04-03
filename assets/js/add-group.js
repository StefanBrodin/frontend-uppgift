'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-group-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collecting data from the form fields to create a new group DTO (Data Transfer Object) that matches the expected format of the API
            // as defined in the backend schema. This includes the group name, established year, genre, and empty arrays for albums and artists 
            // since those are required by the API but not handled in this form.
            const groupDto = {
                name: document.getElementById('name').value.trim(),
                establishedYear: parseInt(document.getElementById('establishedYear').value),
                genre: parseInt(document.getElementById('genre').value),
                seeded: false, 
                albumsId: [],  // Mandatory according to the schema, but an empty array for now since album creation isn't handled in this form, but in step2.
                artistsId: []  // Mandatory according to the schema, but an empty array for now since artist creation isn't handled in this form, but in step2.
            };

            const result = await service.createGroup(groupDto);

            if (result && result.musicGroupId) {
                alert(`Gruppen "${result.name}" har skapats!`);
                window.location.href = `edit-group.html?id=${result.musicGroupId}`; // Redirect to the edit page after successful creation for step 2 (adding members and albums)
            } else {
                alert('Det gick inte att skapa gruppen.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.');
            }
        });
    }
});