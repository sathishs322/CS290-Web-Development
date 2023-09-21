const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Review, ReviewClientFields } = require('../models/review')

const router = Router()


const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const secretKey = "SuperSecret"
const {  requireAuthentication } = require("../lib/auth")

/*
 * Route to create a new review.
 */
router.post('/', requireAuthentication,async function (req, res, next) {
  console.log(req.user)
  console.log(req.body.userId)
  if((req.body.userId&&req.user==req.body.userId)||req.admin==true){
  try {
    const review = await Review.create(req.body, ReviewClientFields)
    res.status(201).send({ id: review.id })
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
 * Route to fetch info about a specific review.
 */
router.get('/:reviewId', async function (req, res, next) {
  const reviewId = req.params.reviewId
  try {
    const review = await Review.findByPk(reviewId)
    if (review) {
      res.status(200).send(review)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

/*
 * Route to update a review.
 */
router.patch('/:reviewId', requireAuthentication,async function (req, res, next) {
  const reviewId = req.params.reviewId
  const rev = await Review.findOne({ where: {id:reviewId }})
  if((rev.userId&&req.user==rev.userId)||req.admin==true){
  try {
    /*
     * Update review without allowing client to update businessId or userId.
     */
    const result = await Review.update(req.body, {
      where: { id: reviewId },
      fields: ReviewClientFields.filter(
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
 * Route to delete a review.
 */
router.delete('/:reviewId', requireAuthentication,async function (req, res, next) {
  const reviewId = req.params.reviewId
  const rev = await Review.findOne({ where: {id:reviewId }})
  if((rev.userId&&req.user==rev.userId)||req.admin==true){
  try {
    const result = await Review.destroy({ where: { id: reviewId }})
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
