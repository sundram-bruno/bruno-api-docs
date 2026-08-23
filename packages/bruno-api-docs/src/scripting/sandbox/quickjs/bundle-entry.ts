import { expect, assert } from 'chai';
import { Buffer } from 'buffer';
import moment from 'moment';
import btoa from 'btoa';
import atob from 'atob';
import CryptoJS from 'crypto-js';
import tv4 from 'tv4';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as uuid from 'uuid';
import * as nanoid from 'nanoid';
import path from 'path-browserify';
import jwt from './lib/jwt';

(globalThis as any).expect = expect;
(globalThis as any).assert = assert;
(globalThis as any).moment = moment;
(globalThis as any).btoa = btoa;
(globalThis as any).atob = atob;
(globalThis as any).Buffer = Buffer;
(globalThis as any).tv4 = tv4;
(globalThis as any).Ajv = Ajv;
(globalThis as any).addFormats = addFormats;
(globalThis as any).uuid = uuid;
(globalThis as any).nanoid = nanoid;
(globalThis as any).path = path;
(globalThis as any).jwt = jwt;

(globalThis as any).requireObject = {
  ...((globalThis as any).requireObject || {}),
  'chai': { expect, assert },
  'moment': moment,
  'buffer': { Buffer },
  'btoa': btoa,
  'atob': atob,
  'crypto-js': CryptoJS,
  'tv4': tv4,
  'ajv': Ajv,
  'ajv-formats': addFormats,
  'uuid': uuid,
  'nanoid': nanoid,
  'path': path,
  'jsonwebtoken': jwt
};
