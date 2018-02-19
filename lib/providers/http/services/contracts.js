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


const HttpService = require('./index')

class Contracts extends HttpService {

  async getCreateTx(code, options = {}) {
    let contractTxData = {
      'owner': options.owner || await this.client.accounts.getPublicKey(),
      'gas_price': options.gasPrice || 1,
      'vm_version': options.vmVersion || 153,
      'amount': options.amount || 1,
      'code': code,
      'call_data': options.callData || '',
      'fee': options.fee || 1,
      'gas': options.gas || 1,
      'deposit': options.deposit || 1,
      'nonce': options.nonce || await this.client.accounts.getTransactionCount()
    }
    let {data} = await this.client.post('tx/contract/create', contractTxData)
    return data.tx
  }

  async compile(code, options) {
    let inputData = {code, options}
    let {data} = await this.client.post('contract/compile', inputData)
    return data.bytecode
  }

  async call(abi, code, func, arg) {
    let inputData = {
      abi: abi,
      code,
      'function': func,
      arg
    }
    let {data} = await this.client.post('contract/call', inputData)
    return data.out
  }

  async encodeCallData(abi, code, func, arg) {
    let body = {
      code,
      abi,
      'function': func,
      arg: arg
    }
    let {data} = await this.client.post('contract/encode-calldata', body)
    return data.calldata
  }

  async deployContract(code) {
    let tx = await this.getCreateTx(code)
    let successData = this.client.tx.send(tx)
    return successData
  }

}

module.exports = Contracts
