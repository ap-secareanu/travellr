import express from 'express';
import pg from 'pg';

const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: 'localhost',
  database: 'travellr',
  password: 'postgres',
  port: 5432
});
db.connect();

let currentUserId:number = 1;
let currentFriendId:number = 2;

const getCurrentUser = async () => {
  const result = await db.query(
    `SELECT * FROM users WHERE id=$1`, [currentUserId]
  );
  return result.rows[0];
};

const getCurrentFriend = async () => {
  const result = await db.query(
    'SELECT * FROM friends WHERE id=$1', [currentFriendId]
  );
  return result.rows[0];
};

const getVisitedCountries = async () => {
  const result = await db.query(
    'SELECT * FROM visited_countries'
  );
  return result.rows;
};

const getCountry = async (name:string) => {
  const result = await db.query(
    "SELECT * FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [name]
  );
  return result.rows;
};

app.get("/", async (req, res) => {
  const friend = await getCurrentFriend();
  res.send(friend.name);
});

app.post("/add", async(req, res) => {       // todo Refactor for try...catch block
  const currentUser = await getCurrentUser();
  const friendName = req.body.friendName;
  const result = await db.query(
    `INSERT INTO friends(name, master_user) VALUES($1, $2)`, [friendName, currentUser.username]
  );
  res.send(200);
});

app.post("/country", async(req, res) => {
  const countryName = req.body.countryName;
  const country = await getCountry(countryName);
  const friend = await getCurrentFriend();
  const result = await db.query(
    'INSERT INTO visited_countries (country_code, country_name, visited_by) VALUES ($1, $2, $3)', [country[0].country_code, country[0].country_name, friend.name]
  );
  res.send('Successfully added country to visited countries.');
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});