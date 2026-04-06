'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();
let currentSearchTerm = ''; // Global variable to keep track of the current search term (if any) for pagination

async function renderList(pageNr) {
    document.title = `Musikgruppslista - Evergreen Music`;
    const h1 = document.getElementById('page-h1');
    if (h1) h1.innerText = `Musikgruppslista`;

    const listContainer = document.getElementById('group-list-container');
    const feedbackContainer = document.getElementById('search-feedback');
    
    if (!listContainer) return;

    // Fetch data from the service using search term filtering. 
    // The service will handle the API call and return the paginated data.
    const pageData = await service.readGroups(pageNr, 10, currentSearchTerm);

    // Show feedback about the search results if a search term is active
    if (currentSearchTerm && feedbackContainer) {
        feedbackContainer.innerHTML = `Följande <b>${pageData?.totalCount ?? 0}</b> grupper innehåller sökordet '<b>${currentSearchTerm}</b>':`;
        feedbackContainer.style.display = 'block';
    } else if (feedbackContainer) {
        feedbackContainer.style.display = 'none';
    }

    // Keep the header but clear the rest of the list container
    const header = listContainer.querySelector('.list-header');
    listContainer.innerHTML = ''; 
    listContainer.appendChild(header);

    // Render the rows for the current page. The service already returns the items 
    // in the correct format so they can be used directly.
    (pageData?.pageItems ?? []).forEach(group => {
        const row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = `
            <div class="col-name">
                <a href="view-group.html?id=${group?.musicGroupId ?? ''}">${group?.name ?? 'Namn saknas'}</a>
            </div>
            <div class="col-actions">
                <button class="btn btn-edit">Ändra</button>
                <button class="btn btn-delete">Radera</button>
            </div>
        `;

        // *** Edit button logic ***
        // Find the edit button within the row and attach a click event listener to handle navigation to the edit page for that specific group.
        const editBtn = row.querySelector('.btn-edit');
        editBtn?.addEventListener('click', (e) => {
            // Stop the click event from propagating its way back up through the DOM (to the row's click event which 
            // could navigate to the group details (view-group.html) page). Not really needed right now since the 
            // row <div> itself doesn't have a click event for detailed views, but this might be added that later on. 
            e.stopPropagation();

            // Using the group.musicGroupId to navigate to the edit page for that specific music group. 
            window.location.href = `edit-group.html?id=${group?.musicGroupId ?? ''}`;
        });

        // *** Delete button logic ***
        // Find the delete button within the row and attach a click event listener to handle deletion of the group.
        const deleteBtn = row.querySelector('.btn-delete');
        
        deleteBtn?.addEventListener('click', async (e) => {
            // Stop the click event from propagating its way back up through the DOM (to the row's click event which 
            // could navigate to the group details (view-group.html) page). Not really needed right now since the 
            // row <div> itself doesn't have a click event for detailed views, but this might be added that later on. 
            e.stopPropagation();

            const confirmed = confirm(`Är du säker på att du vill radera "${group?.name ?? 'denna grupp'}"?`);
            
            if (confirmed) {
                const success = await service.deleteGroup(group?.musicGroupId);
                
                if (success) {
                    // Re-render the current page if the deletion was successful to reflect the changes. 
                    await renderList(pageData?.pageNr ?? 0);
                } else {
                    alert("Något gick fel vid raderingen. Försök igen.");
                }
            }
        });

        listContainer.appendChild(row);

    });

    // Fill up with empty rows if less than 10 items in the list to maintain consistent height and 
    // pagination button position to avoid layout shifts. 
    const rowsToFill = 10 - (pageData?.pageItems?.length ?? 0);
    for (let i = 0; i < rowsToFill; i++) {
        const emptyRow = document.createElement('div');
        // Keep 'list-row' so it gets the same grid/padding
        emptyRow.className = 'list-row empty-row'; 
        emptyRow.innerHTML = `
            <div class="col-name">
                <a class="invisible-content" tabIndex="-1">Tom rad</a>
            </div>
            <div class="col-actions">
                <button class="btn invisible-content" tabIndex="-1">Dummy</button>
                <button class="btn invisible-content" tabIndex="-1">Dummy</button>
            </div>
        `;
        listContainer.appendChild(emptyRow);
    }

    if (pageData) {
        renderPagination(pageData);
    }
}

function renderPagination(pageData) {
    const nav = document.querySelector('.pagination');
    if (!nav) return;

    // Remove old HTML pagination buttons
    nav.innerHTML = ''; 

    const currentPage = pageData?.pageNr ?? 0;
    const totalPages = pageData?.totalPages ?? 1;

    // *** Previous button ***
    const prev = document.createElement('button');
    prev.className = `pag-nav ${currentPage === 0 ? 'disabled' : ''}`;
    prev.innerText = 'Föregående';
    prev.disabled = currentPage === 0; 
    prev.addEventListener('click', () => {
        if (currentPage > 0) renderList(currentPage - 1);
    });

    nav.appendChild(prev);

    // *** Pagination Logic ***
    const maxButtons = Math.min(11, totalPages);
    let start = currentPage - Math.floor(maxButtons / 2);
    
    if (start < 0) start = 0;
    if (start + maxButtons > totalPages) {
        start = Math.max(0, totalPages - maxButtons);
    }

    let end = start + maxButtons - 1;

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.className = `pag-num ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i + 1;
        btn.addEventListener('click', () => {
            renderList(i);
        });
        nav.appendChild(btn);
    }

    // *** Next button ***
    const next = document.createElement('button');
    next.className = `pag-nav ${currentPage >= totalPages - 1 ? 'disabled' : ''}`;
    next.innerText = 'Nästa';
    next.disabled = currentPage >= totalPages - 1;
    next.addEventListener('click', () => {
        if (currentPage < totalPages - 1) renderList(currentPage + 1);
    });
    nav.appendChild(next);
}

// Wait for the DOM to be fully loaded before trying to manipulate it
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            currentSearchTerm = searchInput?.value?.trim() ?? '';
            renderList(0); 
        });
    }

    renderList(0); 
});