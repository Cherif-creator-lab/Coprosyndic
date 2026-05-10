const Jimp = require('jimp');

async function removeBg() {
  const image = await Jimp.read('C:\\Users\\Aliaspieces\\.gemini\\antigravity\\brain\\857ab27c-72b3-4269-b7d2-11b7ad762c10\\media__1775571335643.png');
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // white threshold
    if (r > 230 && g > 230 && b > 230) {
       this.bitmap.data[idx + 3] = 0; // alpha
    }
  });
  
  await image.writeAsync('C:\\Users\\Aliaspieces\\.gemini\\antigravity\\brain\\9f8c8f63-88a4-46f3-b2e6-c14924ee1fe7\\demo\\coprosync\\src\\assets\\logo.png');
  console.log('Done rendering transparent logo');
}
removeBg();
