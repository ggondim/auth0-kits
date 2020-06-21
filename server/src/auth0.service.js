const querystring = require('querystring');
const fetch = require('node-fetch');
const Tracer = require('untracer');

const TOKEN_URL = '/oauth/token';

const MANAGEMENT_API_AUDIENCE = '/api/v2/';

const CLIENT_URL = `${MANAGEMENT_API_AUDIENCE}/clients`;
const USER_URL = `${MANAGEMENT_API_AUDIENCE}/users`;
const USER_IDENTITIES_URL = '/identities';
const USER_ROLES_URL = '/roles';

class Auth0Service {
  /**
   *Creates an instance of Auth0Service.
   * @param {*} {
   *     auth0TenantUrl,
   *     oauthRedirectUri,
   *     clientId,
   *     clientSecret,
   *     debug = false,
   *     tracer,
   *     log,
   *   } options
   * @param {Tracer?} options.tracer
   * @memberof Auth0Service
   */
  constructor({
    auth0TenantUrl,
    oauthRedirectUri,
    clientId,
    clientSecret,
    debug = false,
    tracer,
    log,
  }) {
    this.auth0TenantUrl = auth0TenantUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.oauthRedirectUri = oauthRedirectUri;

    this.cachedManagementApiToken = null;

    this.tracer = tracer || new Tracer({ log, silent: !debug });
  }

  /**
   * Gets an Auth0 Management API token, used for managing your enterprise account in Auth0
   * @param {Object?} [options={}] { clientId, clientSecret }
   * @param {String?} [options.clientId] Client ID of your Auth0 tenant. If not specified, defaults to class  `clientId` property.
   * @returns {Promise<String|null>} async/Promise resolved with the access token or null if the API not emitted a token.
   * @async
   * @memberof Auth0Service
   */
  async getManagementApiToken({ clientId, clientSecret } = {}) {
    this.tracer.trace('getManagementApiToken');

    if (this.cachedManagementApiToken) {
      this.tracer.crumb({ cached: this.cachedManagementApiToken });
      return this.tracer.dump(this.cachedManagementApiToken);
    } 

    const client_id = clientId || this.clientId;
    const client_secret = clientSecret || this.clientSecret;
    this.tracer.crumb({ client_id, client_secret });

    const body = querystring.stringify({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
        audience: `${this.auth0TenantUrl}${MANAGEMENT_API_AUDIENCE}`,
    });
    this.tracer.crumb({ body });

    let response;
    try {
      const managementTokenUrl = `${this.auth0TenantUrl}${TOKEN_URL}`;
      this.tracer.crumb({ managementTokenUrl });

      response = await fetch(managementTokenUrl, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });      
    } catch (error) {
      throw this.tracer.break(error);
    }

    let tokenResponse;
    try {
      tokenResponse = await response.json();
      this.tracer.crumb({ tokenResponse });
    } catch (error) {
      throw this.tracer.break(error);
    }

    const result = (!resToken || !resToken.access_token) ? null : resToken.access_token;
    return this.tracer.dump(result);
  }

  /**
   * Gets user identity info in Auth0 Management API.
   * @param {String} userId User ID (usually it comes from `sub` property inside access_token JWT).
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async getUserInfo(userId) {
    this.tracer.trace('getUserInfo', { userId });

    let managementToken;
    try {
      managementToken = await this.getManagementApiToken({ logBreadcrumbs });
      this.tracer.crumb({ managementToken });

      if (!managementToken) {
        throw new Error('Cannot get user info because managementToken is null.');
      }
    } catch (error) {
      throw this.tracer.break(error);
    }

    const url = `${this.auth0TenantUrl}${USER_URL}${userId}`;
    this.tracer.crumb({ url });

    let response;
    try {
      response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${managementToken}` },
      });
      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });
    } catch (error) {
      throw this.tracer.break(error);
    }

    const responseJson = await response.json();
    return this.tracer.dump(responseJson);
  }

  /**
   * Exchanges an authorization code by an access token in Auth0.
   * @param {String} authorizationCode Authorization code granted to user during login flow.
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async getUserAccessTokenByCode(authorizationCode) {
    this.tracer.trace('getUserAccessTokenByCode', { authorizationCode });

    const body = querystring.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.oauthRedirectUri,
        code: authorizationCode
    });
    this.tracer.crumb({ body });

    let response;
    try {
      const url = `${this.auth0TenantUrl}${TOKEN_URL}`;
      this.tracer.crumb({ url });

      response = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });      
    } catch (error) {
      throw this.tracer.break(error);
    }

    const responseJson = await response.json();
    return this.tracer.dump(responseJson);
  }

  /**
   * Exchanges a refresh token by a new acess token in Auth0.
   * @param {String} refreshToken Refresh token (opaque) granted for user.
   * @returns {Promise<Object>}
   * @async
   * @memberof Auth0Service
   */
  async renewToken(refreshToken) {
    this.tracer.trace('renewToken', { refreshToken });

    const body = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirect_uri,
        refresh_token: refreshToken
    });
    this.tracer.crumb({ body });

    let response;
    try {
      const url = `${this.auth0TenantUrl}${TOKEN_URL}`;
      this.tracer.crumb({ url });

      response = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });  
    } catch (error) {
      throw this.tracer.break(error);
    }

    const responseJson = await response.json();
    return this.tracer.dump(responseJson);
  }

  async linkAccounts(primaryAccountUserId, secondaryToken) {
    this.tracer.trace('linkAccounts', { primaryAccountUserId, secondaryToken });

    let managementToken;
    try {
      managementToken = await this.getManagementApiToken();
      this.tracer.crumb({ managementToken });

      if (!managementToken) {
        throw new Error('Cannot get user info because managementToken is null.');
      }
    } catch (error) {
      throw this.tracer.break(error);
    }

    const body = querystring.stringify({
      link_with: secondaryToken,
    });
    this.tracer.crumb({ body });

    let response;
    try {
      const url = `${this.auth0TenantUrl}${USER_URL}/${primaryAccountUserId}/${USER_IDENTITIES_URL}`;
      this.tracer.crumb({ url });

      response = await fetch(url, {
        method: 'POST',
        body,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${managementToken}`,
        },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });  
    } catch (error) {
      throw this.tracer.break(error);
    }

    const responseJson = await response.json();
    return this.tracer.dump(responseJson);
  }

  async getClientMetadata() {
    this.tracer.trace('linkAccounts');

    let managementToken;
    try {
      managementToken = await this.getManagementApiToken();
      this.tracer.crumb({ managementToken });

      if (!managementToken) {
        throw new Error('Cannot get user info because managementToken is null.');
      }
    } catch (error) {
      throw this.tracer.break(error);
    }

    const clientUrl = `${this.auth0TenantUrl}${CLIENT_URL}/${this.clientId}`;
    const requestUrl = `${clientUrl}?fields=client_metadata&include_fields=true`;
    this.tracer.crumb({ clientUrl, requestUrl });

    let response;
    try {
      response = await fetch(requestUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${managementToken}` },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });  
    } catch (error) {
      throw this.tracer.break(error);
    }

    const responseJson = await response.json();
    this.tracer.crumb({ responseJson });

    const metadata = responseJson.client_metadata || null;
    return this.tracer.dump(metadata);
  }

  async assignUserRole(userId, ...rolesIds) {
    this.tracer.trace('assignUserRole', { userId, rolesIds });

    let managementToken;
    try {
      managementToken = await this.getManagementApiToken();
      this.tracer.crumb({ managementToken });

      if (!managementToken) {
        throw new Error('Cannot get user info because managementToken is null.');
      }
    } catch (error) {
      throw this.tracer.break(error);
    }

    const body = JSON.stringify({ roles: rolesIds });
    this.tracer.crumb({ body });

    let response;
    try {
      const url = `${this.auth0TenantUrl}${USER_URL}/${userId}/${USER_ROLES_URL}`;
      this.tracer.crumb({ url });

      response = await fetch(url, {
        method: 'POST',
        body,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${managementToken}`,
        },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });  
    } catch (error) {
      throw this.tracer.break(error);
    }

    const success = response.status < 400;
    return this.tracer.dump(success);
  }

  async deleteUser(userId) {
    this.tracer.trace('deleteUser', { userId });

    let managementToken;
    try {
      managementToken = await this.getManagementApiToken();
      this.tracer.crumb({ managementToken });

      if (!managementToken) {
        throw new Error('Cannot get user info because managementToken is null.');
      }
    } catch (error) {
      throw this.tracer.break(error);
    }

    let response;
    try {
      const url = `${this.auth0TenantUrl}${USER_URL}/${userId}`;
      this.tracer.crumb({ url });

      response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${managementToken}` },
      });

      const { headers, status, statusText } = response;
      this.tracer.crumb({ headers, status, statusText });  
    } catch (error) {
      throw this.tracer.break(error);
    }

    const success = response.status < 400;
    return this.tracer.dump(success);
  }
}

module.exports = Auth0Service;
