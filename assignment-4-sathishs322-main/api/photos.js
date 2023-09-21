/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const multer = require("multer")
const crypto = require("node:crypto")
const fs = require("node:fs/promises")
const { connectToRabbitMQ, getChannel } = require('../lib/rabbitmq')
const sharp = require('sharp');

const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById,
    saveImageFile,
    getImageInfoById,
    getImageDownloadStreamByFilename,getImageDownloadStreamByFilenameThumbs,getImageInfoByIdThumbs

} = require('../models/photo')

const router = Router()
const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})
 router.post("/", upload.single("image"), async function (req, res, next) {
        console.log("  -- req.file:", req.file)
        console.log("  -- req.body:", req.body)
        if (req.file && req.body && req.body.businessId) {
            const image = {
                contentType: req.file.mimetype,
                filename: req.file.filename,
                path: req.file.path,
                businessId: req.body.businessId,
                caption:req.body.caption
            }
            //const id = await saveImageInfo(image)
            const id = await saveImageFile(image)
            // Delete image from uploads/
            const channel = getChannel()
                channel.sendToQueue("images", Buffer.from(id.toString()))
                await fs.unlink(req.file.path)
    
            res.status(200).send({
                id: id
            })
        } else {
            res.status(400).send({
                err: "Invalid file"
            })
        }
    })
    

router.get('/:id', async (req, res, next) => {
    try {
        const image = await getImageInfoById(req.params.id)
        if (image) {
            const resBody = {
                _id: image._id,
                contentType: image.metadata.contentType,
                userId: image.metadata.userId,
                url: `/media/photos/${image._id}.${imageTypes[image.metadata.contentType]}`,
                thumbs:`/media/thumbs/${image._id}.jpg`
            }
            res.status(200).send(resBody)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
 })

router.get("/media/photos/:id.jpg",  async function (req, res, next) {
    const result= await getImageInfoById(req.params.id)
    getImageDownloadStreamByFilename(result.filename)
        .on("error", function (err) {
            if (err.code === "ENOENT") {
                next()
            } else {
                next(err)
            }
        })
        .on("file", function (file) {
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})


router.get("/media/photos/:id.png",  async function (req, res, next) {
    const result= await getImageInfoById(req.params.id)
    getImageDownloadStreamByFilename(result.filename)
        .on("error", function (err) {
            if (err.code === "ENOENT") {
                next()
            } else {
                next(err)
            }
        })
        .on("file", function (file) {
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})

router.get("/media/thumbs/:id.jpg",  async function (req, res, next) {
   // const result= await getImageInfoByIdThumbs(req.params.id)
      const file = req.params.id + '.jpg';
   try {
    const imageStream = getImageDownloadStreamByFilenameThumbs(file);
    const resizeStream = sharp()
      .resize(100, 100)
      .jpeg();

    res.status(200).type('image/jpeg');

    imageStream
      .on('error', function (err) {
        if (err.code === 'ENOENT') {
          next();
        } else {
          next(err);
        }
      })
      .pipe(resizeStream)
      .pipe(res);
  } catch (err) {
    next(err);
  }
    
})


module.exports = router
