/*
 * Photo schema and data accessor methods.
 */

const { ObjectId,GridFSBucket } = require('mongodb')
const fs = require("node:fs")
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
    businessId: { required: true },
    caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
    photo = extractValidFields(photo, PhotoSchema)
    photo.businessId = ObjectId(photo.businessId)
    const db = getDbReference()
    const collection = db.collection('photos')
    const result = await collection.insertOne(photo)
    return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

exports.saveImageFile = async function (image) {
    return new Promise(function (resolve, reject) {
        const db = getDbReference()
        const bucket = new GridFSBucket(db, { bucketName: "images" })
        const metadata = {
            contentType: image.contentType,
            businessId: image.businessId,
            caption: image.caption
        }
        const uploadStream = bucket.openUploadStream(
            image.filename,
            { metadata: metadata }
        )
        fs.createReadStream(image.path).pipe(uploadStream)
            .on("error", function (err) {
                reject(err)
            })
            .on("finish", function (result) {
                console.log("== write success, result:", result)
                resolve(result._id)
            })
    })
}



/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
    const db = getDbReference()
    const collection = db.collection('photos')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await collection
        .find({ _id: new ObjectId(id) })
        .toArray()
        return results[0]
    }
}
exports.getPhotoById = getPhotoById

exports.getImageInfoById = async function (id) {
    const db = getDbReference()
    // const collection = db.collection('images')
    const bucket = new GridFSBucket(db, { bucketName: "images" })
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await bucket.find({ _id: new ObjectId(id) })
            .toArray()
        console.log("== results:", results)
        // const results = await collection.find({ _id: new ObjectId(id) })
        //     .toArray()
        console.log(results[0].filename)
        return results[0]
    }
}


exports.getImageInfoByIdThumbs = async function (id) {
    console.log("are we getting in here")
    const db = getDbReference()
    console.log(db)
    // const collection = db.collection('images')
    const bucket = new GridFSBucket(db, { bucketName: "thumbs" })
    if (!ObjectId.isValid(id)) {
        console.log("id not valid")
        return null
    } else {
        const results = await bucket.find({ _id: new ObjectId(id) })
            .toArray()
        console.log("== results:", results)
        // const results = await collection.find({ _id: new ObjectId(id) })
        //     .toArray()
        console.log(results[0].filename)
        return results[0]
    }
}

exports.getImageDownloadStreamByFilename = function (filename) {
    console.log("here")
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: "images" })
    return bucket.openDownloadStreamByName(filename)
}

exports.getImageDownloadStreamByFilenameThumbs = function (filename) {
    console.log("here")
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
    return bucket.openDownloadStreamByName(filename)
}

exports.getDownloadStreamById = function (id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'images' })
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        return bucket.openDownloadStream(new ObjectId(id))
    }
}

exports.getDownloadStreamByIdThumbs = function (id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        return bucket.openDownloadStream(new ObjectId(id))
    }
}

exports.updateImageTagsById = async function (id,thumbs) {
    const db = getDbReference()
    const collection = db.collection('images.files')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { "metadata.thumbs":thumbs}}
        )
        return result.matchedCount > 0
    }
}

exports.uploadImage = function (id, filename){


    const db = getDbReference()
    const bucket = new GridFSBucket (db, {bucketName: "thumbs"})
    const metadata = {
        contentType: '/image/jpeg'
    }
    const imgBucket = new GridFSBucket(db, { bucketName: "images" })
    const file =  imgBucket.openDownloadStreamByName(filename)
    
    const sizer  = sharp()
        .resize(100,100)
        .jpeg();

   
    

    const test =  bucket.openUploadStream(
        filename,
        {metadata: metadata}
    ).on('finish', async (result) =>{
        const collection = db.collection("images.files")
        await collection.updateOne(
            {_id: new ObjectId(id) },
            {$set: {"metadata.thumbnailFilename": result.filename}}
        )
    });
    file.pipe(sizer).pipe(test)

    return file
    }