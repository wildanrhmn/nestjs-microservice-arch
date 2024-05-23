import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const key = process.env.JWT_SECRET;

const ed = (text: string) => {
  const encrypted = crypto.createHash('md5').update(key).digest('hex');
  let c = 0;
  let v = '';
  for (let i = 0; i < text.length; i++) {
    if (c == encrypted.length) {
      c = 0;
    }
    v += String.fromCharCode(text.substr(i, 1).charCodeAt(0) ^ encrypted.substr(c, 1).charCodeAt(0));
    c++;
  }

  return v;
};

export const decrypt = (text: string) => {
  const normalizedText = text.replace(/garing/g, '/');
  const cipherText = Buffer.from(normalizedText, 'base64').toString('ascii');
  const decrypted = ed(cipherText);
  let rawText = '';
  for (let i = 0; i < text.length; i++) {
    const md5 = decrypted.substr(i, 1);
    i++;
    rawText += String.fromCharCode(decrypted.substr(i, 1).charCodeAt(0) ^ md5.charCodeAt(0));
  }
  return rawText.replace(/[^a-zA-Z0-9!@#$%^&*():\|{};+-_=?/",.~ ]/g, '');
};

export const crypt = (t: string) => {
  const randomm = Math.floor(Math.random() * (32000 - 0 + 1) + 0);
  const r = crypto.createHash('md5').update(randomm.toString()).digest('hex');
  let c = 0;
  let v = '';
  for (let i = 0; i < t.length; i++) {
    if (c == r.length) {
      c = 0;
    }
    v += r.substr(c, 1) + String.fromCharCode(t.substr(i, 1).charCodeAt(0) ^ r.substr(c, 1).charCodeAt(0));
    c++;
  }
  const ret = Buffer.from(ed(v)).toString('base64').replace(/\//g, 'garing');
  return ret;
};

export const decryptPass = (text: string) => {
  const normalizedText = text.replace(/garing/g, '/');
  const cipherText = Buffer.from(normalizedText, 'base64').toString('ascii');
  const decrypted = ed(cipherText);
  let rawText = '';
  for (let i = 0; i < text.length; i++) {
    const md5 = decrypted.substr(i, 1);
    i++;
    rawText += String.fromCharCode(decrypted.substr(i, 1).charCodeAt(0) ^ md5.charCodeAt(0));
  }
  return rawText.replace(/[^a-zA-Z0-9!@#$%^&*():\|{};+-_=?/",.~ ]/g, '');
};