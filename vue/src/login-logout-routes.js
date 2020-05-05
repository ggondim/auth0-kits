import { Auth0Service } from '@auth0-kits/client';

const { tenantUrl: auth0url, clientId } = enx.auth0;
const { authCode: authCodeUrl, refreshToken: refreshTokenUrl } = enx.login;

const auth0 = new Auth0Service(window.localStorage, {
  auth0url,
  clientId,
  authCodeUrl,
  refreshTokenUrl,
});

export async function logoutRoute(auth0, /* to, from, next */) {
  auth0.clearStorage();
  // TODO: logout no Auth0
  // TODO: redirect para tela principal (home)
}

export async function loginRoute(auth0, to, /* from, next */) {
  let state = {};

  if (to.query.state) {
    try {
      state = auth0.parseState(to.query.state);
    } catch (e) {
      console.log('erro do parsestate');
    }
  }

  if (to.query && to.query.error) {
    // 👣 Auth0 retornou para essa rota de login com erro
    throw to.query;
    // TODO: redirect para 401
  }

  if (!to.query || (to.query && !to.query.code)) {
    // 👣 alguma aplicação mandou para essa rota de login para autenticar o usuário
    // eslint-disable-next-line no-return-assign
    return window.location = auth0.getLoginLink();
  }

  // 👣 Auth0 retornou para essa rota com authentication code
  const authCode = to.query.code;
  let result;

  try {
    result = await auth0.getNewToken({ code: authCode });
  } catch (erro) {
    // 👣 API de login da NOALVO deu erro não capturado antes
    // let err = erro;
    // if (!erro) err = 'Erro nulo ao tentar obter o access token (login/token)';
    console.log('erro ao obter token');
    throw erro;
    // TODO: redirect para 401
  }

  if (!result || !result.accessToken) {
    // 👣 API de login da NOALVO não retornou um access_token
    const error = new Error('access_token não foi retornado em login/token');
    error.result = result;
    console.log('token não gerado');
    throw error;
    // TODO: redirect para 401
  }

  // 👣 API de login da NOALVO retornou um access_token com sucesso
  auth0.saveStorage(result);

  if (state.redirect) {
    // 👣 Existe uma URL anterior pra voltar
    const domain = state.redirect.indexOf(window.location.host);
    const append = domain === -1 ? `?a_t=${result.accessToken}` : '';
    window.location = `${state.redirect}${append}`;
  }

  // TODO: redirecionar para menu principal
  // return next('menu');
}
