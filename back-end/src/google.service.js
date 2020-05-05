const querystring = require('querystring');
const fetch = require('node-fetch');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

class GoogleAuthService {
  /**
   * Renews a Google access token with a preview refresh token.
   * @static
   * @async
   * @param {String} refreshToken The refresh token.
   * @param {String} googleClientId Your app's Client ID registered in Google.
   * @param {String} googleClientSecret Your app's Client secret registered in Google.
   * @returns {Promise<Object>}
   * @memberof GoogleAuthService
   */
  static async renewToken(refreshToken, googleClientId, googleClientSecret) {
    const body = querystring.stringify({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const response = await fetch(GOOGLE_TOKEN_URL, { body });
    return response.json();
  }
}

module.exports = GoogleAuthService;