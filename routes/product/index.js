const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteProduct = require('./productPrivate');



/* GET home page. */
router.get('/', async (req, res, next) => {
  let rs =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id and p.status=1 group by i.product_id having min(i.id) order by p.id desc limit 6`,[]);
  res.json(rs);
});

/* GET home page. */
router.get('/detail', async (req, res, next) => {
  let product =await dbs.execute(`SELECT * FROM product where id = ?`,[req.headers.id]);
  let images =await dbs.execute(`SELECT images 'original', images 'thumbnail' FROM images where product_id = ?`,[req.headers.id]);
  res.json({product: product[0], images: images});
});

privateRouteProduct(router);

module.exports = router;
