const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // we use cors to allow the frontend to access the backend
const session = require('express-session'); // we use express-session to store the session in the database
const bcrypt = require('bcrypt'); // we use bcrypt to hash the passwords
const multer = require('multer'); // we use multer to store the resume files in the database
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const path = require('path');


const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // a cookie expires after 1 day
}));

const connection = mysql.createConnection({
  host: 'mysql-2964fd8b-wiseleet-9cee.b.aivencloud.com',
  port: 20569,
  user: 'avnadmin',
  password: 'AVNS_6K1RLh5Pms5jUrRsWFO',
  database: 'defaultdb',
});

studentTableQuery = "CREATE TABLE IF NOT EXISTS student2 (id INT PRIMARY KEY AUTO_INCREMENT, fname VARCHAR(255), lname VARCHAR(255), dob DATE, gender VARCHAR(1), email VARCHAR(255), password VARCHAR(255))"
companyTableQuery = "CREATE TABLE IF NOT EXISTS company (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), location VARCHAR(255), email VARCHAR(255), password VARCHAR(255))"
internshipsTableQuery = "CREATE TABLE IF NOT EXISTS internships (id INT PRIMARY KEY AUTO_INCREMENT, company_id INT, title VARCHAR(255), type VARCHAR(255), skills VARCHAR(255), salary INT, start_date DATE, end_date DATE, deadline DATE, description VARCHAR(255), FOREIGN KEY (company_id) REFERENCES company(id))"
applicationsTableQuery = "CREATE TABLE IF NOT EXISTS applications2 (id INT PRIMARY KEY, fname VARCHAR(255), lname VARCHAR(255), dob DATE, gender VARCHAR(1), email VARCHAR(255), file_upload BLOB, internship VARCHAR(255))"
interndatatest = "insert into internships (company_id, title, type, skills, salary, start_date, end_date, deadline, description) values (1, 'Software Developer Intern', 'Remote', 'JavaScript, React, Node.js', 3000, '2024-06-01', '2024-08-31', '2024-05-15', 'Learn full-stack development with modern technologies'), (1, 'Data Analyst Intern', 'On-site', 'Python, SQL, Excel', 2500, '2024-06-01', '2024-08-31', '2024-05-20', 'Analyze business data and create reports'), (2, 'Marketing Intern', 'Remote', 'Social Media, Content Creation', 2000, '2024-07-01', '2024-09-30', '2024-06-15', 'Help with digital marketing campaigns'), (3, 'UI/UX Design Intern', 'On-site', 'Figma, Adobe Creative Suite', 3500, '2024-06-15', '2024-09-15', '2024-06-01', 'Design user interfaces and user experiences'), (4, 'Cybersecurity Intern', 'Remote', 'Network Security, Linux', 4000, '2024-07-01', '2024-10-01', '2024-06-30', 'Learn about cybersecurity and threat detection'), (5, 'AI/ML Intern', 'On-site', 'Python, TensorFlow, Machine Learning', 4500, '2024-08-01', '2024-11-01', '2024-07-15', 'Work on artificial intelligence and machine learning projects');"


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
  const { email, password } = req.body;
  connection.query(
    `SELECT * FROM student2 WHERE email = ?`,
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) {
        return res.status(401).json({ error: 'wrong email/password' });
      }
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'wrong email/password' });
      }
      req.session.studentId = user.id;
      res.json({ message: 'login successful' });
    }
  );
});

app.post("/studentsignup", async (req, res) => {
  console.log("request received");
  const body = req.body;
  console.log(body);

  const { firstname, lastname, dob, gender, email, password } = body;

  try {
    connection.query(
      `SELECT * FROM student2 WHERE email = ?`,
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ error: 'db error' });
        if (results.length > 0) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
          `INSERT INTO student2 (fname, lname, dob, gender, email, password) VALUES (?, ?, ?, ?, ?, ?)`,
          [firstname, lastname, dob, gender, email, hashedPassword],
          function (err, result) {
            if (err) return res.status(500).json({ error: 'db error' });
            res.status(201).json({ message: 'student registered' });
          }
        );
      }
    );
  } catch (e) {
    console.error('error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post("/companysignup", async (req, res) => {
  const { name, location, email, password } = req.body;
  try {
    connection.query(
      `SELECT * FROM company WHERE email = ?`,
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ error: 'db error' });
        if (results.length > 0) {
          return res.status(400).json({ error: 'email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
          `INSERT INTO company (name, location, email, password) VALUES (?, ?, ?, ?)`,
          [name, location, email, hashedPassword],
          function (err, result) {
            if (err) return res.status(500).json({ error: 'db error' });
            res.status(201).json({ message: 'company registered' });
          }
        );
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/companysignin', (req, res) => {
  const { email, password } = req.body;
  connection.query(
    `SELECT * FROM company WHERE email = ?`,
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) {
        return res.status(401).json({ error: 'wrong email/password' });
      }
      const company = results[0];
      const match = await bcrypt.compare(password, company.password);
      if (!match) {
        return res.status(401).json({ error: 'wrong email/password' });
      }
      req.session.companyId = company.id;
      res.json({ message: 'login successful' });
    }
  );
});

app.get('/student/profile', (req, res) => {
  if (!req.session.studentId) return res.status(401).json({ error: 'Not authenticated' });
  connection.query(
    'SELECT id, fname, lname, dob, gender, email FROM student2 WHERE id = ?',
    [req.session.studentId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) return res.status(404).json({ error: 'student not found' });
      res.json(results[0]);
    }
  );
});

app.post('/student/profile/edit', async (req, res) => {
  if (!req.session.studentId) return res.status(401).json({ error: 'Not authenticated' });
  const { fname, lname, dob, gender, email, password } = req.body;
  let updateFields = [];
  let updateValues = [];
  if (fname) { updateFields.push('fname = ?'); updateValues.push(fname); }
  if (lname) { updateFields.push('lname = ?'); updateValues.push(lname); }
  if (dob) { updateFields.push('dob = ?'); updateValues.push(dob); }
  if (gender) { updateFields.push('gender = ?'); updateValues.push(gender); }
  if (email) { updateFields.push('email = ?'); updateValues.push(email); }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.push('password = ?'); updateValues.push(hashedPassword);
  }
  if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  updateValues.push(req.session.studentId);
  connection.query(
    `UPDATE student2 SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json({ message: 'Profile updated' });
    }
  );
});

app.get('/company/profile', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  connection.query(
    'SELECT id, name, location, email FROM company WHERE id = ?',
    [req.session.companyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) return res.status(404).json({ error: 'company not found' });
      res.json(results[0]);
    }
  );
});

app.post('/company/profile/edit', async (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const { name, location, email, password } = req.body;
  let updateFields = [];
  let updateValues = [];
  if (name) { updateFields.push('name = ?'); updateValues.push(name); }
  if (location) { updateFields.push('location = ?'); updateValues.push(location); }
  if (email) { updateFields.push('email = ?'); updateValues.push(email); }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateFields.push('password = ?'); updateValues.push(hashedPassword);
  }
  if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  updateValues.push(req.session.companyId);
  connection.query(
    `UPDATE company SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json({ message: 'Profile updated' });
    }
  );
});

app.post('/student/apply', upload.single('resume'), (req, res) => {
  if (!req.session.studentId) return res.status(401).json({ error: 'Not authenticated' });
  const { fname, lname, dob, gender, email } = req.body;
  const file_upload = req.file ? req.file.buffer : null;
  connection.query(
    `INSERT INTO applications2 (id, fname, lname, dob, gender, email, file_upload) VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [req.session.studentId, fname, lname, dob, gender, email, file_upload],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ message: 'app submitted' });
    }
  );
});

app.use(express.static(path.join(__dirname)));

// Serve usinternshipslist.html
app.get('/usinternshipslist', (req, res) => {
  res.sendFile(path.join(__dirname, 'usinternshipslist.html'));
});

app.get('/internships', (req, res) => {
  connection.query(
    `SELECT i.*, c.name as company_name, c.location as company_location 
     FROM internships i 
     LEFT JOIN company c ON i.company_id = c.id 
     ORDER BY i.deadline ASC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json(results);
    }
  );
});

app.get('/internships/filter', (req, res) => {
  const { company, type, location, salary } = req.query;
  let query = `SELECT i.*, c.name as company_name, c.location as company_location 
               FROM internships i 
               LEFT JOIN company c ON i.company_id = c.id 
               WHERE 1=1`;
  let params = [];
  
  if (company) {
    query += ` AND c.name LIKE ?`;
    params.push(`%${company}%`);
  }
  if (type) {
    query += ` AND i.type = ?`;
    params.push(type);
  }
  if (location) {
    query += ` AND c.location LIKE ?`;
    params.push(`%${location}%`);
  }
  if (salary) {
    query += ` AND i.salary >= ?`;
    params.push(parseInt(salary));
  }
  
  query += ` ORDER BY i.deadline ASC`;
  
  connection.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(results);
  });
});

app.post('/internships', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const { title, type, skills, salary, start_date, end_date, deadline, description } = req.body;
  
  connection.query(
    `INSERT INTO internships (company_id, title, type, skills, salary, start_date, end_date, deadline, description) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.session.companyId, title, type, skills, salary, start_date, end_date, deadline, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.status(201).json({ message: 'Internship created', id: result.insertId });
    }
  );
});

app.get('/companies', (req, res) => {
  connection.query(
    `SELECT DISTINCT name FROM company ORDER BY name`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json(results.map(r => r.name));
    }
  );
});

app.get('/locations', (req, res) => {
  connection.query(
    `SELECT DISTINCT location FROM company WHERE location IS NOT NULL AND location != '' ORDER BY location`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json(results.map(r => r.location));
    }
  );
});

app.get('/company/internships', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  connection.query(
    `SELECT * FROM internships WHERE company_id = ? ORDER BY id DESC`,
    [req.session.companyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      res.json(results);
    }
  );
});

app.put('/internships/:id', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const { title, type, skills, salary, start_date, end_date, deadline, description } = req.body;
  const internshipId = req.params.id;
  
  connection.query(
    `UPDATE internships SET title = ?, type = ?, skills = ?, salary = ?, start_date = ?, end_date = ?, deadline = ?, description = ? 
     WHERE id = ? AND company_id = ?`,
    [title, type, skills, salary, start_date, end_date, deadline, description, internshipId, req.session.companyId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Internship not found or not authorized' });
      }
      res.json({ message: 'Internship updated successfully' });
    }
  );
});

app.delete('/internships/:id', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const internshipId = req.params.id;
  
  connection.query(
    `DELETE FROM internships WHERE id = ? AND company_id = ?`,
    [internshipId, req.session.companyId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Internship not found or not authorized' });
      }
      res.json({ message: 'Internship deleted successfully' });
    }
  );
});

app.get('/internships/:id', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const internshipId = req.params.id;
  
  connection.query(
    `SELECT * FROM internships WHERE id = ? AND company_id = ?`,
    [internshipId, req.session.companyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) {
        return res.status(404).json({ error: 'Internship not found or not authorized' });
      }
      res.json(results[0]);
    }
  );
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.post('/company/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.post('/student/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.listen(3000, () => {
    console.log("server started");
    connection.query(interndatatest);
});
