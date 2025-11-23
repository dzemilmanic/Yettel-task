const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(400).json({ 
      error: 'Duplicate entry',
      details: 'Username or email already exists'
    });
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === '23503') {
    return res.status(400).json({ 
      error: 'Foreign key constraint violation',
      details: 'Referenced record does not exist'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.message 
    });
  }

  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;