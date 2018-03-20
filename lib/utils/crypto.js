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

require ('@babel/polyfill')

const bs58check = require ('bs58check')
const shajs = require ('sha.js')
const msgpack = require ('msgpack-lite')
const Mnemonic = require('bitcore-mnemonic')
const bitcore = require('bitcore-lib')

let codec = msgpack.createCodec({int64: true})

const EC = require ('elliptic').ec

const aesjs = require ('aes-js')

const secp256k1EC = new EC ('secp256k1')

const {leftPad, rightPad} = require('./bytes')

class HDWallet {
  // this is heavily "inspired" by https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/keystore.js
  constructor (hdPath, mnemonic) {
    let words = mnemonic.split(' ')
    if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12){
      throw new Error('HDWallet: Invalid mnemonic')
    }

    this.hdPath = hdPath
    this.mnemonic = mnemonic
    this.hdIndex = 0
    this.addresses = []
  }

  async init () {
    this.hdRoot = new Mnemonic(this.mnemonic).toHDPrivateKey().xprivkey
    this.hdRootKey = new bitcore.HDPrivateKey(this.hdRoot)
    this.hdPathKey = this.hdRootKey.derive(this.hdPath).xprivkey
  }

  static generateRandomSeed () {
    const seed = new Mnemonic(Mnemonic.Words.ENGLISH)
    return seed.toString()
  }

  static leftPadString (stringToPad, padChar, length) {
    let repreatedPadChar = ''
    for (let i=0; i<length; i++) {
      repreatedPadChar += padChar
    }

    return ( (repreatedPadChar + stringToPad).slice(-length) )
  }

  generateNewAddress (n) {
    const keys = this.generatePrivateKeys(n)

    for (let i = 0; i < n; i++) {
      let address = this.computeAddressFromPrivKey(keys[i])
      this.addresses.push(address)
    }
  }

  generatePrivateKeys (n) {
    const keys = []
    for (let i = 0; i < n; i++) {
      const hdprivkey = new bitcore.HDPrivateKey(this.hdPathKey).derive(this.hdIndex++)
      const privkeyBuf = hdprivkey.privateKey.toBuffer()
      let privkeyHex = privkeyBuf.toString('hex')
      if (privkeyBuf.length < 16) {
        throw new Error('Private key suspiciously small: < 16 bytes. Aborting!')
      }
      else if (privkeyBuf.length < 32) {
        privkeyHex = HDWallet.leftPadString(privkeyBuf.toString('hex'), '0', 64)
      }
      else if (privkeyBuf.length > 32) {
        throw new Error('Private key larger than 32 bytes. Aborting!')
      }
      keys.push(privkeyHex)
    }
    return keys
  }

  computeAddressFromPrivKey (privKey) {
    let keyPair = secp256k1EC.genKeyPair()
    keyPair._importPrivate(privKey, 'hex')

    const binaryPublic = keyPair.getPublic()
    const publicKeyBuffer = Buffer.from(binaryPublic.encode())
    const pubKeyAddress = bs58check.encode(publicKeyBuffer)
    const privKeyAddress = keyPair.getPrivate('hex')
    return {
      pub: `ak$${pubKeyAddress}`,
      priv: privKeyAddress
    }
  }
}

const Crypto = {
  hash: (input) => {
    return shajs ('sha256').update (input).digest()
  },

  encodeBase58Check: (input) => {
    return bs58check.encode (input)
  },

  decodeBase58Check: (str) => {
    return bs58check.decode (str)
  },

  generateKeyPair: (raw = false) => {
    // <epoch>/apps/aens/test/aens_test_utils.erl
    const keyPair = secp256k1EC.genKeyPair ()
    let binaryPublic = keyPair.getPublic ()

    if (raw) {
      let privateBin = keyPair.getPrivate('hex')
      let privBuffer = Buffer.from (privateBin, 'hex')
      let pubBin = binaryPublic.encode('hex')
      let pubBuffer = Buffer.from(pubBin, 'hex')
      return {
        pub: pubBuffer,
        priv: privBuffer
      }
    } else {
      const publicKeyBuffer = Buffer.from (binaryPublic.encode ())
      const pubKeyAddress = Crypto.encodeBase58Check (publicKeyBuffer)

      let privKeyAddress = keyPair.getPrivate ('hex')

      return {
        pub: `ak$${pubKeyAddress}`,
        priv: privKeyAddress
      }
    }
  },

  createHDWallet: async (hdPath, mnemonic, initialAddresses = 0) => {
    const hdWallet = new HDWallet(hdPath, mnemonic)
    await hdWallet.init()
    if (initialAddresses > 0) {
      hdWallet.generateNewAddress(initialAddresses)
    }
    return hdWallet
  },

  getReadablePublicKey: (binaryKey) => {
    const publicKeyBuffer = Buffer.from (binaryKey, 'hex')
    const pubKeyAddress = Crypto.encodeBase58Check (publicKeyBuffer)
    return `ak$${pubKeyAddress}`
  },

  generateSaveWallet: (password) => {
    let keys = Crypto.generateKeyPair(true)
    return {
      pub: Crypto.encryptPublicKey(password, keys.pub),
      priv: Crypto.encryptPrivateKey(password, keys.priv)
    }
  },

  encryptPublicKey: (password, binaryKey) => {
    return Crypto.encryptKey(password, rightPad(128, binaryKey))
  },

  encryptPrivateKey: (password, binaryKey) => {
    return Crypto.encryptKey(password, leftPad(32, binaryKey))
  },

  encryptKey: (password, binaryData) => {
    let hashedPassword = Crypto.hash (password)
    let hashedPasswordBytes = Buffer.from (hashedPassword, 'hex')
    let aesEcb = new aesjs.ModeOfOperation.ecb (hashedPasswordBytes)
    return aesEcb.encrypt(binaryData)
  },

  decryptKey: (password, encrypted) => {
    const encryptedBytes = Buffer.from (encrypted)
    let hashedPassword = Crypto.hash (password)
    let hashedPasswordBytes = Buffer.from (hashedPassword, 'hex')
    let aesEcb = new aesjs.ModeOfOperation.ecb (hashedPasswordBytes)
    return Buffer.from (aesEcb.decrypt (encryptedBytes))
  },

  decryptPrivateKey: (password, encrypted) => {
    return Crypto.decryptKey(password, encrypted)
  },

  decryptPubKey: (password, encrypted) => {
    return Crypto.decryptKey (password, encrypted).slice (0, 65)
  },

  sign: (txBin, privateKey) => {
    let key = secp256k1EC.keyFromPrivate (privateKey)
    return key.sign(Buffer.from(Crypto.hash(txBin))).toDER()
  },

  verify: (str, signature, publicKey) => {
    let key = secp256k1EC.keyFromPublic(publicKey)
    return key.verify(Buffer.from(Crypto.hash(str)), signature)
  },

  decodeTx: (txHash) => {
    let decodedTx = Crypto.decodeBase58Check (txHash.split ('$')[1])
    return msgpack.decode (Buffer.from (decodedTx, 'hex'), {codec: codec})
  },

  encodeTx: (txData) => {
    let encodedTxData = msgpack.encode (txData, {codec: codec})
    let encodedTx = Crypto.encodeBase58Check (Buffer.from (encodedTxData))
    return `tx$${encodedTx}`
  }

}

Crypto.HDWallet = HDWallet

module.exports = Crypto
