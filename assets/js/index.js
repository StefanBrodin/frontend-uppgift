'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

function renderList(pageNr) {
    document.title = `Musikgruppslista - Evergreen Music`;
    const h1 = document.getElementById('page-h1');
    if (h1) h1.innerText = `Musikgruppslista`;

    const listContainer = document.getElementById('group-list-container');
    if (!listContainer) return;

    // Keep the header but clear the rest of the list container
    const header = listContainer.querySelector('.list-header');
    listContainer.innerHTML = ''; 
    listContainer.appendChild(header);

    const pageData = service.readGroups(pageNr, 10);

    pageData.pageItems.forEach(group => {
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
            <div class="col-name">
                <a href="view-group.html?id=${group.id}">${group.name}</a>
            </div>
            <div class="col-actions">
                <button class="btn btn-edit">Ändra</button>
                <button class="btn btn-delete">Radera</button>
            </div>
        `;
        listContainer.appendChild(row);
    });

    renderPagination(pageData);
}

function renderPagination(pageData) {
    const nav = document.querySelector('.pagination');
    if (!nav) return;

    // Remove old HTML pagination buttons
    nav.innerHTML = ''; 

    // *** Previous button ***
    // Keep the class names for the existing CSS but add "disabled" class (also in CSS) if it's the first page
    const prev = document.createElement('button');
    prev.className = `pag-nav ${pageData.pageNr === 0 ? 'disabled' : ''}`;
    prev.innerText = 'Föregående';

    // Buttons have a "disabled" property that can be set to true to disable them, which is more semantically correct than 
    // just adding a visual "disabled" class. This also prevents the button from being clickable when disabled.
    prev.disabled = pageData.pageNr === 0; 
    prev.onclick = () => {
        if (pageData.pageNr > 0) renderList(pageData.pageNr - 1);
    };
    nav.appendChild(prev);

    // *** Pagination Logic for Constant Button Count (current/active button in the middle) ***

    // Define the maximum number of page buttons to show
    const maxButtons = Math.min(11, pageData.totalPages);
    
    // Calculate start index to keep "current" (active) page centered if possible
    let start = pageData.pageNr - Math.floor(maxButtons / 2);
    
    // Ensure start doesn't go below 0 (beginning of the list)
    if (start < 0) {
        start = 0;
    }
    
    // Ensure the window doesn't shift past the last page
    // This keeps the count of buttons constant at the end of the list
    if (start + maxButtons > pageData.totalPages) {
        start = Math.max(0, pageData.totalPages - maxButtons);
    }

    // Calculate end index based on the fixed start and maxButtons
    let end = start + maxButtons - 1;

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        // Sets the active button to have an "active" class for styling.
        btn.className = `pag-num ${i === pageData.pageNr ? 'active' : ''}`;
        btn.innerText = i + 1;
        btn.onclick = () => {
            renderList(i);
        };
        nav.appendChild(btn);
    }

    // *** Next button ***
    const next = document.createElement('button');
    next.className = `pag-nav ${pageData.pageNr === pageData.totalPages - 1 ? 'disabled' : ''}`;
    next.innerText = 'Nästa';
    next.disabled = pageData.pageNr === pageData.totalPages - 1;
    next.onclick = () => {
        if (pageData.pageNr < pageData.totalPages - 1) renderList(pageData.pageNr + 1);
    };
    nav.appendChild(next);
}

// Wait for the DOM to be fully loaded before trying to manipulate it
document.addEventListener('DOMContentLoaded', () => {
    renderList(0);
});