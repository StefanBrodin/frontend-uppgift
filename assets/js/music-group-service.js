'use strict';

// Made MusicGroupService into a class to better match the structure of the API service that will be used later. 
// The constructor is used to set up any common properties, and the methods are defined within the class body. 
export class MusicGroupService {

    // The baseUrl is the common denominator for all API calls, so we set it in the constructor. 
    // This way, if the API endpoint changes, we only need to update it in one place.
    constructor() {
        this.baseUrl = 'https://music.api.public.seido.se';
    }


    // Retrieves a paginated list of music groups from the service. It takes pageNr, pageSize, and an optional filter string as parameters.
    async readGroups(pageNr, pageSize, filter = '') {

        // Using the parameters from the API-documentation by Swagger to construct the API URL. 
        const url = `${this.baseUrl}/api/MusicGroups/Read?seeded=false&flat=true&pageNr=${pageNr}&pageSize=${pageSize}&filter=${filter}`;
        
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


    // Deletes a music group by its ID. Sends a DELETE request to the API and returns true if the deletion was successful, or false if it failed.
    async deleteGroup(id) {

        const url = `${this.baseUrl}/api/MusicGroups/DeleteItem/${id}`;
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'accept': 'text/plain' // Tells the API that we expect a plain text response
                }
            });

            if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`Fel ${response.status}: ${errorText}`);
            }

            return true; // Return true to indicate successful deletion

        } catch (error) {
            console.error('Service Error (deleteGroup):', error);
            return false; // Return false to indicate failed deletion
        }
    }


    // Creates a new music group using the provided groupDto object by sending a POST request to the API with the group data in JSON format.
    // Returns the created group object if successful, returns null if it fails.
    async createGroup(groupDto) {
        const url = `${this.baseUrl}/api/MusicGroups/CreateItem`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Tells the API that the data sent in the body is JSON data.
                    'accept': 'application/json'        // Tells the API that we expect JSON data in response. 
                },
                // JSON.stringify transforms the JavaScript object (groupDto) into a JSON string, which is the format expected by the API for the request body.
                body: JSON.stringify(groupDto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            // The API returns the created group object in the response body, so we parse it as JSON and return it. 
            const data = await response.json();

            // The API wraps the actual group object in an outer "item" property, so we return data.item to return the unwrapped group details.
            return data.item; 
        } catch (error) {
            console.error('Service Error (createGroup):', error);
            return null;
        }
    }


    // Creates a new artist using the provided artistDto object by sending a POST request to the API with the artist data in JSON format.
    // Returns the created artist object if successful, returns null if it fails.
    async createArtist(artistDto) {
        const url = `${this.baseUrl}/api/Artists/CreateItem`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', // Tells the API that the data sent in the body is JSON data.
                    'accept': 'application/json'        // Tells the API that we expect JSON data in response. 
                }, 
                body: JSON.stringify(artistDto)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            // The API returns the created group object in the response body, so we parse it as JSON and return it. 
            const data = await response.json();

            // The API wraps the actual artist object in an outer "item" property, so we return data.item to return the unwrapped group details.
            return data.item; 
        } catch (error) {
            console.error('Service Error (createArtist):', error);
            return null; 
        }
    }


    // Creates a new album using the provided albumDto object by sending a POST request to the API with the album data in JSON format.
    // Returns the created album object if successful, returns null if it fails.
    async createAlbum(albumDto) {
        const url = `${this.baseUrl}/api/Albums/CreateItem`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', // Tells the API that the data sent in the body is JSON data.
                    'accept': 'application/json'        // Tells the API that we expect JSON data in response. 
                }, 
                body: JSON.stringify(albumDto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            // The API returns the created group object in the response body, so we parse it as JSON and return it. 
            const data = await response.json();

            // The API wraps the actual album object in an outer "item" property, so we return data.item to return the unwrapped group details.
            return data.item; 
        } catch (error) {
            console.error('Service Error (createAlbum):', error);
            return null; 
        }
    }


    // Updates an existing music group by its ID using a PUT request.
    // Sends the updated groupDto object as JSON and returns the updated item.
    async updateGroup(id, groupDto) {
        const url = `${this.baseUrl}/api/MusicGroups/UpdateItem/${id}`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(groupDto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.item; 
        } catch (error) {
            console.error('Service Error (updateGroup):', error);
            return null;
        }
    }


    // Updates an existing artist by its ID using a PUT request.
    // Sends the updated artistDto object as JSON and returns the updated item.
    async updateArtist(id, artistDto) {
        const url = `${this.baseUrl}/api/Artists/UpdateItem/${id}`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(artistDto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.item;
        } catch (error) {
            console.error('Service Error (updateArtist):', error);
            return null;
        }
    }


    // Updates an existing album by its ID using a PUT request.
    // Sends the updated albumDto object as JSON and returns the updated item.
    async updateAlbum(id, albumDto) {
        const url = `${this.baseUrl}/api/Albums/UpdateItem/${id}`;
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(albumDto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.item;
        } catch (error) {
            console.error('Service Error (updateAlbum):', error);
            return null;
        }
    }


    // Deletes an artist by its ID using a DELETE request. Returns true if successful, false if it fails.
    async deleteArtist(id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/Artists/DeleteItem/${id}`, {
                method: 'DELETE',
                headers: {
                    'accept': 'text/plain'
                }
            });
            return response.ok;
        } catch (error) {
            console.error("Service Error (deleteArtist):", error);
            return false;
        }
    }


    // Deletes an album by its ID using a DELETE request. Returns true if successful, false if it fails.
    async deleteAlbum(id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/Albums/DeleteItem/${id}`, {
                method: 'DELETE',
                headers: {
                    'accept': 'text/plain'
                }
            });
            return response.ok;
        } catch (error) {
            console.error("Service Error (deleteAlbum):", error);
            return false;
        }
    }
}

