'use strict';
import { seedGenerator, uniqueId } from './SeidoHelpers/seido-helpers.js';

// The music group service that will manage the music groups. 
export function MusicGroupService() {

    // In the real application, code will be replaced with API calls to the backend server, but for now we'll use an in-memory
    // array to store our music groups. This array will be filled with mockup music group objects generated from the seeder. 
    const _seeder = new seedGenerator();
    this.musicGroups = [];

    // A private helper function to create a music group object from the seeder
    let _nextId = 1;

    const createMusicGroup = (_sgen) => {
        const group = {
            id: _nextId++,
            name: _sgen.musicBandName,
            establishedYear: Math.floor(Math.random() * (2024 - 1960) + 1960),
            genre: _sgen.fromString("Rock, Pop, Jazz, Metal, Synth, Blues"),

            // For this early mockup, the same static image URL for all groups is used. In the real application this will be stored in the backend.
            imageUrl: 'assets/images/group-images/depeche-mode.jpg',
            
            // Creating 3-6 members per group using the seeder's toArray method
            members: _sgen.toArray(Math.floor(Math.random() * 4 + 3), (s) => ({
                id: uniqueId(), 
                name: s.fullName
            })),

            // Creating 2-8 albums per group using the seeder's toArray method
            albums: _sgen.toArray(Math.floor(Math.random() * 7 + 2), (s) => ({
                id: uniqueId(),
                title: s.musicAlbumName,
                releaseYear: Math.floor(Math.random() * (2024 - 1970) + 1970)
            }))
        };
        return group;
    };


    // Create a mockup "database"/list of 997 music groups using the seeder
    this.musicGroups = _seeder.toArray(997, createMusicGroup);

    // Simple method to retrieve all music groups
    this.readAll = function() {
        return this.musicGroups;
    };

    // A method to retrieve a single music group by its ID. It uses the Array.find() method to search through the musicGroups array 
    // and return the group that matches the provided ID. The ID is parsed as an integer to ensure it matches the type of the ID's stored 
    // in the musicGroups array. If no group is found with the given ID, it will return undefined.
    this.readGroup = function(id) {
        return this.musicGroups.find(group => group.id === parseInt(id));
    };
    
    // A method to retrieve a paginated list of music groups. It takes two parameters: pageNr (the page number to retrieve) and pageSize (the number of items per page).
    this.readGroups = function(pageNr, pageSize) {
        const ret = {
            pageNr: pageNr,
            pageSize: pageSize,
            totalCount: this.musicGroups.length,
            totalPages: Math.ceil(this.musicGroups.length / pageSize),
            pageItems: []
        };

        // Calculating the start and end index for slicing the musicGroups array based on the provided page number and page size. 
        // The start index is calculated as pageNr multiplied by pageSize, and the end index is calculated as start plus pageSize. 
        // The slice method is then used to extract the relevant portion of the musicGroups array corresponding to the requested page, 
        // and this subset of groups is assigned to ret.pageItems before returning the result. 
        const start = pageNr * pageSize;
        const end = start + pageSize;

        ret.pageItems = this.musicGroups.slice(start, end);

        return ret;
    };
}