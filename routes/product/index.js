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
  let rsRecommend = [];
  if(req.headers.userid){
     rsRecommend =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id and p.status=1 and p.id in (select product_id from recommend_product where user_id = ? order by val desc) group by i.product_id having min(i.id) order by p.id desc limit 8`,[req.headers.userid]);
  }
  let rsNew =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id and p.status=1 group by i.product_id having min(i.id) order by p.id desc limit 8`,[]);
  let rsHot =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id and p.status=1 and p.id in (SELECT product_id from order_detail group by product_id order by COUNT(*) desc) group by i.product_id having min(i.id) limit 8`,[]);
  res.json({new: rsNew, hot: rsHot, recommend: rsRecommend});
});

router.get('/recommendbyid/:id', async (req, res, next) => {
  let rsRecommend = [];
  
     rsRecommend =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, recommendproducttogether rpr where i.product_id = p.id and p.status=1 and p.id =rpr.productrecommendid and rpr.productid = '?' group by i.product_id having min(i.id) order by rpr.val desc`,[req.params.id]);
 
  res.json({recommend: rsRecommend});
});

/* GET home page. */
router.post('/history', async (req, res, next) => {
  console.log(req.body.lst);
  
  let rsHistory =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id and p.status=1 and p.id in (?) group by i.product_id having min(i.id) order by p.id desc limit 6`,[req.body.lst]);
  res.json(rsHistory);
});

/* GET home page. */
router.get('/detail', async (req, res, next) => {
  let product =await dbs.execute(`SELECT * FROM product where id = ?`,[req.headers.id]);
  let images =await dbs.execute(`SELECT images 'original', images 'thumbnail' FROM images where product_id = ?`,[req.headers.id]);
  res.json({product: product[0], images: images});
});

privateRouteProduct(router);

module.exports = router;
