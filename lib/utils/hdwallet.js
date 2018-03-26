const Mnemonic = require('bitcore-mnemonic')
const bitcore = require('bitcore-lib')
const crypto = require('./crypto')

class HdWallet {
  // this is heavily "inspired" by https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/keystore.js
  constructor (hdPath, mnemonic) {
    let words = mnemonic.split(' ')
    if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12){
      throw new Error('HdWallet: Invalid mnemonic')
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

  static async createHdWallet (hdPath, mnemonic, initialAddresses = 0) {
    const hdWallet = new HdWallet(hdPath, mnemonic)
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
}

module.exports = HdWallet
