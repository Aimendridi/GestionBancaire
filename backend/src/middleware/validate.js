const HttpError = require('../utils/httpError');

// validate(schema) ou validate(schema, 'query')
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, 'Données invalides', details));
  }
  req[source] = result.data;
  next();
};
