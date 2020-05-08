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
    let rs = await dbs.execute(`insert into product(id, name, price, amount, description, category_id) values(?,?,?,?,?,?)`, [product_id, req.body.name, parseInt(req.body.price), 0, req.body.description, req.body.category_id]);
    let bind = [];
    req.body.img.forEach(element => {
      bind.push([product_id, element])
    });
    await dbs.execute(`insert into images(product_id, images) values ?`, [bind]);
    if (rs.affectedRows > 0) {
      let rsProduct = await dbs.execute('SELECT p.id, p.name, p.price, p.amount, i.images, p.category_id, p.description, p.status, c.name cate_name, c.gender FROM product p, images i, category c where i.product_id = p.id and c.id = p.category_id group by i.product_id having min(i.id) order by p.id desc and p.id = ?', [product_id]);
      res.json({ type: 'success', msg: 'Thêm sản phẩm thành công !', product: rsProduct });
    } else {
      res.json({ type: 'error', msg: 'Thêm sản phẩm không thành công !' });
    }
  });

  router.put('/', async (req, res, next) => {
    let rs = await dbs.execute(`update product set name = ?, price = ?, description = ?, category_id = ? where id =?`, [req.body.name, parseInt(req.body.price), req.body.description, req.body.category_id, req.body.id]);
    let bind = [];
    req.body.img.forEach(element => {
      bind.push([req.body.id, element])
    });
    await dbs.execute(`delete from images where product_id= ?`, [req.body.id]);
    await dbs.execute(`insert into images(product_id, images) values ?`, [bind]);
    if (rs.affectedRows > 0) {
      let rsProduct = await dbs.execute('SELECT p.id, p.name, p.price, p.amount, i.images, p.category_id, p.description, p.status, c.name cate_name, c.gender FROM product p, images i, category c where i.product_id = p.id and c.id = p.category_id group by i.product_id having min(i.id) order by p.id desc and p.id = ?', [req.body.id]);
      res.json({ type: 'success', msg: 'Sửa sản phẩm thành công !', product: rsProduct[0] });
    } else {
      res.json({ type: 'error', msg: 'Sửa sản phẩm không thành công !' });
    }
  });

  router.get('/delete', async (req, res, next) => {
    let rs = await dbs.execute(`update product set status = ? where product_id = ?`, [req.body.status, req.body.product_id]);
    res.json(rs);
  });

  router.get('/recommend', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT r.user_id, c.name user_name, r.product_id, p.name product_name, r.val, r.create_date FROM recommend_product r, product p, customer c where r.product_id = p.id and r.user_id = c.id order by r.user_id, val desc`, []);
    res.json(rs);
  });

  router.get('/img', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT images from images where product_id = ?`, [req.headers.id]);
    res.json(rs);
  });
};
