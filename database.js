const DB_KEY = "adineh_poultry_database_v3";

function dbLoad() {
    try {
        return JSON.parse(localStorage.getItem(DB_KEY)) || {};
    } catch {
        return {};
    }
}

function dbSave(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function getActiveUser() {
    return localStorage.getItem("activeUser") || "guest";
}

function userData() {
    const db = dbLoad();
    const user = getActiveUser();

    if (!db[user]) {
        db[user] = {
            flock: {},
            weights: [],
            performance: [],
            feed: [],
            water: [],
            vaccine: [],
            medicine: []
        };
        dbSave(db);
    }

    return db[user];
}

function saveUserData(data) {
    const db = dbLoad();
    db[getActiveUser()] = data;
    dbSave(db);
}

function saveFlock(data) {
    const d = userData();
    d.flock = data;
    saveUserData(d);
}

function loadFlock() {
    return userData().flock || {};
}

function addWeightRecord(record) {
    const d = userData();
    d.weights = d.weights || [];

    d.weights = d.weights.filter(x => Number(x.age) !== Number(record.age));
    d.weights.push(record);

    d.weights.sort((a,b) => Number(a.age) - Number(b.age));

    saveUserData(d);
}

function getWeightRecords() {
    return userData().weights || [];
}

function addFeedRecord(record) {
    const d = userData();
    d.feed = d.feed || [];
    d.feed.push(record);
    saveUserData(d);
}

function getFeedRecords() {
    return userData().feed || [];
}

function addWaterRecord(record) {
    const d = userData();
    d.water = d.water || [];
    d.water.push(record);
    saveUserData(d);
}

function getWaterRecords() {
    return userData().water || [];
}

function addVaccineRecord(record) {
    const d = userData();
    d.vaccine = d.vaccine || [];
    d.vaccine.push(record);
    saveUserData(d);
}

function getVaccineRecords() {
    return userData().vaccine || [];
}

function addMedicineRecord(record) {
    const d = userData();
    d.medicine = d.medicine || [];
    d.medicine.push(record);
    saveUserData(d);
}

function getMedicineRecords() {
    return userData().medicine || [];
}

function removeRecord(type, index) {
    const d = userData();

    if (Array.isArray(d[type])) {
        d[type].splice(index, 1);
        saveUserData(d);
    }
}

function clearUserData() {
    const db = dbLoad();
    delete db[getActiveUser()];
    dbSave(db);
}
