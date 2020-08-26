var redis = require('redis');
const TOKEN_KEY = 'componentAccessToken';

const dbs = [3, 4];
const clients = dbs.map((dbIdx) => {
  const client = redis.createClient('6379', '192.168.2.91', {
    db: dbIdx,
    auth_pass: 'linkiebuy',
  });

  client.on('error', function (err) {
    console.log(err);
  });
  return client;
});

const batchUpdateTokens = (str) => {
  clients.forEach((c) => {
    c.set(TOKEN_KEY, str, redis.print);
    c.get(TOKEN_KEY, redis.print);
  });
};

module.exports.batchUpdateTokens = batchUpdateTokens;