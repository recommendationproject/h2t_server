const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteOrder = require('./orderPrivate');

router.get('/byuser', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT o.id, o.customer_id, c.name, o.status status_id, s.status, o.israting FROM orders o, customer c, status s where o.customer_id = c.id and o.status = s.id and customer_id = ? order by o.status`, [req.headers.id]);
    res.json(rs);
  });

  router.get('/detailbyuser', async (req, res, next) => {    
    let rs = await dbs.execute(`SELECT od.id odid, od.order_id, p.id, od.product_id, od.amount, p.name, p.price, i.images, od.rating FROM order_detail od, product p, images i WHERE i.product_id = p.id and od.product_id = p.id and od.order_id = ? group by i.product_id having min(i.id)`, [req.headers.id]);
    res.json(rs);
  });

  router.post('/rating', async (req, res, next) => {   
      
      let sql = 'update order_detail set rating = ( case';
        req.body.value.forEach(e => {
            sql += ` when id = ${e.odid} then ${e.rating} `
        });
        sql += `end) where order_id = '${req.body.value[0].order_id}'`        
     let rs = await dbs.execute(sql, []);
     let rs2 = await dbs.execute('update orders set israting = 1 where id = ?', [req.body.value[0].order_id]);
    res.json(rs2);
  });
privateRouteOrder(router);

module.exports = router;
