'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();
const listContainer = document.getElementById('group-list-container');

function renderList(pageNr) {
    // 1. Keep the header but clear the rest of the list container
    const header = listContainer.querySelector('.list-header');
    listContainer.innerHTML = '';
    listContainer.appendChild(header);

    // 2. Retrieve the data for the requested page from the service. 
    const pageData = service.readGroups(pageNr, 10);

    // 3. Create and append a new row for each music group in the retrieved page data.
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
}

renderList(0);