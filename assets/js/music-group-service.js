'use strict';

// Made MusicGroupService into a class to better match the structure of the API service that will be used later. 
// The constructor is used to set up any common properties, and the methods are defined within the class body. 
export class MusicGroupService {

    // The baseUrl is the common denominator for all API calls, so we set it in the constructor. 
    // This way, if the API endpoint changes, we only need to update it in one place.
    constructor() {
        this.baseUrl = 'https://music.api.public.seido.se';
    }

    // Retrieves a paginated list of music groups from the API. It takes pageNr, pageSize, and an optional filter string as parameters.
    async readGroups(pageNr, pageSize, filter = '') {

        // Using the parameters from the Swagger documentation to construct the API URL. 
        const url = `${this.baseUrl}/api/MusicGroups/Read?seeded=true&flat=true&pageNr=${pageNr}&pageSize=${pageSize}&filter=${filter}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Kunde inte hämta data: ${response.statusText}`);
            }

            const data = await response.json();

            // Mapping the metadata from the API response to the format expected by the frontend already created. 
            // The API returns 'pageCount' for total pages, which we use directly. 
            return {
                pageNr: data.pageNr,
                pageSize: data.pageSize,
                totalCount: data.dbItemsCount,
                totalPages: data.pageCount,
                pageItems: data.pageItems // The API already returns the actual items in the correct format so they can be used directly without further mapping.
            };
        } catch (error) {
            console.error('Service Error (readGroups):', error);
            // Returning an empty page structure in case of error to give the frontend a chance to handle it gracefully instead of crashing. 
            return { pageNr, pageSize, totalCount: 0, totalPages: 0, pageItems: [] };
        }
    }

    // Retrieves a single music group by its ID. Uses the 'flat=false' parameter to get the full details of the group, including its members and albums.
    async readGroup(id) {
    
        const url = `${this.baseUrl}/api/MusicGroups/ReadItem?id=${id}&flat=false`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Kunde inte hitta gruppen');
            
            const data = await response.json();
            return data.item; // Return the inner "item" which contains the actual group details, since the API wraps it in an outer object.   
        } catch (error) {
            console.error('Service Error (readGroup):', error);
            return null;
        }
    }
}