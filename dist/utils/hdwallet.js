var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _asyncToGenerator = require("@babel/runtime/helpers/asyncToGenerator");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

var Mnemonic = require('bitcore-mnemonic');

var bitcore = require('bitcore-lib');

var crypto = require('./crypto');

var bs58check = require('bs58check');

var HdWallet =
/*#__PURE__*/
function () {
  // this is heavily "inspired" by https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/keystore.js
  // ideally all "secret" stuff like mnemonic, hdRoot, hdRootKey, hdPathKey and generated private keys should
  // only be stored encrypted and only be decrypted if needed
  function HdWallet(hdPath, mnemonic, client) {
    _classCallCheck(this, HdWallet);

    var words = mnemonic.split(' ');

    if (!Mnemonic.isValid(mnemonic, Mnemonic.Words.ENGLISH) || words.length !== 12) {
      throw new Error('HdWallet: Invalid mnemonic');
    }

    this.client = client;
    this.hdPath = hdPath;
    this.mnemonic = mnemonic;
    this.hdIndex = 0;
    this.addresses = [];
  }

  _createClass(HdWallet, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // async init function, currently nothing async happens but at one point
                // it did and it might do again
                this.hdRoot = new Mnemonic(this.mnemonic).toHDPrivateKey().xprivkey;
                this.hdRootKey = new bitcore.HDPrivateKey(this.hdRoot);
                this.hdPathKey = this.hdRootKey.derive(this.hdPath).xprivkey;

              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function init() {
        return _init.apply(this, arguments);
      };
    }()
  }, {
    key: "generateNewAddress",
    value: function generateNewAddress(n) {
      var keys = this.generatePrivateKeys(n);

      for (var i = 0; i < n; i++) {
        var address = this.computeAddressFromPrivKey(keys[i]);
        this.addresses.push(address);
      }
    }
  }, {
    key: "generatePrivateKeys",
    value: function generatePrivateKeys(n) {
      var keys = [];

      for (var i = 0; i < n; i++) {
        var hdprivkey = new bitcore.HDPrivateKey(this.hdPathKey).derive(this.hdIndex++);
        var privkeyBuf = hdprivkey.privateKey.toBuffer();
        var privkeyHex = privkeyBuf.toString('hex');

        if (privkeyBuf.length < 16) {
          throw new Error('Private key suspiciously small: < 16 bytes. Aborting!');
        } else if (privkeyBuf.length < 32) {
          privkeyHex = HdWallet.leftPadString(privkeyBuf.toString('hex'), '0', 64);
        } else if (privkeyBuf.length > 32) {
          throw new Error('Private key larger than 32 bytes. Aborting!');
        }

        keys.push(privkeyHex);
      }

      return keys;
    }
  }, {
    key: "computeAddressFromPrivKey",
    value: function computeAddressFromPrivKey(privKey) {
      var keyPair = crypto.ec.genKeyPair();

      keyPair._importPrivate(privKey, 'hex');

      var binaryPublic = keyPair.getPublic();
      var publicKeyBuffer = Buffer.from(binaryPublic.encode());
      var pubKeyAddress = bs58check.encode(publicKeyBuffer);
      var privKeyAddress = keyPair.getPrivate('hex');
      return {
        pub: "ak$".concat(pubKeyAddress),
        priv: privKeyAddress
      };
    }
  }, {
    key: "spend",
    value: function () {
      var _spend = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee2(from, to, amount) {
        var fee,
            senderKeyPair,
            options,
            _args2 = arguments;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                fee = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : undefined;

                if (this.client) {
                  _context2.next = 3;
                  break;
                }

                throw new Exception('Client not set');

              case 3:
                senderKeyPair = this.getKeypairOfPubkey(from);

                if (senderKeyPair) {
                  _context2.next = 6;
                  break;
                }

                throw new Error('sender not found in wallet');

              case 6:
                options = {
                  fee: fee
                };
                _context2.next = 9;
                return this.client.base.spend(to, amount, senderKeyPair, options);

              case 9:
                return _context2.abrupt("return", _context2.sent);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function spend(_x, _x2, _x3) {
        return _spend.apply(this, arguments);
      };
    }()
  }, {
    key: "getKeypairOfPubkey",
    value: function getKeypairOfPubkey(pubKey) {
      return this.addresses.find(function (address) {
        return address.pub === pubKey;
      });
    }
  }], [{
    key: "createHdWallet",
    value: function () {
      var _createHdWallet = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee3(hdPath, mnemonic, client) {
        var initialAddresses,
            hdWallet,
            _args3 = arguments;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                initialAddresses = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : 0;
                hdWallet = new HdWallet(hdPath, mnemonic, client);
                _context3.next = 4;
                return hdWallet.init();

              case 4:
                if (initialAddresses > 0) {
                  hdWallet.generateNewAddress(initialAddresses);
                }

                return _context3.abrupt("return", hdWallet);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function createHdWallet(_x4, _x5, _x6) {
        return _createHdWallet.apply(this, arguments);
      };
    }()
  }, {
    key: "generateRandomSeed",
    value: function generateRandomSeed() {
      var seed = new Mnemonic(Mnemonic.Words.ENGLISH);
      return seed.toString();
    }
  }, {
    key: "leftPadString",
    value: function leftPadString(stringToPad, padChar, length) {
      var repreatedPadChar = '';

      for (var i = 0; i < length; i++) {
        repreatedPadChar += padChar;
      }

      return (repreatedPadChar + stringToPad).slice(-length);
    }
  }]);

  return HdWallet;
}();

module.exports = HdWallet;