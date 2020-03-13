const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
  // auth(router, 'product');

  router.get('/admin', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT p.id, p.name, p.price, p.amount, i.images, p.category_id, p.description, p.status, c.name cate_name, c.gender FROM product p, images i, category c where i.product_id = p.id and c.id = p.category_id group by i.product_id having min(i.id) order by p.id desc`, []);
    res.json(rs);
  });

  router.post('/', async (req, res, next) => {
    const product_id = await dbs.getNextID('product', 'id');
    let rs = await dbs.execute(`insert into product(id, name, price, amount, description, category_id) values(?,?,?,?,?,?)`, [product_id, req.body.name, parseInt(req.body.price), parseInt(req.body.amount), req.body.description, req.body.category_id]);
    let bind = [];
    req.body.img.forEach(element => {
      bind.push([product_id, element])
    });
    await dbs.execute(`insert into images(product_id, images) values ?`, [bind]);
    res.json(rs);
  });

  router.get('/delete', async (req, res, next) => {
    let rs = await dbs.execute(`update product set status = ? where product_id = ?`, [req.body.status, req.body.product_id]);
    res.json(rs);
  });
};
