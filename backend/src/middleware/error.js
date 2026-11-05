const HttpError = require('../utils/httpError');

const notFound = (req, res, next) => next(new HttpError(404, 'Route introuvable'));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON invalide' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
};

module.exports = { notFound, errorHandler };
