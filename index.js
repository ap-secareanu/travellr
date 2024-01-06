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
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.urlencoded({ extended: true }));
const db = new pg_1.default.Client({
    user: "postgres",
    host: 'localhost',
    database: 'travellr',
    password: 'postgres',
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
    const currentUser = yield getCurrentUser();
    const friendName = req.body.friendName;
    const result = yield db.query(`INSERT INTO friends(name, master_user) VALUES($1, $2)`, [friendName, currentUser.username]);
    res.send(200);
}));
app.post("/country", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const countryName = req.body.countryName;
    const country = yield getCountry(countryName);
    const friend = yield getCurrentFriend();
    const result = yield db.query('INSERT INTO visited_countries (country_code, country_name, visited_by) VALUES ($1, $2, $3)', [country[0].country_code, country[0].country_name, friend.name]);
    res.send('Successfully added country to visited countries.');
}));
app.listen(port, () => {
    console.log(`API running on port ${port}`);
});
