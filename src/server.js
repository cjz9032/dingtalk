const express = require('express')
const app = express()
const port = 8090

const storage = require('./storage')
const _myMsgSendedMap = {}
app.use(function (req, res) {
  res.end()
  // receiver
  if (req.query.args) {
    try {
      const msgItem = JSON.parse(req.query.args)
      // lower cache by baseMessage.messageId // todo into db
      const baseMessage = msgItem.baseMessage
      if (!_myMsgSendedMap[baseMessage.messageId]) {
        _myMsgSendedMap[baseMessage.messageId] = 1
        // if has, set to correct
        const content = baseMessage.content

        if (
          content.contentType === 1200 &&
          content.attachments[0].extension.title.includes('AccessToken') &&
          (+new Date() - baseMessage.createdAt) < 2 * 3600 * 1000
        ) {
          const str = content.attachments[0].extension.markdown
            .split('\n')[1]
            .trim()
          // set
          storage.batchUpdateTokens(str)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
