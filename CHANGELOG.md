
## 2020-06-20

### @auth0-kits/client

#### 1.2.0
- added: new `registerUser` method in Auth0Service.js (depends on new `registerUserUrl`, `registerPermissions` and `failOnRegister` constructor options)
- added: `utils` property in Auth0Service.js exposing jwtiny package

#### 1.1.0
- added: new `linkAccounts` method in Auth0Service.js (depends on new `linkAccountsUrl` constructor option)
- added: `DEFAULT_SCOPES` property in Auth0Service.js equals to the same package constant
- modified: `clearStorage` method now clears all the storage keys in `this.storageKeys` array
- added: new methods `copyToStorage` and `copyFromStorage` in Auth0Service.js
- added: new `loginRoute` option in `getLoginLink` method

### @auth0-kits/server

#### 1.3.0
- added: cache management token API feature, reduces many requests for a management token to a single request
- fix: `linkAccounts` method doesn't have a management API token in auth0.service.js
- added: new `getClientMetadata` method in auth0.service.js
- added: new `assignUserRole` method in auth0.service.js
- added: new `deleteUser` method in auth0.service.js

#### 1.2.0
- added: new `linkAccounts` method in auth0.service.js

### @auth0-kits/vue 

### 1.2.0
- modified: new `auth0.registerPermissions` calls `auth0.registerUser()` if token doesn't have the required permissions 

### 1.1.0
- added: new `linkRoute` in login-logout-routes.js and plugin.js