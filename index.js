// app.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const session = require('express-session');


const app = express();
const port = 3000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
  }));
  

// Route to render the upload form
app.get('/', (req, res) => {
  res.render('index');
});

// Route to handle file upload and parsing
app.post('/upload', upload.single('csvfile'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      req.session.csvData = results;
      res.redirect('/view?page=1');
    });
});

// Route to display the CSV data with pagination and search
app.get('/view', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const searchQuery = req.query.search || '';
  const itemsPerPage = 100;
  let data = req.session.csvData || [];
  
  if (searchQuery) {
    data = data.filter(row => Object.values(row).some(val => val.includes(searchQuery)));
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  res.render('view', {
    data: paginatedData,
    currentPage: page,
    totalPages: totalPages,
    searchQuery: searchQuery
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
