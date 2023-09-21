const amqp = require("amqplib")
const { connectToDb } = require("./lib/mongo")
const sharp = require('sharp')
const rabbitMqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitMqUrl = `amqp://${rabbitMqHost}`
const { getDownloadStreamById,updateImageTagsById } = require("./models/photo")
const { getDbReference } = require('./lib/mongo')
const {GridFSBucket } = require('mongodb')


connectToDb( async function () {
    try {
        const db = getDbReference()
   const thumbnailBucket = new GridFSBucket(db, { bucketName: 'thumbs'});
    const connection = await amqp.connect(rabbitMqUrl) 
    const channel = await connection.createChannel(); 
    await channel.assertQueue("images")
    channel.consume("images", msg => {
    if (msg) {
        const id = msg.content.toString()
        const downloadStream = getDownloadStreamById(id)
        const writeStream = sharp()
        .resize(100,100 )
        .jpeg()
        .pipe(thumbnailBucket.openUploadStream(id + '.jpg'));
        downloadStream.pipe(writeStream);
        const thumbnailFilename = writeStream.id.toString() + '.jpg';
        updateImageTagsById(id,thumbnailFilename)
    }
    channel.ack(msg)    
    })
    }catch (err) {
    console.error(err)
    }
})
