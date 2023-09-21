const { Router } = require('express')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { Users } = require('../models/users')

const router = Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const secretKey = "SuperSecret"
const { checkAdmin, requireAuthentication } = require("../lib/auth")

router.post('/login', async function (req, res) {
  const email = req.body.email;
  try {
    const user = await Users.findOne({ where: { email: email } });
    console.log(user)
    if (user) {
      const auth = await bcrypt.compare(req.body.password, user.password);
      console.log(user.email)
      console.log(auth)
      if (auth) {
        const payload = { sub: [user.id ,user.admin]};
        const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
        res.status(200).send({
          token: token
        });
      } else {
        res.status(401).send({
          error: 'Invalid authentication credentials'
        });
      }
    } else {
      res.status(401).send({
        error: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).send({
      error: 'Internal server error'
    });
  }
});

router.post('/', checkAdmin,async function (req, res) {
  try {
    // Extract user input from the request body
    const { name, email, password,admin } = req.body;
    if(admin==true){
      if(req.admin==false){
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Not an admin' });
      }
    }
    // Hash and salt the password
    var salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create a new user record in the database
    const newUser = await Users.create({
      name,
      email,
      password: hashedPassword,
      admin
    });
    // Return the newly created user
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId', requireAuthentication,async function (req, res) {
  const userId = req.params.userId
  console.log("user:",req.user)
  console.log("param:",req.params.userId)

  if (req.user == req.params.userId||req.admin==true) {
    try {
      const user = await Users.findOne({ where: { id:userId} });
      if (user) {
            res.status(401).send({
              id: user.id,
              name: user.name,
              email: user.email
            });
      }
      else {
        res.status(401).send({
          error: 'User not found'
        });
      }
    } catch (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
}
  }
else{
  res.status(500).send({
    error: 'ID Mismacth'
  });
}
});

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', requireAuthentication,async function (req, res) {
  const userId = req.params.userId
  console.log("req.user: ",req.user)
  console.log("req.user: ",req.params.userId)
  if (req.user == req.params.userId||req.admin==true) {
    try {
      const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
      res.status(200).json({
        businesses: userBusinesses
      })
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
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews',requireAuthentication, async function (req, res) {
  const userId = req.params.userId
  if (req.user == req.params.userId||req.admin==true) {
    try {
      const userReviews = await Review.findAll({ where: { userId: userId }})
      res.status(200).json({
        reviews: userReviews
      })
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
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', requireAuthentication,async function (req, res) {
  const userId = req.params.userId
  console.log("req.user: ",req.user)
  console.log("req.user: ",req.params.userId)
  if (req.user == req.params.userId||req.admin==true) {
    try {
      const userPhotos = await Photo.findAll({ where: { userId: userId }})
      res.status(200).json({
        photos: userPhotos
      })
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
