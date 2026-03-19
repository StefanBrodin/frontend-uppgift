'use strict';
import { MusicGroupService } from './music-group-service.js';

const service = new MusicGroupService();

// // const allGroups = service.readAll();
// // console.log("Här är mina genererade musikgrupper:");
// // console.table(allGroups); 




// // 1. Test page 0 with page size 10
// console.group("Test: Sida 0 (Page Size: 10)");
// const page0 = service.readGroups(0, 10);
// console.log("Metadata:", { 
//     page: page0.pageNr, 
//     total: page0.totalCount, 
//     pages: page0.totalPages 
// });
// console.table(page0.pageItems);
// console.groupEnd();

// // 2. Test page 1 with page size 10
// console.group("Test: Sida 1 (Page Size: 10)");
// const page1 = service.readGroups(1, 10);
// console.log("Den här ID:n bör börja på 11:");
// console.table(page1.pageItems);
// console.groupEnd();

// // 3. Test page 5 with page size 10
// console.group("Test: Sida 5 (Page Size: 10)");
// const page5 = service.readGroups(5, 10);
// console.log("Här ser vi grupperna 51-60 (eftersom vi börjar på 1 och index 0):");
// console.table(page5.pageItems);

// // Check first object of page 5 to see picture, members and album
// console.log("Detaljkontroll av första gruppen på sida 5:");
// console.log(page5.pageItems[0]);
// console.groupEnd();




const pageSize = 10;

// Collect metadata from the first page to determine total pages
const initialInfo = service.readGroups(0, pageSize);
const lastPageIndex = initialInfo.totalPages - 1; // 100 pages in total means index 0-99

console.group(`Test: Sista sidan (Index ${lastPageIndex}) med totalt 997 grupper`);

const lastPage = service.readGroups(lastPageIndex, pageSize);

console.log("Metadata för sista sidan:", {
    totalCount: lastPage.totalCount,
    totalPages: lastPage.totalPages,
    currentPage: lastPage.pageNr,
    itemsOnThisPage: lastPage.pageItems.length
});

// Show the last items to verify they are the last 7 groups (991-997 exactly)
console.table(lastPage.pageItems);

console.groupEnd();