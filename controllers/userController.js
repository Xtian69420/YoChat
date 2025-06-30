const User = require('../models/usersModel');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });
const folderId = '1FW81XdFD8hZxyxCPV_-OWFBouWOolalo';

exports.createUser = async (req, res) => {
  try {
    const { username, password, gender } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let pfpLink = 'https://drive.google.com/thumbnail?id=1z1GP6qBTsl8uLLEqAjexZwTa1KPSEnRS&sz=w1920-h1080'; // default

    if (req.file) {
      try {
        const fileMetadata = {
          name: `${Date.now()}-${req.file.originalname}`,
          parents: [folderId]
        };
        const media = {
          mimeType: req.file.mimetype,
          body: fs.createReadStream(req.file.path)
        };

        const file = await drive.files.create({
          resource: fileMetadata,
          media,
          fields: 'id'
        });

        const fileId = file.data.id;

        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        pfpLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920-h1080`;

        fs.unlinkSync(req.file.path); // delete local temp file
      } catch (err) {
        console.error('Google Drive Upload Error:', err);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      }
    }

    const newUser = new User({
      username,
      password: hashedPassword,
      gender,
      pfpLink
    });

    await newUser.save();

    const { password: _, ...safeUser } = newUser.toObject();

    res.status(201).json({
      message: 'User created successfully',
      user: safeUser
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params; 
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    if (req.file) {
      try {
        const fileMetadata = {
          name: `${Date.now()}-${req.file.originalname}`,
          parents: [folderId]
        };
        const media = {
          mimeType: req.file.mimetype,
          body: fs.createReadStream(req.file.path)
        };

        const file = await drive.files.create({
          resource: fileMetadata,
          media,
          fields: 'id'
        });

        const fileId = file.data.id;

        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        const pfpLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920-h1080`;
        updates.pfpLink = pfpLink;

        fs.unlinkSync(req.file.path);
      } catch (uploadErr) {
        console.error('Google Drive Upload Error:', uploadErr);
        return res.status(500).json({ message: 'Failed to upload new profile picture' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...safeUser } = updatedUser.toObject();

    res.status(200).json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); 
    res.status(200).json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found or already deleted' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Exclude password in response
    const { password: _, ...safeUser } = user.toObject();

    res.status(200).json({
      message: 'Sign-in successful',
      user: safeUser
    });

  } catch (error) {
    console.error('Sign In Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
