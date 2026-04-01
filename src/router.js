class Router {
  constructor() {
    this.routes = [];
  }

  get(pattern, handler) { this._add('GET', pattern, handler); }
  post(pattern, handler) { this._add('POST', pattern, handler); }
  put(pattern, handler) { this._add('PUT', pattern, handler); }
  delete(pattern, handler) { this._add('DELETE', pattern, handler); }

  _add(method, pattern, handler) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      method,
      regex: new RegExp('^' + regexStr + '$'),
      paramNames,
      handler,
    });
  }

  resolve(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

module.exports = Router;
