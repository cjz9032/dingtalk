const express = require('express');
const app = express();
const port = 8090;

var redis = require('redis');
const TOKEN_KEY = '123'
client = redis.createClient('6379', '127.0.0.1', {
  db: 0, // todo set
  auth_pass: '123456',
});

client.on('error', function (err) {
  console.log(err);
});

// app.use(express.static('./assets/dist'));
const _myMsgSendedMap = {};
app.use(function (req, res) {
  res.end();
  // receiver
  if (req.query.args) {
    try {
      const msgItem = JSON.parse(req.query.args);
      // lower cache by baseMessage.messageId // todo into db
      const baseMessage = msgItem.baseMessage;
      if (!_myMsgSendedMap[baseMessage.messageId]) {
        _myMsgSendedMap[baseMessage.messageId] = 1;
        // if has, set to correct
        const content = baseMessage.content;

        if (
          content.contentType === 1200 &&
          content.attachments[0].extension.title.includes('AccessToken')
        ) {
          const str = content.attachments[0].extension.markdown
            .split('\n')[1]
            .trim();
          // set
          client.set(TOKEN_KEY, str, redis.print);
          client.get(TOKEN_KEY, redis.print);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
