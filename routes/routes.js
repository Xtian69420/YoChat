const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const userController = require('../controllers/userController');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// user routes
router.post('/user/create', upload.single('pfp'), userController.createUser);
router.put('/user/update/:userId', upload.single('pfp'), userController.updateUser);
router.get('/users', userController.getAllUsers);
router.get('/user/:userId', userController.getUserById);
router.delete('/user/:userId', userController.deleteUser);

module.exports = router;