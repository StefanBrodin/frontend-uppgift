'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-group-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collecting and validating user data from the form fields to be used for creating a new music group entity using the MusicGroupService.  

            // Validation constants for the "established year" to ensure it's within a reasonable range.
            const ceilingYear = new Date().getFullYear(); // Future albums can not exist
            const floorYear   = 1900;                     // Albums older than 1900 are invalid 

            // Reading and parsing input values from the DOM
            const name = document.getElementById('name')?.value?.trim() ?? '';
            const yearInput = document.getElementById('establishedYear')?.value?.trim() ?? '';
            const genreInput = document.getElementById('genre')?.value ?? '';

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

            // Parsing the genre. The select-dropdown can not be empty or invalid, and it must be a number.
            // We also ensure it's a positive number (or 0) as required by the system.
            const genre = parseInt(genreInput);
            if (isNaN(genre) || genre < 0) {
                alert("Vänligen välj en giltig genre från listan.");
                return;
            }

            // Creating a new group DTO (Data Transfer Object) that matches the expected format of the API as defined in the backend schema. 
            // This includes the group name, established year, genre, and empty arrays for albums and artists since those are required by 
            // the API but are not handled in this form. These will be added in the next step (edit-group.html) after the group is created
            // and there is a valid musicGroupId to work with.
            const groupDto = {
                name: name,
                establishedYear: establishedYear,
                genre: genre,
                seeded: false, 
                albumsId: [],  // Mandatory according to the schema, but an empty array for now since album creation isn't handled in this form, but in step2.
                artistsId: []  // Mandatory according to the schema, but an empty array for now since artist creation isn't handled in this form, but in step2.
            };

            const result = await service.createGroup(groupDto);

            if (result?.musicGroupId) {
                // Using ?? to ensure that "undefined" isn't shown in the alert if the name is missing for some reason.
                alert(`Gruppen "${result?.name ?? 'musikgruppen'}" har skapats!`);
                window.location.href = `edit-group.html?id=${result.musicGroupId}`; // Redirect to the edit page after successful creation for step 2 (adding members and albums)
            } else {
                alert('Det gick inte att skapa gruppen.\n\nTips: Formulärfält får endast innehålla engelska bokstäver (a-z), siffror, mellanslag och /.');
            }
        });
    }
});