const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: 'mysql-2964fd8b-wiseleet-9cee.b.aivencloud.com',
  port: 20569,
  user: 'avnadmin',
  password: 'AVNS_6K1RLh5Pms5jUrRsWFO',
  database: 'defaultdb',
});

studentTableQuery = "CREATE TABLE IF NOT EXISTS student2 (id INT PRIMARY KEY AUTO_INCREMENT, fname VARCHAR(255), lname VARCHAR(255), dob DATE, gender VARCHAR(1), email VARCHAR(255), password VARCHAR(18))"
companyTableQuery = "CREATE TABLE IF NOT EXISTS company (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), location VARCHAR(255), email VARCHAR(255), password VARCHAR(255))"
internshipsTableQuery = "CREATE TABLE IF NOT EXISTS internships (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255), type VARCHAR(255), skills VARCHAR(255), salary INT, start_date DATE, end_date DATE, deadline DATE, description VARCHAR(255))"
applicationsTableQuery = "CREATE TABLE IF NOT EXISTS applications2 (id INT PRIMARY KEY, fname VARCHAR(255), lname VARCHAR(255), dob DATE, gender VARCHAR(1), email VARCHAR(255), file_upload BLOB, internship VARCHAR(255))"


connection.connect((err) => {
  if (err) {
    console.error('couldnt connect to the database', err);
    return;
  }
  console.log('connected');

  connection.query((studentTableQuery, companyTableQuery, internshipsTableQuery, applicationsTableQuery), function(err, result) {
    if (err) throw err;
    console.log("tables created");
  });
});




app.post('/studentsignin', (req, res) => {
  console.log("request received");
  body = req.body;

});

app.post("/studentsignup", (req, res) => {
  console.log("request received");
  body = req.body

  console.log(body);

  let firstname = body.firstname
  let lastname = body.lastname
  let dob = body.dob
  let gender = body.gender
  let email = body.email
  let password = body.password

  connection.query(`INSERT INTO student2 (fname, lname, dob, gender, email, password) VALUES (?, ?, ?, ?, ?, ?)`, [firstname, lastname, dob, gender, email, password], function(err, result) {
    if (err) throw err;
    console.log(result);
  })
});

app.listen(3000, () => {
    console.log("server started");
});
