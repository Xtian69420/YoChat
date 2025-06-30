const Crib = require('../models/cribModel');
const User = require('../models/usersModel');

// Create a new crib
exports.createCrib = async (req, res) => {
  try {
    const { name, key, creatorId } = req.body;

    const existing = await Crib.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Crib name already exists' });

    const crib = new Crib({
      name,
      key,
      membersId: [creatorId] // auto-add creator
    });

    await crib.save();
    res.status(201).json({ message: 'Crib created successfully', crib });
  } catch (error) {
    console.error('Create Crib Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update crib name or key
exports.updateCrib = async (req, res) => {
  try {
    const { cribId } = req.params;
    const updates = req.body;

    const updatedCrib = await Crib.findByIdAndUpdate(cribId, updates, { new: true });
    if (!updatedCrib) return res.status(404).json({ message: 'Crib not found' });

    res.status(200).json({ message: 'Crib updated', crib: updatedCrib });
  } catch (error) {
    console.error('Update Crib Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllCrib = async (req, res) => {
  try {
    const cribs = await Crib.find();

    const cribsWithUsernames = await Promise.all(
      cribs.map(c => populateMessagesWithUsernames(c))
    );

    res.status(200).json(cribsWithUsernames);
  } catch (error) {
    console.error('Get All Cribs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getSpecificCrib = async (req, res) => {
  try {
    const { cribId } = req.params;
    const crib = await Crib.findById(cribId);
    if (!crib) return res.status(404).json({ message: 'Crib not found' });

    const cribWithUsernames = await populateMessagesWithUsernames(crib);
    res.status(200).json(cribWithUsernames);
  } catch (error) {
    console.error('Get Crib Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Delete crib
exports.deleteCrib = async (req, res) => {
  try {
    const { cribId } = req.params;
    const deleted = await Crib.findByIdAndDelete(cribId);
    if (!deleted) return res.status(404).json({ message: 'Crib not found' });
    res.status(200).json({ message: 'Crib deleted' });
  } catch (error) {
    console.error('Delete Crib Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add member(s) to crib
exports.addMembers = async (req, res) => {
  try {
    const { cribId } = req.params;
    const { memberIds } = req.body;

    const crib = await Crib.findById(cribId);
    if (!crib) return res.status(404).json({ message: 'Crib not found' });

    const unique = [...new Set([...crib.membersId, ...memberIds])];
    crib.membersId = unique;

    await crib.save();
    res.status(200).json({ message: 'Members added', membersId: crib.membersId });
  } catch (error) {
    console.error('Add Members Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove one member from crib
exports.removeMemeberById = async (req, res) => {
  try {
    const { cribId, memberId } = req.params;

    const crib = await Crib.findById(cribId);
    if (!crib) return res.status(404).json({ message: 'Crib not found' });

    crib.membersId = crib.membersId.filter(id => id !== memberId);
    await crib.save();

    res.status(200).json({ message: 'Member removed', membersId: crib.membersId });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send message to crib
exports.sendMessage = async (req, res) => {
  try {
    const { cribId } = req.params;
    const { userId, message } = req.body;

    const crib = await Crib.findById(cribId);
    if (!crib) return res.status(404).json({ message: 'Crib not found' });

    crib.messages.push({ userId, message, dateTime: new Date() });
    await crib.save();

    res.status(200).json({ message: 'Message sent', messages: crib.messages });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserCribs = async (req, res) => {
  try {
    const { userId } = req.params;

    const cribs = await Crib.find({ membersId: userId });

    const cribsWithUsernames = await Promise.all(
      cribs.map(c => populateMessagesWithUsernames(c))
    );

    res.status(200).json({
      message: `Cribs for user ${userId}`,
      cribs: cribsWithUsernames
    });
  } catch (error) {
    console.error('Get User Cribs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

async function populateMessagesWithUsernames(crib) {
  const userIds = crib.messages.map(msg => msg.userId);

  // pull BOTH username and pfpLink
  const users = await User.find(
    { _id: { $in: userIds } },
    { username: 1, pfpLink: 1 }
  );

  const userMap = {};
  users.forEach(user => {
    userMap[user._id] = {
      username: user.username,
      pfpLink: user.pfpLink
    };
  });

  const messagesWithUserInfo = crib.messages.map(msg => ({
    ...msg.toObject(), // convert from Mongoose subdoc
    username: userMap[msg.userId]?.username || 'Unknown',
    pfpLink: userMap[msg.userId]?.pfpLink || null
  }));

  return { ...crib.toObject(), messages: messagesWithUserInfo };
}


exports.getCribMembers = async (req, res) => {
  try {
    const { cribId } = req.params;

    const crib = await Crib.findById(cribId);
    if (!crib) {
      return res.status(404).json({ message: 'Crib not found' });
    }

    const members = await User.find(
      { _id: { $in: crib.membersId } },
      { _id: 1, username: 1 }
    );

    const formattedMembers = members.map(member => ({
      userId: member._id,
      username: member.username
    }));

    res.status(200).json({
      message: 'Crib members fetched successfully',
      members: formattedMembers
    });
  } catch (error) {
    console.error('Get Crib Members Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addMemberThruInviteKey = async (req, res) => {
  try {
    const { name, key, userId } = req.body;

    // Check if a crib exists with the given name and key
    const crib = await Crib.findOne({ name, key });
    if (!crib) {
      return res.status(404).json({ message: 'Invalid crib name or key' });
    }

    // Check if user is already a member
    if (crib.membersId.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this crib' });
    }

    // Add user to members
    crib.membersId.push(userId);
    await crib.save();

    res.status(200).json({
      message: 'User successfully added to the crib',
      cribId: crib._id,
      membersId: crib.membersId
    });
  } catch (error) {
    console.error('Add Member via Invite Key Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
