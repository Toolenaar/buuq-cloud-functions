"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const os_1 = require("os");
const path_1 = require("path");
const sharp = require("sharp");
const fs = require("fs-extra");
const context_1 = require("../logic/context");
//https://angularfirebase.com/lessons/image-thumbnail-resizer-cloud-function/
exports.onImageAdded = functions.storage.object().onFinalize((object, context) => __awaiter(this, void 0, void 0, function* () {
    // https://www.youtube.com/watch?v=YGsmWKMMiYs
    const bucket = context_1.default.storage.bucket(object.bucket);
    const filePath = object.name;
    const fileName = filePath.split('/').pop();
    const bucketDir = path_1.dirname(filePath);
    const workingDir = path_1.join(os_1.tmpdir(), 'thumbs');
    const tmpFilePath = path_1.join(workingDir, 'source.png');
    if (fileName.includes('size@') || !object.contentType.includes('image')) {
        console.log('file already resized');
        return null;
    }
    // 1. Ensure thumbnail dir exists
    yield fs.ensureDir(workingDir);
    // 2. Download Source File
    yield bucket.file(filePath).download({
        destination: tmpFilePath
    });
    // 3. Resize the images and define an array of upload promises
    const sizes = [128, 512];
    const uploadPromises = sizes.map((size) => __awaiter(this, void 0, void 0, function* () {
        const thumbName = `size@${size}_${fileName}`;
        const thumbPath = path_1.join(workingDir, thumbName);
        // Resize source image
        yield sharp(tmpFilePath)
            .resize(size, size)
            .toFile(thumbPath);
        // Upload to GCS
        return bucket.upload(thumbPath, {
            destination: path_1.join(bucketDir, thumbName)
        });
    }));
    // 4. Run the upload operations
    yield Promise.all(uploadPromises);
    // 5. Cleanup remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir);
}));
//# sourceMappingURL=image.functions.js.map