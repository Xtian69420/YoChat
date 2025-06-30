const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const userController = require('../controllers/userController');
const cribController = require('../controllers/cribController');

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
router.post('/user/signin', userController.signIn);


// crib routes
router.post('/crib/create', cribController.createCrib);
router.put('/crib/update/:cribId', cribController.updateCrib);
router.get('/cribs', cribController.getAllCrib);
router.get('/crib/:cribId', cribController.getSpecificCrib);
router.delete('/crib/:cribId', cribController.deleteCrib);
router.put('/crib/:cribId/members', cribController.addMembers);
router.delete('/crib/:cribId/member/:memberId', cribController.removeMemeberById);
router.post('/crib/:cribId/message', cribController.sendMessage);
router.get('/cribs/user/:userId', cribController.getUserCribs);
router.get('/crib/:cribId/members', cribController.getCribMembers);

module.exports = router;