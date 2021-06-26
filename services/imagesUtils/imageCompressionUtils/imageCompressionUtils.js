const impCmp = require('compress-images/promise');
const fs = require('fs');

const copyImgFile = async (src, dest) => {
    var res = {
        error: null,
        data: null,
        status: null
    };
    var cpFileRes;
    try {
        cpFileRes = await fs.promises.copyFile(src, dest);
        res.data = cpFileRes;
        res.status = 1;
    }
    catch (err) {
        res.error = err;
        res.status = 0;
    }

    return res;
}

const compress = async (inPath, outPath, maxSize=300, minSize=250) => {
    var res = {
        error: null,
        data: null,
        status: null
    };

    var imgFile = fs.readFileSync(inPath);
    if (imgFile.length > (maxSize * 1024)) {
        var imgCmpPerMin = minSize * 1024 * 100 / imgFile.length;
        var imgCmpPerMax = maxSize * 1024 * 100 / imgFile.length;

        if ((imgCmpPerMax > 100) || (imgCmpPerMin > 100)) {
            var cpFileRes = await copyImgFile(inPath, outPath);
            res.data = {
                type: 1,
                new_size: imgFile.length,
                old_size: imgFile.length,
                per: 100
            };
            res.status = 1;
        }
        else {
            var imgCmpRes
            try {
                imgCmpRes = await impCmp.compress({
                    source: inPath,
                    destination: outPath,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '' + ((imgCmpPerMax + imgCmpPerMin) / 2) + ''] },
                        png: { engine: 'pngquant', command: ['--quality=' + imgCmpPerMin + '-' + imgCmpPerMax + '', '-o'] },
                    }
                });
            }
            catch (err) {
                res.error = err;
                res.status = 0;
            }

            if (imgCmpRes) {
                if (imgCmpRes.errors[0]) {
                    res.error = imgCmpRes.errors;
                    res.status = 0;
                }
                else {
                    if (imgCmpRes.statistics[0]) {
                        res.data = {
                            type: 0,
                            old_size: imgCmpRes.statistics[0].size_in,
                            new_size: imgCmpRes.statistics[0].size_output,
                            per: (100 - imgCmpRes.statistics[0].percent)
                        };
                        res.status = 1;
                    }
                    else {
                        res.data = {
                            type: 0
                        };
                        res.status = 1;
                    }
                }
            }
            else {
                res.data = {
                    type: 0
                };
                res.status = 1;
            }

        }
    }
    else {
        var pathParts = inPath.split('/');
        var cpFileRes = await copyImgFile(inPath, outPath + "/" + pathParts[pathParts.length - 1]);
        if (cpFileRes.error) {
            res.error = cpFileRes.error;
            res.status = 0;
        }
        else {
            res.data = {
                type: 1,
                new_size: imgFile.length,
                old_size: imgFile.length,
                per: 100.0
            };
            res.status = 1;
        }
    }

    return res;
}

module.exports = {
    compress: compress,
    copyImgFile: copyImgFile
};