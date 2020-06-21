// eslint-disable no-return-assign

export async function logoutRoute(auth0, /* to, from, next */) {
  auth0.clearStorage();
  const pClientId = `&client_id=${auth0.clientId}`;
  const pRedirect = auth0.afterLogoutUrl 
    ? `&returnTo=${auth0.afterLogoutUrl}`
    : `&returnTo=${window.location.href}`;
  window.location = `${auth0.auth0url}/v2/logout?federated${pClientId}${pRedirect}`;
}

function _authError(message, to, next, data) {
  const error = new Error(`[AUTH0 VUE] ${message}`);
  error.auth0 = true;
  error.code = 401;
  error.to = to;

  if (data) {
    error.data = data;
  }
  return next(error);
}

function _validatePermissions(decodedToken, permissions) {  
  const notFoundPermissions = [];
  if (permissions && Array.isArray(permissions)) {
    if (
      !decodedToken.permissions
      || !decodedToken.permissions.length 
      || !Array.isArray(decodedToken.permissions)
    ) {
      // token doesn't have permissions
      notFoundPermissions = permissions;
    } else {
      notFoundPermissions = permissions
        .filter(permission => !decodedToken.permissions.includes(permission));
    }
  }
  return notFoundPermissions;
}

async function _exchangeCodeTrigger(auth0, to, next, state) {
  // 👣 Route triggered with a valid authorization code, needs to exchange for an access token
  const authCode = to.query.code;
  let result;

  try {
    result = await auth0.getNewToken({ code: authCode });
  } catch (erro) {
    // 👣 An unknown error was returned from login API
    return _authError(`Unknown error when fetching access token`, to, next);
  }

  if (!result || !result.accessToken) {
    // 👣 No valid access_token was returned from login API, the user is not authorized
    return _authError(`Access token not returned by login API`, to, next, { result });
  }

  // 👣 A valid access_token was successfully returned from login API or by register API
  auth0.saveStorage(result);

  if (auth0.registerPermissions) {
    // 👣 Needs to register permissions for user if it is a new one
    const decodedToken = auth0.accessTokenPayload;
    const notFoundPermissions = _validatePermissions(decodedToken, auth0.registerPermissions);

    if (notFoundPermissions.length) {
      // 👣 User doesn't have required permissions, try to register it
      const registerSuccess = await auth0.registerUser();

      if (auth0.failOnRegister && !registerSuccess) {
        // 👣 Fails if the failOnRegister flag is activated
        return _authError(`Failed to register the user`, to, next, {
          result,
          permissions: auth0.registerPermissions,
        });
      }
    }
  }

  if (state.redirect) {
    // 👣 There is a previous URL to return to
    const q = state.redirect.indexOf('?') === -1 ? '?' : '&';
    return window.location = `${state.redirect}${q}logged_in=success`;
  }

  if (auth0.afterLoginUrl) {
    // 👣 There is an URL to redirect after login
    const q = auth0.afterLoginUrl.indexOf('?') === -1 ? '?' : '&';
    return window.location = `${auth0.afterLoginUrl}${q}logged_in=success`;
  }

  return next();
}

function _clientAuthorizationTrigger(auth0, options) {
  // 👣 Route triggered for user authorization, needs to redirect to Auth0 /authorize
  return window.location = auth0.getLoginLink(options);
}

export async function loginRoute(auth0, to, from, next) {
  if (!to.query || (to.query && !to.query.code)) {
    return _clientAuthorizationTrigger(auth0);
  }

  let state = {};

  if (to.query.state) {
    try {
      state = auth0.parseState(to.query.state);
    } catch (e) {
      const errorObject = JSON.parse(JSON.stringify(e));
      errorObject.message = e.toString();
      return _authError(`Parse state error`, to, next, { error: errorObject });
    }
  }

  if (to.query && to.query.error) {
    // 👣 Auth0 redirected with an error
    const description = to.query.error_description ? to.query.error_description : to.query.error;
    return _authError(`Error after Auth0 redirect:: '${description}'`, to, next);
  }

  if (to.query.code) {
    return await _exchangeCodeTrigger(auth0, to, next, state);
  }

  return _authError('Login panic', to, next, { state, from });
}

export async function linkRoute(auth0, to, from, next) {
  if (
    (!to.query || !to.query.provider) 
    && auth0.accessToken
    && window.sessionStorage.accessToken
  ) {
    // já tem os dois tokens salvos  
    const linked = await auth0.linkAccounts(window.sessionStorage.accessToken);
    if (linked.primary) {
      auth0.copyFromStorage(window.sessionStorage);
      const returnTo = window.sessionStorage.returnTo || auth0.afterLoginUrl;
      window.sessionStorage.clear();
      return window.location = returnTo;
    } else {
      return _authError('Error when linking accounts', to, next, {
        query: to.query,
        secondaryToken: auth0.accessToken,
        primaryToken: window.sessionStorage.accessToken,
        linked,
      });
    }
  } else if (
    (!to.query || !to.query.provider) 
    && (!auth0.accessToken || !window.sessionStorage.accessToken)
  ) {
    // deu ruim
    return _authError('Not found query or tokens', to, next, {
      query: to.query,
      secondaryToken: auth0.accessToken,
      primaryToken: window.sessionStorage.accessToken,
    });
  }

  if (to.query && to.query.provider && auth0.accessToken) {
    auth0.copyToStorage(window.sessionStorage);
    if (to.query.returnTo) {
      window.sessionStorage.setItem('returnTo', to.query.returnTo);
    }

    const scopes = to.query.scopes ? to.query.scopes.split(',') : [];
    return _clientAuthorizationTrigger(auth0, {
      redirect: `${window.location.protocol}//${window.location.host}/link`,
      provider: to.query.provider,
      scopes: [ ...auth0.DEFAULT_SCOPES, ...scopes ],
    });
  }
  
  return _authError('Link panic', to, next, { state, from });
}
