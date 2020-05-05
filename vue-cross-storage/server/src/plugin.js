import AuthKitsVuePlugin from '@auth0-kits/vue';
import XAuth from './XAuth';

export function install (Vue, options) {
  let _router = options.router;
  if (options.router.loginRouteConfig) {
    _router = options.router;
  }

  const xauthRoute = {
    path: '/xauth',
    name: 'xauth',
    component: XAuth,
  };
  _router.addRoutes([xauthRoute]);

  return AuthKitsVuePlugin.install(Vue, options);
}
