export function logger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${method} ${url} ${res.statusCode} ${ms}ms`);
  });
  next();
}
