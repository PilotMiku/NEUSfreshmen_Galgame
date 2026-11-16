import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);

// cwebp decodes JPEG pixels without applying EXIF orientation. Bake the transform
// before encoding, then omit EXIF from WebP so all browsers display the same pixels.
export function jpegOrientation(bytes){
  if(bytes.readUInt16BE(0)!==0xffd8)return 1;
  for(let offset=2;offset+4<bytes.length;){
    if(bytes[offset]!==0xff)break;
    const marker=bytes[offset+1];if(marker===0xda||marker===0xd9)break;
    const length=bytes.readUInt16BE(offset+2);if(length<2)break;
    if(marker===0xe1&&bytes.toString('ascii',offset+4,offset+10)==='Exif\0\0'){
      const start=offset+10,little=bytes.toString('ascii',start,start+2)==='II';
      const u16=at=>little?bytes.readUInt16LE(at):bytes.readUInt16BE(at);
      const u32=at=>little?bytes.readUInt32LE(at):bytes.readUInt32BE(at);
      const directory=start+u32(start+4);
      for(let i=0;i<u16(directory);i++){
        const entry=directory+2+i*12;
        if(u16(entry)===0x112)return u16(entry+8);
      }
    }
    offset+=length+2;
  }
  return 1;
}

export async function withOrientedPhoto(source,action){
  const orientation=jpegOrientation(await readFile(source));
  const transforms={2:['-flip','horizontal'],3:['-rotate','180'],4:['-flip','vertical'],5:['-transpose'],6:['-rotate','90'],7:['-transverse'],8:['-rotate','270']};
  if(!transforms[orientation])return action(source);
  const directory=await mkdtemp(join(tmpdir(),'xinsheng-photo-'));
  const corrected=join(directory,'oriented.jpg');
  try{
    await run('jpegtran',['-copy','all',...transforms[orientation],'-outfile',corrected,source]);
    return await action(corrected);
  }finally{await rm(directory,{recursive:true,force:true});}
}
