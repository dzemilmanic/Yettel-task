const User = require('../models/User');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { firstName, lastName, email, password } = req.body;

    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== parseInt(id)) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updated = await User.update(id, { firstName, lastName, email, password });
    
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findById(id);
    res.json({ 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await User.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};