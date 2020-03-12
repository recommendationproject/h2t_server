const express = require('express');
const router = express.Router();
const dbs = require('../utils/dbs');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', async (req, res, next) => {
  let rs =await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i where i.product_id = p.id group by i.product_id having min(i.id) order by p.id desc limit 6`,[]);
  res.json(rs);
});

/* GET home page. */
router.get('/product', async (req, res, next) => {
  let product =await dbs.execute(`SELECT * FROM product where id = ?`,[req.headers.id]);
  let images =await dbs.execute(`SELECT images 'original', images 'thumbnail' FROM images where product_id = ?`,[req.headers.id]);
  res.json({product: product[0], images: images});
});

router.post('/product', async (req, res, next) => {
  console.log(req.headers);
  res.json();
  // const product_id = await dbs.getNextID('product', 'id');  
  // let rs =await dbs.execute(`insert into product(id, name, price, amount, description, category_id) values(?,?,?,?,?,?)`,[product_id, req.headers.name, parseInt(req.headers.price), parseInt(req.headers.amount), req.headers.description, req.headers.category_id]);
  // res.json(rs);
});

router.get('/allcategory', async (req, res, next) => {
  let category =await dbs.execute(`SELECT * FROM category`,[]);
  res.json(category);
});

router.post('/signin', async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await dbs.execute('select * from employee where username = ?',[username]);    
    
    if (user[0]) {
      let rs = bcrypt.compareSync(password, user[0].password);   
      if (rs) {
        delete user[0].password;
        let path = await dbs.execute('SELECT gp.path, gp.post, gp.get, gp.put, gp.del from group_permission gp, map_employee_group meg, employee emp where gp.group_id=meg.group_id and meg.employee_id = emp.id and emp.username =  ?',[username]);
        var token = jwt.sign(JSON.parse(JSON.stringify(user[0])), config.secret, { expiresIn: config.expires });
        res.json({ success: true, token: token, expires: new Date(Date.now() + config.expires * 1000), path: path });
      } else {
        res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
      }
    } else {
      res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
    }
  } catch (error) {    
    res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
  }
});

module.exports = router;
