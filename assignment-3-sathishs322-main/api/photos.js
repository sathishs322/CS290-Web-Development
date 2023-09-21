const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Photo, PhotoClientFields } = require('../models/photo')

const router = Router()

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const secretKey = "SuperSecret"
const {  requireAuthentication } = require("../lib/auth")


/*
 * Route to create a new photo.
 */
router.post('/', requireAuthentication,async function (req, res, next) {
  console.log(req.user)
  console.log(req.body.userId)
  if((req.body.userId&&req.user==req.body.userId)||req.admin==true){
    try {
      const photo = await Photo.create(req.body, PhotoClientFields)
      res.status(201).send({ id: photo.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
  }
  else{
    res.status(500).send({
      error: 'Wrong Auth'
    });
  }
})

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoId', async function (req, res, next) {
  const photoId = req.params.photoId
  try {
    const photo = await Photo.findByPk(photoId)
    if (photo) {
      res.status(200).send(photo)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

/*
 * Route to update a photo.
 */
router.patch('/:photoId', requireAuthentication,async function (req, res, next) {
  const photoId = req.params.photoId
  const pho = await Photo.findOne({ where: {id:photoId }})
  if((pho.userId&&req.user==pho.userId)||req.admin==true){
    try {
      /*
      * Update photo without allowing client to update businessId or userId.
      */
      const result = await Photo.update(req.body, {
        where: { id: photoId },
        fields: PhotoClientFields.filter(
          field => field !== 'businessId' && field !== 'userId'
        )
      })
      if (result[0] > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
  }
  else{
    res.status(500).send({
      error: 'Wrong Auth'
    });
  }
})

/*
 * Route to delete a photo.
 */
router.delete('/:photoId', requireAuthentication,async function (req, res, next) {
  const photoId = req.params.photoId
  const pho = await Photo.findOne({ where: {id:photoId }})
  if((pho.userId&&req.user==pho.userId)||req.admin==true){
  try {
    const result = await Photo.destroy({ where: { id: photoId }})
    if (result > 0) {
      res.status(204).send()
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
}
else{
  res.status(500).send({
    error: 'Wrong Auth'
  });
}
})

module.exports = router
