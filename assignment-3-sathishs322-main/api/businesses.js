const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Business, BusinessClientFields } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const secretKey = "SuperSecret"
const {  requireAuthentication } = require("../lib/auth")

const router = Router()

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res) {
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1
  page = page < 1 ? 1 : page
  const numPerPage = 10
  const offset = (page - 1) * numPerPage

  try {
    const result = await Business.findAndCountAll({
      limit: numPerPage,
      offset: offset
    })

    /*
     * Generate HATEOAS links for surrounding pages.
     */
    const lastPage = Math.ceil(result.count / numPerPage)
    const links = {}
    if (page < lastPage) {
      links.nextPage = `/businesses?page=${page + 1}`
      links.lastPage = `/businesses?page=${lastPage}`
    }
    if (page > 1) {
      links.prevPage = `/businesses?page=${page - 1}`
      links.firstPage = '/businesses?page=1'
    }

    /*
     * Construct and send response.
     */
    res.status(200).json({
      businesses: result.rows,
      pageNumber: page,
      totalPages: lastPage,
      pageSize: numPerPage,
      totalCount: result.count,
      links: links
    })
  } catch (e) {
    next(e)
  }
})

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication,async function (req, res, next) {
  console.log(req.user)
  console.log(req.body.ownerId)
  if((req.body.ownerId&&req.user==req.body.ownerId)||req.admin==true){
    try {
      const business = await Business.create(req.body, BusinessClientFields)
      res.status(201).send({ id: business.id })
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
 * Route to fetch info about a specific business.
 */
router.get('/:businessId', requireAuthentication,async function (req, res, next) {
  const businessId = req.params.businessId
  try {
    const business = await Business.findByPk(businessId, {
      include: [ Photo, Review ]
    })
    if (business) {
      res.status(200).send(business)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

/*
 * Route to update data for a business.
 */
router.patch('/:businessId',requireAuthentication, async function (req, res, next) {
  const businessId = req.params.businessId
  const bus = await Business.findOne({ where: {id:businessId }})
  if((bus.ownerId&&req.user==bus.ownerId)||req.admin==true){
    try {
      const result = await Business.update(req.body, {
        where: { id: businessId },
        fields: BusinessClientFields
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
 * Route to delete a business.
 */
router.delete('/:businessId', requireAuthentication ,async function (req, res, next) {
  const businessId = req.params.businessId
  const bus = await Business.findOne({ where: {id:businessId }})
  console.log(bus.ownerId)
  console.log(req.user)

  if((bus.ownerId&&req.user==bus.ownerId)||req.admin==true){
    try {
      const result = await Business.destroy({ where: { id: businessId }})
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
