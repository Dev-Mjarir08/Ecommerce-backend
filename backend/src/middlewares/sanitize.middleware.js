/**
 * Custom NoSQL Injection Protection Middleware.
 * Recursively strips keys starting with '$' or containing '.' from request body, query, and params.
 */
const sanitize = (obj) => {
  if (obj instanceof Array) {
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        sanitize(item);
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      if (/^\$/.test(key) || /\./.test(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    });
  }
  return obj;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

export default mongoSanitize;
