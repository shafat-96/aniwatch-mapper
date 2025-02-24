import axios from 'axios';
import { HEADERS } from './constants.js';

export const client = axios.create({
  timeout: 20000,
  headers: {
    'Accept-Encoding': 'gzip',
    ...HEADERS
  }
});
