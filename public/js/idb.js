//create variable to hold db connection
let db;
//establish a connection to IndexedDB database called 'bidget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

//this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //creat an object store (table) called 'new_tracker', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_tracker', { autoIncrement: true });
};

//upon a successful
request.onsuccess = function(event) {
    //when db is successfuly created with its object store (from onupgradedneeded event above)
    db = event.target.result;

    //check if app is online, if yes run uploadBudgetTracker() function to send all local db data to api
    if (navigator.onLine) {
        uploadBudgetTracker();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//this function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    //access the object store for 'new_tracker'
    const transObjectStore = transaction.objectStore('new_tracker');

    //add record to your store with add method
    transObjectStore.add(record);
}

function uploadBudgetTracker() {
    //open a transaction on your db
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    //access your object store
    const transObjectStore = transaction.objectStore('new_tracker');

    //get all records from store and set to a variable
    const getAll = transObjectStore.getAll();

    //upon a succesful getAll() execution, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/budget', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accect: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction(['new_tracker'], 'readwrite');
                    //access the new_tracker object store
                    const ObjecttransStore = transaction.objectStore('new_tracker');
                    //clear all items in your store
                    transObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadBudgetTracker);