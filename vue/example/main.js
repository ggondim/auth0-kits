import Vue from 'vue';
import VueAuth0 from '@auth0-kits/vue';

import router from './router';

Vue.use(VueAuth0, {
  auth0: { /* Auth0Service constructor options */ },
  router: router,
});

Vue.use(VueAuth0, {
  auth0: { /* Auth0Service constructor options */ },
  router: {
    router,
    loginRouteConfig: {
      name: 'login',
      path: '/user-login',
    },
  },
});
