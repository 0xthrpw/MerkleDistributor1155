var Distribution = require('../distribution');
var balances = require('../meta/balances.json');

let distribution = new Distribution(balances);
console.log(JSON.stringify(distribution.getMerkleTree()));
