const router = require('express').Router();
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const CryptoJS = require('crypto-js');

const CBAUTH = require('./config');
/*
const CBAUTH = {
  public: 'public',
  secret: 'secret',
  phrase: 'phrase',
}
*/

// const API_SERVICE_URL = "https://api-public.sandbox.pro.coinbase.com";
// const API_SERVICE_URL = "https://api.pro.coinbase.com";
const API_SERVICE_URL = "https://api.exchange.coinbase.com";

router.use(function (req, res, next) {

  const timestamp = Date.now() / 1000;

  const requestPath = req.url;

  const method = req.method.toUpperCase();

  const data = req.body;
  const body = (method === 'GET' || !data) ? '' : JSON.stringify(data);

  // create the prehash string by concatenating required parts
  const what = timestamp + method + requestPath + body;

  const key       = CryptoJS.enc.Base64.parse(CBAUTH.secret);
  const sign      = CryptoJS.HmacSHA256(what, key).toString(CryptoJS.enc.Base64);

  req.headers['CB-ACCESS-KEY'] = CBAUTH.public;
  req.headers['CB-ACCESS-SIGN'] = sign;
  req.headers['CB-ACCESS-TIMESTAMP'] = timestamp;
  req.headers['CB-ACCESS-PASSPHRASE'] = CBAUTH.phrase;

  next();
})

// Proxy endpoints
router.use('', createProxyMiddleware({
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/coinbase`]: '',
  },
  onProxyReq: fixRequestBody,
}));

module.exports = router;
