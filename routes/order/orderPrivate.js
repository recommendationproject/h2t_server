const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
  // auth(router, 'order');

  router.get('/', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT o.id, o.customer_id, c.name, o.status status_id, s.status FROM orders o, customer c, status s where o.customer_id = c.id and o.status = s.id  union all SELECT o.id, o.customer_id, c.name, o.status status_id, s.status FROM orders o, guest c, status s where o.customer_id = c.id and o.status = s.id order by status_id`, []);
    res.json(rs);
  });

  router.get('/detail', async (req, res, next) => {    
    let rs = await dbs.execute(`SELECT p.id, od.product_id, od.amount, p.name, p.price, i.images FROM order_detail od, product p, images i WHERE i.product_id = p.id and od.product_id = p.id and od.order_id = ? group by i.product_id having min(i.id)`, [req.headers.id]);
    res.json(rs);
  });

  router.post('/status', async (req, res, next) => {        
    let rs = await dbs.execute(`update orders set status = ? where id = ?`, [req.headers.status, req.headers.id]);
    res.json(rs);
  });
};
