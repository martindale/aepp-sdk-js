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


const createTxParams = ({txTypes, excludeTxTypes}) => {
  let params = {}
  if (Array.isArray(txTypes)) {
    params['tx_types'] = txTypes.join(',')
  }
  if (Array.isArray(excludeTxTypes)) {
    params['exclude_tx_types'] = excludeTxTypes.join(',')
  }
  return params
}

const createTxRangeParams = (from, to, {txTypes, excludeTxTypes}) => {
  let params = createTxParams({txTypes, excludeTxTypes})
  params.from = from
  params.to = to
  params['tx_encoding'] = 'json'
  return params
}

module.exports = {
  createTxRangeParams,
  createTxParams
}