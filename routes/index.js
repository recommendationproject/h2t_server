const express = require('express');
const router = express.Router();
const dbs = require('../utils/dbs');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const bcrypt = require('bcryptjs');
const { check, validationResult, body } = require('express-validator');

router.post('/signin', async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await dbs.execute('select * from customer where username = ?', [username]);

    if (user[0]) {
      let rs = bcrypt.compareSync(password, user[0].password);
      if (rs) {
        delete user[0].password;
        // let path = await dbs.execute('SELECT gp.path, gp.post, gp.get, gp.put, gp.del from group_permission gp, map_employee_group meg, employee emp where gp.group_id=meg.group_id and meg.employee_id = emp.id and emp.username =  ?',[username]);
        var token = jwt.sign(JSON.parse(JSON.stringify(user[0])), config.secret, { expiresIn: config.expires });
        res.json({ success: true, token: token,user:user[0], expires: new Date(Date.now() + config.expires * 1000) });
      } else {
        res.status(200).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
      }
    } else {
      res.status(200).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
    }
  } catch (error) {
    res.status(200).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
  }
});

router.post('/signup', [
  check('name', 'Tên không được để trống !').notEmpty(),
  check('username', 'Tên đăng nhập không được để trống !').notEmpty(),
  check('pass', 'Mật khẩu không được để trống !').notEmpty(),
  check('pass', 'Mật khẩu tối thiểu 5 ký tự !').isLength({ min: 5 }),
  check('phone', 'Dộ dài số điện thoại không hợp lệ !').isLength({ min: 10 }),
  body('email').custom(async value => {
    let user = await dbs.execute('select * from customer where email = ?', [value])
    if (user[0]) {
      return Promise.reject('Địa chỉ email đã tồn tại !');
    }
  }),
  body('phone').custom(async value => {
    let user = await dbs.execute('select * from customer where phone = ?', [value])
    if (user[0]) {
      return Promise.reject('Số dt đã tồn tại !');
    }
  }),
  body('username').custom(async value => {
    let user = await dbs.execute('select * from customer where username = ?', [value])
    if (user[0]) {
      return Promise.reject('Tên đăng nhập đã tồn tại !');
    }
  }),
  body('pass2').custom((value, { req }) => {
    if (value !== req.body.pass) {
      throw new Error('Mật khẩu không khớp !');
    }
    return true;
  })
], async (req, res) => {

  try {
    // Check Errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(200).json({ errors: errors.array() });
    } else {
      const saltRounds = 10;
      let salt = bcrypt.genSaltSync(saltRounds);
      let pass = bcrypt.hashSync(req.body.pass, salt);
      let sql = `insert into customer(id, name, username, password, address, email, phone) values(?, ?, ?, ?, ?, ?, ?)`;
      let customer_id = await dbs.getNextID('customer', 'id');
      let bind = [customer_id, req.body.name, req.body.username, pass, req.body.address, req.body.email, req.body.phone];
      let rs = await dbs.execute(sql, bind);
      console.log(rs);
      
      res.json(rs)
    }
  } catch (error) {
    //console.log(error);
    res.json({ err: error });
  }

});

router.get('/allcategory', async function (req, res) {
  let rs = await dbs.execute(`select * from category order by gender`, []);
  res.json(rs);
});

router.get('/categoryGroupByGender', async function (req, res) {
  let rs = await dbs.execute(`select * from category order by gender`, []);
  var groups = {};
  for (var i = 0; i < rs.length; i++) {
    var groupName = rs[i].gender;
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push({ id: rs[i].id, name: rs[i].name });
  }
  let returns = [];
  for (var gr in groups) {
    const getGr = rs.find(r => r.gender === gr);
    returns.push({ group: gr, group_eng: getGr.gender_eng, items: groups[gr] });
  }
  res.json(returns);
});

router.get('/category/:type/:categoryId', async function (req, res) {  
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  let type = req.params.type==='type' ? 'c.gender_eng':'c.id';
  let cateName = req.params.type==='type' ? 'c.gender':'c.name';
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id and ?? = ? group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [type, req.params.categoryId, limit, offset]);
  let rsAll = await dbs.execute(`SELECT count(*) totalRow FROM product p, category c where p.status=1 and p.category_id = c.id and ?? = ?`, [type, req.params.categoryId]);
  let cateNameRs =  await dbs.execute(`SELECT distinct ?? name FROM category c where ?? = ? `, [cateName,type, req.params.categoryId]);  
  res.json({data:rs, currentPage:page, totalPage: Math.ceil(rsAll[0].totalRow/limit), cateName: cateNameRs[0].name});
});

router.post('/search', async function (req, res) {  
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id and p.name like CONCAT('%', ?,  '%') group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [req.body.keyword, limit, offset]);  
  let rsAll = await dbs.execute(`SELECT count(*) + 0 totalRow FROM product p where p.name like CONCAT('%', ?,  '%')`, [req.body.keyword]);
  console.log(rs);
  
  res.json({data:rs, currentPage:page, totalPage: Math.ceil(rsAll[0].totalRow/limit), cateName: req.body.keyword});
});

router.get('/listProduct/:type', async function (req, res) {
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  // let type = req.params.type==='type' ? 'c.gender_eng':'c.id';
  let cateName = req.params.type==='new' ? 'NEW':'SALE';
  let rs = [];
  let rsAll = [];
  if(req.params.type==='sale'){
    rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images, p.price - (p.price/100*d.promotiontypeid) discountprice FROM discount d, product p, images i, category c where d.product_id = p.id  and i.product_id = p.id and p.status=1 and p.category_id = c.id group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [limit, offset]);    
    rsAll = await dbs.execute(`SELECT count(*) totalRow FROM discount d, product p, images i, category c where d.product_id = p.id  and i.product_id = p.id and p.status=1 and p.category_id = c.id group by i.product_id having min(i.id) order by p.id desc`, []);
  } else{
    rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [limit, offset]);
    rsAll = await dbs.execute(`SELECT count(*) totalRow FROM product p, category c where p.status=1 and p.category_id = c.id`, []);
  }
  res.json({data:rs, currentPage:page, totalPage: Math.ceil(rsAll[0].totalRow/limit), cateName: cateName});
});

router.get('/recommentBySupp/:suppid', async function (req, res) {  
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id and p.suppid = ? group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [req.params.suppid, limit, offset]);  
  res.json(rs);
});

router.get('/recommentByPrice/:price', async function (req, res) {  
  let fprice = parseInt(req.params.price)-50000;  
  let tprice = parseInt(req.params.price)+50000;
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id and p.price between ? and ? group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [fprice, tprice, limit, offset]);  
  res.json(rs);
});

router.post('/addCart', async function (req, res) {
  // console.log(req.body);
  // res.json('');
  let check = await dbs.execute(`select * from  cart where product_id= ? and customer_id= ?`, [req.body.product_id, req.body.customer_id]);
  let rs = null;
  if(check.length > 0){
   rs = await dbs.execute(`update cart set amount = ? where product_id= ? and customer_id= ? and size = ? and color = ?`, [check[0].amount+req.body.amount, req.body.product_id, req.body.customer_id, req.body.size, req.body.color]);
  }else{
  rs = await dbs.execute(`insert into cart(product_id, customer_id, amount, size, color) values(?,?,?,?,?)`, [req.body.product_id, req.body.customer_id, req.body.amount,req.body.size, req.body.color]);
  }
  res.json(rs);
});

router.get('/cart', async function (req, res) {
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images, c.amount, c.size, c.color FROM product p, images i, cart c where i.product_id = p.id and p.id = c.product_id and p.status=1 and c.customer_id = ? group by i.product_id having min(i.id) order by p.id`, [req.headers.customer_id]);  
  res.json(rs);
});

router.post('/amountProduct', async function (req, res) {  
  let rs = await dbs.execute(`update cart set amount = ? where product_id = ? and customer_id = ?, color = ?, size = ?`, [req.body.amount, req.body.productid, req.body.customerid, req.body.color, req.body.sizee]);   
  res.json(rs);
});

router.get('/amountProduct', async function (req, res) {  
  if (JSON.parse(req.headers.arr).length) {
    let rs = await dbs.execute(`SELECT id, amount FROM product p where id in (?)`, [JSON.parse(req.headers.arr)]);   
  res.json(rs);
  }else {
  res.json(null);
  }
});

router.get('/getCommentByProduct', async function (req, res) {  
 
    let rs = await dbs.execute(`SELECT od.id, od.rating, od.comment, c.name FROM order_detail od, orders o, customer c WHERE o.id = od.order_id and o.customer_id = c.id and product_id = ? 
    union ALL
    SELECT od.id, od.rating, od.comment, c.name FROM order_detail od, orders o, guest c WHERE o.id = od.order_id and o.customer_id = c.id and product_id = ? `, [req.headers.id, req.headers.id]);   
  res.json(rs);
 
});

router.delete('/cart', async function (req, res) {
  let rs = await dbs.execute(`delete FROM cart where product_id =? and customer_id=?`, [req.headers.product_id, req.headers.customer_id]);  
  res.json(rs);
});

router.post('/checkout', async function (req, res) {
  
  let check = await dbs.execute(`select * from  cart where customer_id= ?`, [req.body.customer_id]);
  if (check.length > 0) {
    const orderid = await dbs.getNextID('orders','id'); 
    let createOrder = await dbs.execute(`insert into orders(id, customer_id, address, comment, paymentmethod) values(?,?,?,?,?)`, [orderid, req.body.customer_id, req.body.address, req.body.comment, req.body.tt]);
    if(createOrder.affectedRows>0){
      let createOrderDetail = await dbs.execute(`insert into order_detail(product_id,order_id, amount, size, color) select product_id, ?, amount, size, color from cart where customer_id= ?`, [orderid, req.body.customer_id]);
      if(createOrderDetail.affectedRows>0){
         await dbs.execute(`delete from cart where customer_id= ?`, [req.body.customer_id]);
      }
    }
  }
  res.json('rs');
});

router.post('/checkoutforguest', async function (req, res) {    
  if (req.body.customer) {
    const guestid = await dbs.getNextID('guest','id'); 
     await dbs.execute(`insert into guest(id, name, phone, email, address) values(?,?,?,?,?)`, [guestid, req.body.customer.name, req.body.customer.phone, req.body.customer.email, req.body.customer.address]);
    const orderid = await dbs.getNextID('orders','id'); 
    let createOrder = await dbs.execute(`insert into orders(id, customer_id, address, comment, paymentmethod) values(?,?,?,?,?)`, [orderid, guestid, req.body.customer.address, req.body.customer.comment, req.body.customer.tt]);
    if(createOrder.affectedRows>0){
      let bind  = [];
      req.body.product.forEach(e => {
          bind.push([e.id, orderid, e.amount, e.size, e.color])
      });
      await dbs.execute(`insert into order_detail(product_id,order_id, amount, size, color) values ?`, [bind]);
    }
  }
  res.json('rs');
});

module.exports = router;
