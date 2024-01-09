"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = __importDefault(require("pg"));
require("dotenv/config");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.urlencoded({ extended: true }));
const db = new pg_1.default.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'travellr',
    password: process.env.DB_PASSWORD,
    port: 5432
});
db.connect();
let currentUserId = 1;
let currentFriendId = 2;
const getCurrentUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.query(`SELECT * FROM users WHERE id=$1`, [currentUserId]);
    return result.rows[0];
});
const getCurrentFriend = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.query('SELECT * FROM friends WHERE id=$1', [currentFriendId]);
    return result.rows[0];
});
const getVisitedCountries = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.query('SELECT * FROM visited_countries');
    return result.rows;
});
const getCountry = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.query("SELECT * FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [name]);
    return result.rows;
});
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const friend = yield getCurrentFriend();
    res.send(friend.name);
}));
app.post("/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const friendName = req.body.friendName;
    const friendColor = req.body.friendColor;
    try {
        if (friendName.length >= 2) {
            const currentUser = yield getCurrentUser();
            const result = yield db.query(`INSERT INTO friends(name, master_user, color) VALUES($1, $2, $3)`, [friendName, currentUser.username, friendColor]);
            res.send('Successfully added user.');
        }
        else {
            throw new Error;
        }
        ;
    }
    catch (err) {
        res.send("User already exists. Please enter a different name.");
    }
    ;
}));
app.post("/remove", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const toBeRemoved = req.body.friendName;
    try {
        const currentUser = yield getCurrentUser();
        const result = yield db.query('DELETE FROM friends WHERE name=$1 AND master_user=$2', [toBeRemoved, currentUser.username]);
        res.send('Successfully deleted friend.');
    }
    catch (err) {
        res.send(err);
    }
    ;
}));
app.post("/country", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const countryName = req.body.countryName;
    const friend = yield getCurrentFriend();
    try {
        const country = yield getCountry(countryName);
        if (country.length > 0 && countryName >= 2) {
            try {
                const result = yield db.query('INSERT INTO visited_countries (country_code, country_name, visited_by) VALUES ($1, $2, $3)', [country[0].country_code, country[0].country_name, friend.name]);
                res.send('Successfully added country to visited countries.');
            }
            catch (err) {
                res.send('Country for this user already exists.');
            }
            ;
        }
        else {
            throw new Error();
        }
        ;
    }
    catch (err) {
        res.send('Country not found. Please enter a valid country or state.');
    }
    ;
}));
app.listen(port, () => {
    console.log(`API running on port ${port}`);
});
