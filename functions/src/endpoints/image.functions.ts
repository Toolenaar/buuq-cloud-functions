import * as functions from 'firebase-functions';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs-extra';
import ctx from '../logic/context';

//https://angularfirebase.com/lessons/image-thumbnail-resizer-cloud-function/
export const onImageAdded = functions.storage.object().onFinalize(async (object, context) => {
    // https://www.youtube.com/watch?v=YGsmWKMMiYs
    const bucket = ctx.storage.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath.split('/').pop();
    const bucketDir = dirname(filePath);

    const workingDir = join(tmpdir(), 'thumbs');
    const tmpFilePath = join(workingDir, 'source.png');

    if (fileName.includes('size@') || !object.contentType.includes('image')) {
        console.log('file already resized');
        return null;
    }

    // 1. Ensure thumbnail dir exists
    await fs.ensureDir(workingDir);

     // 2. Download Source File
     await bucket.file(filePath).download({
        destination: tmpFilePath
      });

      // 3. Resize the images and define an array of upload promises
    const sizes = [128, 512];

    const uploadPromises = sizes.map(async size => {
      const thumbName = `size@${size}_${fileName}`;
      const thumbPath = join(workingDir, thumbName);

      // Resize source image
      await sharp(tmpFilePath)
        .resize(size, size)
        .toFile(thumbPath);

      // Upload to GCS
      return bucket.upload(thumbPath, {
        destination: join(bucketDir, thumbName)
      });
    });

    // 4. Run the upload operations
    await Promise.all(uploadPromises);

    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir);

    
});