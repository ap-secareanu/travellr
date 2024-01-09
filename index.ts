import express from 'express';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const app = express();
const port = 3000;
const saltRounds = 10;

let loggedIn = false;

app.use(express.urlencoded({ extended: true }));

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432
});
db.connect();

let currentUserId: number = 1;
let currentFriendId: number = 2;

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

const getCountry = async (name: string) => {
  const result = await db.query(
    "SELECT * FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [name]
  );
  return result.rows;
};

app.get("/", async (req, res) => {
  const friend = await getCurrentFriend();
  res.send(friend.name);
});

app.post("/add", async (req, res) => {
  const friendName: string = req.body.friendName;
  const friendColor: string = req.body.friendColor;
  try {
    if (friendName.length >= 2) {
      const currentUser = await getCurrentUser();
      const result = await db.query(
        `INSERT INTO friends(name, master_user, color) VALUES($1, $2, $3)`, [friendName, currentUser.username, friendColor]
      );
      res.send('Successfully added user.');
    } else {
      throw new Error;
    };
  } catch (err) {
    res.send("User already exists. Please enter a different name.");
  };
});

app.post("/remove", async (req, res) => {
  const toBeRemoved:string = req.body.friendName;
  try {
    const currentUser = await getCurrentUser();
    const result = await db.query(
      'DELETE FROM friends WHERE name=$1 AND master_user=$2', [toBeRemoved, currentUser.username]
    );
    res.send('Successfully deleted friend.');
  } catch (err) {
    res.send(err);
  };
});

app.post("/country", async (req, res) => {
  const countryName = req.body.countryName;
  const friend = await getCurrentFriend();
  try {
    const country = await getCountry(countryName);
    if (country.length > 0 && countryName >= 2) {
      try {
        const result = await db.query(
          'INSERT INTO visited_countries (country_code, country_name, visited_by) VALUES ($1, $2, $3)', [country[0].country_code, country[0].country_name, friend.name]
        );
        res.send('Successfully added country to visited countries.');
      } catch (err) {
        res.send('Country for this user already exists.')
      };
    } else {
      throw new Error();
    };
  } catch (err) {
    res.send('Country not found. Please enter a valid country or state.');
  };
});

app.post("/register", async (req, res) => {   // TODO refactor into try...catch
  const username = req.body.username;
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]
    );
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  };

  
});

app.post("/login", async (req, res) => {    // TODO refactor into try...catch
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await db.query(
      'SELECT * FROM users WHERE username=$1', [username]
    );
    if(user.rows.length) {
      bcrypt.compare(password, user.rows[0].password, function(err, result) {
        loggedIn = result;
      });
      res.sendStatus(200)
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    res.sendStatus(500);
  }

});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});