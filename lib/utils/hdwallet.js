const Mnemonic = require('bitcore-mnemonic')
const bitcore = require('bitcore-lib')
const crypto = require('./crypto')
const bs58check = require ('bs58check')

class HdWallet {
  // this is heavily "inspired" by https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/keystore.js
  // ideally all "secret" stuff like mnemonic, hdRoot, hdRootKey, hdPathKey and generated private keys should
  // only be stored encrypted and only be decrypted if needed
  constructor (hdPath, mnemonic, client) {
    let words = mnemonic.split(' ')
    if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12){
      throw new Error('HdWallet: Invalid mnemonic')
    }
    this.client = client
    this.hdPath = hdPath
    this.mnemonic = mnemonic
    this.hdIndex = 0
    this.addresses = []
  }

  async init () {
    // async init function, currently nothing async happens but at one point
    // it did and it might do again
    this.hdRoot = new Mnemonic(this.mnemonic).toHDPrivateKey().xprivkey
    this.hdRootKey = new bitcore.HDPrivateKey(this.hdRoot)
    this.hdPathKey = this.hdRootKey.derive(this.hdPath).xprivkey
  }

  static async createHdWallet (hdPath, mnemonic, client, initialAddresses = 0) {
    const hdWallet = new HdWallet(hdPath, mnemonic, client)
    await hdWallet.init()
    if (initialAddresses > 0) {
      hdWallet.generateNewAddress(initialAddresses)
    }
    return hdWallet
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
        privkeyHex = HdWallet.leftPadString(privkeyBuf.toString('hex'), '0', 64)
      }
      else if (privkeyBuf.length > 32) {
        throw new Error('Private key larger than 32 bytes. Aborting!')
      }
      keys.push(privkeyHex)
    }
    return keys
  }

  computeAddressFromPrivKey (privKey) {
    let keyPair = crypto.ec.genKeyPair()
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

  async spend (from, to, amount, fee = undefined) {
    if (!this.client) {
      throw new Exception('Client not set')
    }
    const senderKeyPair = this.getKeypairOfPubkey(from)
    if (!senderKeyPair) {
      throw new Error('sender not found in wallet')
    }
    const options = {
      fee
    }
    return await this.client.base.spend(to, amount, senderKeyPair, options)
  }

  getKeypairOfPubkey (pubKey) {
    return this.addresses.find(address => {
      return address.pub === pubKey
    })
  }
}

module.exports = HdWallet
