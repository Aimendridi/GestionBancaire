// Permet d'utiliser async/await dans les routes Express 4 sans try/catch partout
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
