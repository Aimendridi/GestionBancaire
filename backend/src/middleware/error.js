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
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Le fichier dépasse la taille maximale de 5 Mo' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Un seul fichier PDF est accepté' });
  console.error('[Erreur interne API]', {
    code: err.code || null,
    sqlMessage: err.sqlMessage || null,
    message: err.message,
    stack: err.stack,
  });
  res.status(500).json({ message: 'Erreur interne du serveur' });
};

module.exports = { notFound, errorHandler };
