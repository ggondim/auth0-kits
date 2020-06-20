import { Auth0Service } from '@auth0-kits/client';
import { loginRoute, logoutRoute, linkRoute } from './login-logout-routes';

const LOGIN_ROUTE_CONFIG = {
  path: '/login',
  name: 'login',
};

const LOGOUT_ROUTE_CONFIG = {
  path: '/logout',
  name: 'logout',
};

const LINK_ROUTE_CONFIG = {
  path: '/link',
  name: 'link',
};

function install (Vue, options) {
  const service = new Auth0Service(options.auth0);
  Vue.prototype.$auth0 = service;

  let _router = options.router;
  if (options.router.loginRouteConfig) {
    _router = options.router;
  }
  const routes = [
    options.router.loginRouteConfig || LOGIN_ROUTE_CONFIG,
    options.router.logoutRouteConfig || LOGOUT_ROUTE_CONFIG,
    options.router.linkRouteConfig || LINK_ROUTE_CONFIG,
  ];
  routes[0].beforeEnter = (to, from, next) => loginRoute(service, to, from, next);
  routes[1].beforeEnter = (to, from, next) => logoutRoute(service, to, from, next);
  routes[2].beforeEnter = (to, from, next) => linkRoute(service, to, from, next);
  _router.addRoutes(routes);
}

export default {
  install,
};
