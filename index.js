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
applicationsTableQuery = "CREATE TABLE IF NOT EXISTS applications2 (application_id INT PRIMARY KEY AUTO_INCREMENT, student_id INT, fname VARCHAR(255), lname VARCHAR(255), dob DATE, gender VARCHAR(1), email VARCHAR(255), file_upload BLOB, file_name VARCHAR(255), file_type VARCHAR(255), internship INT, status VARCHAR(20) DEFAULT 'pending', applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (student_id) REFERENCES student2(id), FOREIGN KEY (internship) REFERENCES internships(id))"


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
            req.session.studentId = result.insertId;
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
  const { fname, lname, dob, gender, email, internship_id } = req.body;
  const file_upload = req.file ? req.file.buffer : null;
  const file_name = req.file ? req.file.originalname : null;
  const file_type = req.file ? req.file.mimetype : null;
  
  console.log('Application submission:', { fname, lname, internship_id, file_name, file_type });
  
  connection.query(
    `INSERT INTO applications2 (student_id, fname, lname, dob, gender, email, file_upload, file_name, file_type, internship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [req.session.studentId, fname, lname, dob, gender, email, file_upload, file_name, file_type, internship_id],
    (err, result) => {
      if (err) {
        console.error('database error in application submission:', err);
        return res.status(500).json({ error: 'database error' });
      }
      console.log('Application submitted successfully:', result.insertId);
      res.status(201).json({ message: 'app submitted' });
    }
  );
});

app.use(express.static(path.join(__dirname)));

app.get('/usinternshipslist', (req, res) => {
  res.sendFile(path.join(__dirname, 'usinternshipslist.html'));
});

app.get('/internships', (req, res) => {
  console.log('internships endpoint called');
  connection.query(
    `SELECT i.*, c.name as company_name, c.location as company_location 
     FROM internships i 
     LEFT JOIN company c ON i.company_id = c.id 
     ORDER BY i.deadline ASC`,
    (err, results) => {
      if (err) {
        console.error('internships query error:', err);
        return res.status(500).json({ error: 'db error' });
      }
      console.log('internships query results:', results.length, 'records found');
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
        return res.status(404).json({ error: 'internship not found or not authorized' });
      }
      res.json({ message: 'Internship updated successfully' });
    }
  );
});

app.delete('/internships/:id', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'not authenticated' });
  const internshipId = req.params.id;
  
  connection.query(
    `DELETE FROM internships WHERE id = ? AND company_id = ?`,
    [internshipId, req.session.companyId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'internship not found or not authorized' });
      }
      res.json({ message: 'Internship deleted successfully' });
    }
  );
});

app.get('/internships/:id', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'not authenticated' });
  const internshipId = req.params.id;
  
  connection.query(
    `SELECT * FROM internships WHERE id = ? AND company_id = ?`,
    [internshipId, req.session.companyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (results.length === 0) {
        return res.status(404).json({ error: 'internship not found or not authorized' });
      }
      res.json(results[0]);
    }
  );
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'logged out successfully' });
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

app.get('/company/applications', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  // Get all internships for this company
  connection.query(
    `SELECT id, title FROM internships WHERE company_id = ?`,
    [req.session.companyId],
    (err, internships) => {
      if (err) return res.status(500).json({ error: 'db error' });
      if (!internships.length) return res.json([]);
      const internshipIds = internships.map(i => i.id);
      // Get all applications for these internships
      connection.query(
        `SELECT a.*, s.fname as student_fname, s.lname as student_lname, s.email as student_email, s.dob as student_dob, s.gender as student_gender, i.title as internship_title
         FROM applications2 a
         LEFT JOIN student2 s ON a.student_id = s.id
         LEFT JOIN internships i ON a.internship = i.id
         WHERE a.internship IN (?)`,
        [internshipIds],
        (err, applications) => {
          if (err) return res.status(500).json({ error: 'db error' });
          // Don't send file_upload in the main list for performance
          const apps = applications.map(app => ({
            id: app.application_id,
            fname: app.student_fname,
            lname: app.student_lname,
            email: app.student_email,
            dob: app.student_dob,
            gender: app.student_gender,
            internship_id: app.internship,
            internship_title: app.internship_title,
            application_id: app.application_id,
            status: app.status || 'pending',
            // For resume download, provide a download endpoint
            resume_url: `/company/applications/${app.application_id}/resume`
          }));
          res.json(apps);
        }
      );
    }
  );
});

// Resume download endpoint
app.get('/company/applications/:id/resume', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const appId = req.params.id;
  
  console.log('Resume download requested for application ID:', appId);
  
  // Check if this application belongs to an internship of this company
  connection.query(
    `SELECT a.file_upload, s.fname, s.lname, i.title, i.company_id FROM applications2 a
     LEFT JOIN internships i ON a.internship = i.id
     LEFT JOIN student2 s ON a.student_id = s.id
     WHERE a.application_id = ?`,
    [appId],
    (err, results) => {
      if (err) {
        console.error('database error in resume download:', err);
        return res.status(500).json({ error: 'database error' });
      }
      
      if (!results.length) {
        console.log('Application not found:', appId);
        return res.status(404).json({ error: 'Application not found' });
      }
      
      const app = results[0];
      console.log('Application found:', app);
      
      if (app.company_id != req.session.companyId) {
        console.log('Forbidden: Company ID mismatch');
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      if (!app.file_upload) {
        console.log('No resume uploaded for application:', appId);
        return res.status(404).json({ error: 'No resume uploaded' });
      }
      
      // Default to PDF since we don't have file type info in old records
      const contentType = 'application/pdf';
      const fileName = `${app.fname || 'resume'}_${app.lname || 'application'}.pdf`;
      
      console.log('Sending file:', fileName, 'Content-Type:', contentType);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', contentType);
      res.send(app.file_upload);
    }
  );
});

// updating the application status
app.put('/company/applications/:id/status', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  const { status } = req.body;
  const appId = req.params.id;
  
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
  }
  
  // checking if the application belongs to the company
  connection.query(
    `SELECT a.application_id, i.company_id FROM applications2 a
     LEFT JOIN internships i ON a.internship = i.id
     WHERE a.application_id = ?`,
    [appId],
    (err, results) => {
      if (err || !results.length) return res.status(404).json({ error: 'Application not found' });
      const app = results[0];
      if (app.company_id != req.session.companyId) return res.status(403).json({ error: 'Forbidden' });
      
      // updating the application status
      connection.query(
        `UPDATE applications2 SET status = ? WHERE application_id = ?`,
        [status, appId],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'database error' });
          res.json({ message: `Application ${status} successfully` });
        }
      );
    }
  );
});

// getting the applications for a specific student
app.get('/student/applications', (req, res) => {
  if (!req.session.studentId) return res.status(401).json({ error: 'Not authenticated' });
  
  connection.query(
    `SELECT a.application_id, a.status, a.applied_at, i.title as internship_title, i.type as internship_type, c.name as company_name, c.location as company_location
     FROM applications2 a
     LEFT JOIN internships i ON a.internship = i.id
     LEFT JOIN company c ON i.company_id = c.id
     WHERE a.student_id = ?
     ORDER BY a.applied_at DESC`,
    [req.session.studentId],
    (err, results) => {
      if (err) {
        console.error('database error in student applications:', err);
        return res.status(500).json({ error: 'database error' });
      }
      
      const applications = results.map(app => ({
        application_id: app.application_id,
        internship_title: app.internship_title,
        internship_type: app.internship_type,
        company_name: app.company_name,
        company_location: app.company_location,
        status: app.status || 'pending',
        applied_at: app.applied_at
      }));
      
      res.json(applications);
    }
  );
});

// getting the student dashboard stats
app.get('/student/dashboard-stats', (req, res) => {
  console.log('Student dashboard stats requested');
  if (!req.session.studentId) {
    console.log('No student session found');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  console.log('Student ID:', req.session.studentId);
  
  // getting the applications count for the student
  connection.query(
    `SELECT COUNT(*) as applications_count FROM applications2 WHERE student_id = ?`,
    [req.session.studentId],
    (err, appResults) => {
      if (err) {
        console.error('Error getting applications count:', err);
        return res.status(500).json({ error: 'database error' });
      }
      
      console.log('Applications count:', appResults[0].applications_count);
      
      // getting the total internships count (for "new internships" - we'll show total available)
      connection.query(
        `SELECT COUNT(*) as internships_count FROM internships WHERE deadline >= CURDATE()`,
        (err, intResults) => {
          if (err) {
            console.error('Error getting internships count:', err);
            return res.status(500).json({ error: 'database error' });
          }
          
          console.log('Internships count:', intResults[0].internships_count);
          
          const response = {
            applications_count: appResults[0].applications_count,
            internships_count: intResults[0].internships_count
          };
          
          console.log('Sending response:', response);
          res.json(response);
        }
      );
    }
  );
});

// getting company dashboard stats
app.get('/company/dashboard-stats', (req, res) => {
  if (!req.session.companyId) return res.status(401).json({ error: 'Not authenticated' });
  
  connection.query(
    `SELECT COUNT(*) as internships_count FROM internships WHERE company_id = ?`,
    [req.session.companyId],
    (err, intResults) => {
      if (err) return res.status(500).json({ error: 'database error' });
      
      connection.query(
        `SELECT COUNT(*) as pending_applications_count 
         FROM applications2 a
         LEFT JOIN internships i ON a.internship = i.id
         WHERE i.company_id = ? AND a.status = 'pending'`,
        [req.session.companyId],
        (err, appResults) => {
          if (err) return res.status(500).json({ error: 'database error' });
          
          res.json({
            internships_count: intResults[0].internships_count,
            pending_applications_count: appResults[0].pending_applications_count
          });
        }
      );
    }
  );
});

app.listen(3000, () => {
    console.log("server started");
});
