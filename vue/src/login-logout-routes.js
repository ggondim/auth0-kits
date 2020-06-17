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

  // 👣 A valid access_token was successfully returned from login API
  auth0.saveStorage(result);

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

function _clientAuthorizationTrigger(auth0) {
  // 👣 Route triggered for user authorization, needs to redirect to Auth0 /authorize
  return window.location = auth0.getLoginLink();
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
