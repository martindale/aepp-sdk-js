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

require('@babel/polyfill')

const chai = require ('chai')
const assert = chai.assert


const AeHttpProvider = require ('../lib/providers/http/index')
const AeternityClient = require('../lib/aepp-sdk')

// Naive assertion
const assertIsBlock = (data) => {
  assert.ok (data)
  assert.ok (data['state_hash'])
  assert.ok(Number.isInteger(data.height))
}

const randomAeName = () => {
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let urlLength = 10

  for (let i = 0; i < urlLength; i++) {
    text += possible.charAt (Math.floor (Math.random () * possible.length))
  }
  return `${text}.aet`
}

let provider = new AeHttpProvider ('localhost', 3013, {secured: false})

provider.setBaseUrl('http://localhost:3001')
provider.setBaseUrl('http://localhost:3001/internal',true)
let client1 = new AeternityClient(provider)

let provider2 = new AeHttpProvider ('localhost', 3023, {secured: false})
provider2.setBaseUrl('http://localhost:3002/')
provider2.setBaseUrl('http://localhost:3002/internal',true)

let client2 = new AeternityClient(provider2)

let provider3 = new AeHttpProvider ('localhost', 3033, {secured: false})

provider3.setBaseUrl('http://localhost:3003/')
provider3.setBaseUrl('http://localhost:3003/internal',true)

let httpProvider3 = new AeternityClient(provider3)


module.exports = {
  httpProvider1: client1,
  httpProvider2: client2,
  httpProvider3,
  assertIsBlock,
  randomAeName,
  TIMEOUT: 120000
}
