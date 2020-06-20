
## 2020-06-20

### @auth0-kits/client - 1.1.0
- added: new `linkAccounts` method in Auth0Service.js (depends on new `linkAccountsUrl` constructor option)
- added: `DEFAULT_SCOPES` property in Auth0Service.js equals to the same package constant
- modified: `clearStorage` method now clears all the storage keys in `this.storageKeys` array
- added: new methods `copyToStorage` and `copyFromStorage` in Auth0Service.js
- added: new `loginRoute` option in `getLoginLink` method

### @auth0-kits/server - 1.2.0
- added: new `linkAccounts` method in auth0.service.js

### @auth0-kits/vue - 1.1.0
- added: new `linkRoute` in login-logout-routes.js and plugin.js