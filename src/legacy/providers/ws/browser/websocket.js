/*
 * ISC License (ISC)
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

const EventEmitter = require('events').EventEmitter

class WebSocketProxy extends EventEmitter {
  constructor (host, port, endpoint) {
    super()

    this.wsProvider = new WebSocket(`ws://${host}:${port}/${endpoint}`)
    this.readyState = this.wsProvider.readyState

    this.wsProvider.onclose = () => {
      this.emit('close')
      this.readyState = WebSocket.CLOSED
    }
    this.wsProvider.onopen = () => {
      this.emit('open')
      this.readyState = WebSocket.OPEN
    }
    this.wsProvider.onerror = (error) => this.emit('error', error)
    this.wsProvider.onmessage = (message) => this.emit('message', message.data)
  }

  send (message) {
    this.wsProvider.send(message)
  }

  close () {
    this.wsProvider.close()
  }
}

module.exports = WebSocketProxy
