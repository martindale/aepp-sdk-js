/*
 * Copyright 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const {AeSubscription} = require('./subscriptions')

let WebSocketProxy
if (process.browser || typeof window !== 'undefined') {
  WebSocketProxy = require('./browser/websocket')
} else {
  WebSocketProxy = require('./websocket')
}

const Oracles = require('./services/oracles')

class WebSocketProvider extends WebSocketProxy {
  constructor(host, port, endpoint = 'websocket') {
    super(host, port, endpoint)

    this.subscriptions = []

    this.on('message', (data) => {
      let dataJson = JSON.parse (data)

      for (let i in this.subscriptions) {
        let subscription = this.subscriptions[i]
        if (subscription.matches(dataJson)) {
          subscription.update(dataJson)
        }
      }
    })

    // New block mining events are so fundamental that the subscription
    // should be active by default
    this.on('open', () => {
      // register to mining event
      this.send(
        JSON.stringify({
          "target": "chain",
          "action": "subscribe",
          "payload": {"type": "new_block"}
        })
      )
      this.addSubscription(new AeSubscription({
        origin: 'chain',
        action: 'new_block',
        update: (data) => this.emit('newBlock', data.payload.height)
      }))
    })

    this.oracles = new Oracles(this)
  }

  addSubscription(subscription) {
    this.subscriptions.push(subscription)
  }

}

module.exports = WebSocketProvider