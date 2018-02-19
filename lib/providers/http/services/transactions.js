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


const {createTxParams, createTxRangeParams} = require('./utils')

const HttpService = require('./index')


class Transactions extends HttpService {


  /**
   * Get transactions in the mempool
   *
   * @returns {Promise<*>}
   */
  async getPendingList() {
    let {data} = await this.client.get ('transactions')
    return data
  }

  /**
   * Get a block transactions count by hash
   *
   * @param hash
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHash(hash, {txTypes, excludeTxTypes}) {
    let params = createTxParams ({txTypes, excludeTxTypes})
    let endpoint = `/block/txs/count/hash/${hash}`
    let {data} = await this.client.get (endpoint, params, true)
    return data.count
  }

  /**
   * Get a block transactions count by height
   *
   * @param height
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<number>}
   */
  async getCountByHeight(height, {txTypes, excludeTxTypes}) {
    let params = createTxParams ({txTypes, excludeTxTypes})
    let endpoint = `/block/txs/count/height/${height}`
    let {data} = await this.client.get (endpoint, params, true)
    return data.count
  }

  /**
   * Get a transaction by index in the block by hash
   *
   * @param blockHash
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHash(blockHash, txIdx) {
    let endpoint = `block/tx/hash/${blockHash}/${txIdx}`
    let {data} = await this.client.get (endpoint, {'tx_encoding': 'json'}, true)
    return data
  }

  /**
   * Get a transaction by index in the block by height
   *
   * @param height
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromBlockHeight(height, txIdx) {
    let endpoint = `block/tx/height/${height}/${txIdx}`
    let {data} = await this.client.get (endpoint, {'tx_encoding': 'json'}, true)
    return data
  }

  /**
   * Get a transaction by index in the latest block
   *
   * @param txIdx
   * @returns {Promise<*>}
   */
  async getFromLatest(txIdx) {
    let url = `block/tx/latest/${txIdx}`
    let {data} = await this.client.get (url, {'tx_encoding': 'json'}, true)
    return data
  }

  /**
   * Get transactions list from a block range by hash
   *
   * @param from
   * @param to
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async filterByHashRange(from, to, {txTypes, excludeTxTypes}) {
    let url = `block/txs/list/hash`
    let params = createTxRangeParams (from, to, {txTypes, excludeTxTypes})
    let {data} = await this.client.get (url, params, true)
    return data
  }

  /**
   * Get transactions list from a block range by height
   *
   * @param from
   * @param to
   * @param txTypes
   * @param excludeTxTypes
   * @returns {Promise<*>}
   */
  async filterByHeightRange(from, to, {txTypes, excludeTxTypes}) {
    let endpoint = 'block/txs/list/height'
    let params = createTxRangeParams (from, to, {txTypes, excludeTxTypes})
    let {data} = await this.client.get (endpoint, params, true)
    return data
  }

  async send(tx) {
    let body = {tx}
    let {data} = await this.client.post ('tx', body)
    return data
  }

}

module.exports = Transactions
