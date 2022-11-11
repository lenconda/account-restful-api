/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const NodeRSA = require('node-rsa');
const fs = require('fs-extra');
const dotenv = require('dotenv');

const config = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env')));
const projectPathname = path.resolve(__dirname, '..');

const targetPathname = path.resolve(projectPathname, config['SIGN_DIRECTORY'] || '.env');
const publicKeyPathname = path.resolve(
    projectPathname,
    config['SIGN_DIRECTORY'] || '.keys',
    config['SIGN_PUBLIC_KEY_FILENAME'] || 'ltac.crt',
);
const privateKeyPathname = path.resolve(
    projectPathname,
    config['SIGN_DIRECTORY'] || '.keys',
    config['SIGN_PRIVATE_KEY_FILENAME'] || 'ltac.key',
);

if (
    fs.existsSync(publicKeyPathname) &&
    fs.existsSync(privateKeyPathname)
) {
    process.exit(0);
}

console.log('Generating RSA key pair...');

const key = new NodeRSA({ b: 256 });
const keyPair = key.generateKeyPair();

if (!fs.existsSync(targetPathname)) {
    fs.mkdirpSync(targetPathname);
}

fs.writeFileSync(publicKeyPathname, keyPair.exportKey('pkcs8-public-pem'));
fs.writeFileSync(privateKeyPathname, keyPair.exportKey('pkcs8-private-pem'));

console.log('[done] RSA key pair generated');
