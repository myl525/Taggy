import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

async function hashFile(path, algo = 'md5') {
  const hashFunc = createHash(algo);   // you can also sha256, sha512 etc

  const contentStream = createReadStream(path);
  const updateDone = new Promise((resolve, reject) => {
    contentStream.on('data', (data) => hashFunc.update(data));
    contentStream.on('close', resolve);
    contentStream.on('error', reject);
  });

  await updateDone;
  const result =  await hashFunc.digest('hex');       // will return hash, formatted to HEX
  return result;
}

console.log(await hashFile('./changed.txt'));