// databaseUtility.js

import { storeName, dbName } from './config';
import * as model from './model';

// Open the IndexedDB database.
export async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function () {
      const db = request.result;

      // addresses store with indexes
      if (!db.objectStoreNames.contains('addresses')) {
        const addressStore = db.createObjectStore('addresses', {
          keyPath: 'id',
        });
        addressStore.createIndex('zipCode', 'zipCode', { unique: false });
        addressStore.createIndex('searchableAddress', 'searchableAddress', {
          unique: false,
        });
        addressStore.createIndex(
          'searchableTokens',
          'searchableAddressTokens',
          { unique: false, multiEntry: true }
        );
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let fetchAndStoreDataPromise = null;

export async function fetchAndStoreData() {
  if (fetchAndStoreDataPromise) {
    return fetchAndStoreDataPromise; // Return the existing promise if already running
  }

  fetchAndStoreDataPromise = (async () => {
    try {
      console.log('Starting fetchAndStoreData...');
      model.AppState.isFetchingData = true;

      const response = await fetch(
        'https://data.lacity.org/api/views/4ca8-mxuh/rows.json?accessType=DOWNLOAD'
      );
      const data = await response.json();

      const addresses = data.data
        .filter(item => item[18])
        .map((item, index) => {
          const addressString =
            `${item[11]} ${item[13]} ${item[14]} ${item[15]}`.trim();
          return {
            id: index + 1,
            streetNumber: item[11],
            streetDirection: item[13],
            streetName: item[14],
            streetType: item[15],
            zipCode: item[18],
            lat: item[19],
            lng: item[20],
            searchableAddress: addressString.toLowerCase(),
            searchableAddressTokens: tokenizeAddress(addressString),
          };
        });

      const db = await openDatabase();

      const batchSize = 1000;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        await storeDataBatch(db, batch);
      }

      console.log('All data stored successfully.');
      model.AppState.isDataLoaded = true;
    } catch (err) {
      console.error('Error in fetchAndStoreData:', err);
    } finally {
      model.AppState.isFetchingData = false;
      fetchAndStoreDataPromise = null; // Reset promise after completion
    }
  })();

  return fetchAndStoreDataPromise;
}

// Store data in IndexedDB in batches
async function storeDataBatch(db, batch) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    batch.forEach(item => store.put(item));

    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
// Helper function to calculate match score
export function calculateMatchScore(record, tokens) {
  let score = 0;

  // Match on street name
  if (
    record?.streetName &&
    tokens?.some(token => record.streetName.toLowerCase().includes(token))
  ) {
    score += 3;
  }

  // Match on street direction (only if it exists)
  if (
    record.streetDirection &&
    tokens?.some(token => record.streetDirection.toLowerCase().includes(token))
  ) {
    score += 2;
  }

  // Match on street type (if present)
  if (
    record.streetType &&
    tokens?.some(token => record.streetType.toLowerCase().includes(token))
  ) {
    score += 1;
  }

  // Match on street number (if present)
  if (
    record.streetNumber &&
    tokens?.some(token => record.streetNumber.toLowerCase().includes(token))
  ) {
    score += 1;
  }

  return score;
}
// Tokenize address into words for flexible search
export function tokenizeAddress(address) {
  return address.toLowerCase().trim().split(/\s+/); // Split by spaces
}

// Search by zip code first, then refine by the rest of the address
export async function searchAddress(zipCode, query) {
  const db = await openDatabase();

  const formattedZipCode = zipCode.trim(); // Ensure no extra spaces in zipCode
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore('addresses');
    const zipCodeIndex = store.index('zipCode');

    // Fetch all records matching the zip code
    const zipRequest = zipCodeIndex.getAll(formattedZipCode);

    zipRequest.onsuccess = function () {
      const zipFilteredResults = zipRequest.result;

      if (!query?.trim()) {
        resolve(zipFilteredResults.slice(0, 10)); // Return top 10 if no query
        return;
      }

      const tokens = query.toLowerCase().trim().split(/\s+/); // Tokenize query

      // Refined results based on tokens
      const refinedResults = zipFilteredResults.filter(record =>
        tokens.every(
          token =>
            record.searchableAddress.includes(token) ||
            (record.searchableAddressTokens &&
              record.searchableAddressTokens.includes(token))
        )
      );

      // Calculate relevance score for refined results
      refinedResults.forEach(result => {
        result.matchScore = calculateMatchScore(result, tokens);
      });

      refinedResults.sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
      resolve(refinedResults.slice(0, 10)); // Limit to top 10 results
    };

    zipRequest.onerror = error => reject(error);
  });
}

// Efficiently validate an address by matching tokens with IndexedDB indexes
export async function optimizedValidateAddress(zipCode, streetAddress) {
  try {
    // Ensure data is present in the database
    const isDatabasePopulated = await checkIfDatabasePopulated();
    if (!isDatabasePopulated) {
      console.log('Database is empty, fetching data...');
      await fetchAndStoreData();
    }
    console.log('database populated');
    const db = await openDatabase();

    // Format input
    const formattedZipCode = zipCode.trim();
    const tokens = streetAddress.toLowerCase().trim().split(/\s+/);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      // Using zipCodeIndex to fetch addresses that match the zip code first
      const zipCodeIndex = store.index('zipCode');
      const zipRequest = zipCodeIndex.getAll(formattedZipCode);

      zipRequest.onsuccess = function () {
        const zipFilteredResults = zipRequest.result;

        // If no results found for zipCode, return false immediately
        if (!zipFilteredResults || zipFilteredResults.length === 0) {
          resolve(false);
          return;
        }

        // Tokenize the query to match against 'searchableAddressTokens'
        const matchedResults = zipFilteredResults.filter(record => {
          // Check if all tokens exist in the searchable tokens of the address
          return tokens.every(token =>
            record.searchableAddressTokens.includes(token)
          );
        });

        // If any record matched all tokens, return true
        resolve(matchedResults.length > 0);
      };

      zipRequest.onerror = function () {
        reject(zipRequest.error);
      };
    });
  } catch (error) {
    console.error('Error in optimizedValidateAddress:', error);
    return false;
  }
}

// Function to check if the database is already populated
export async function checkIfDatabasePopulated() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      // Count the number of entries in the store
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result > 50);
      countRequest.onerror = () => reject(countRequest.error);
    });
  } catch (error) {
    console.error('Error checking database population:', error);
    return false;
  }
}
