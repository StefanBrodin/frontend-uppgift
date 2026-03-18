'use strict';
import { seedGenerator, uniqueId } from './SeidoHelpers/seido-helpers.js';

// A music group service that will manage the music groups. 
export function MusicGroupService() {

    // In the real application, code would be replaced with API calls to a backend server, but for now we'll use an in-memory
    // array to store our music groups. This array will be filled with music group objects generated from the seeder. 
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
            imageUrl: 'assets/images/group_images/Depeche_Mode_1985.jpg',
            
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


    // Create a mockup "database"/list of 1000 music groups using the seeder
    this.musicGroups = _seeder.toArray(1000, createMusicGroup);

    // Simple method to retrieve all music groups
    this.readAll = function() {
        return this.musicGroups;
    };

}