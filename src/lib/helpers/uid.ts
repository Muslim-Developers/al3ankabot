// Taken from https://github.com/lukeed/uid/
let IDX = 36;
let HEX = '';
while (IDX--) HEX += IDX.toString(36);

export function uid(len = 8) {
  let str = '';
  while (len--) str += HEX[(Math.random() * 36) | 0];
  return str;
}
