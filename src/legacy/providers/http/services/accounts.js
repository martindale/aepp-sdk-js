/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

const {createTxParams} = require('./utils')
const HttpService = require('./index')

/**
 * Wraps all account related services of the Epoch HTTP API
 */
class Accounts extends HttpService {
  constructor (httpClient) {
    super(httpClient)
    this.BASE_ENDPOINT = 'account'
  }

  /**
   * Retrieves the account balance
   *
   *
   * @returns {Promise<Accounts.getBalance>}
   */
  async getBalance (account, {height, hash} = {}) {
    const { balance } = await this.client.ae.getAccountBalance(account, {height, hash})
    return balance
  }

  /**
   * Get accounts’s transactions included in blocks in the longest chain
   *
   * @param limit
   * @param offset
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async getTransactions (account, {limit, offset, txTypes, excludeTxTypes} = {}) {
    // TODO tests?
    const params = {
      ...createTxParams({txTypes, excludeTxTypes}),
      limit,
      offset,
      'tx_encoding': 'json'
    }

    const { transactions } = await this.client.ae.getAccountTransactions(account, params)
    return transactions
  }
}

module.exports = Accounts
