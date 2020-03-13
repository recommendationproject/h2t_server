const express = require('express');
const router = express.Router();
const dbs = require('../utils/dbs');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const bcrypt = require('bcrypt');
const { check, validationResult, body } = require('express-validator');
router.get('/allcategory', async (req, res, next) => {
  let category =await dbs.execute(`SELECT * FROM category`,[]);
  res.json(category);
});

router.post('/signin', async function (req, res) {
  let username = req.body.username;
  let password = req.body.password;

  try {
    let user = await dbs.execute('select * from customer where username = ?',[username]);    
    
    if (user[0]) {
      let rs = bcrypt.compareSync(password, user[0].password);   
      if (rs) {
        delete user[0].password;
        // let path = await dbs.execute('SELECT gp.path, gp.post, gp.get, gp.put, gp.del from group_permission gp, map_employee_group meg, employee emp where gp.group_id=meg.group_id and meg.employee_id = emp.id and emp.username =  ?',[username]);
        var token = jwt.sign(JSON.parse(JSON.stringify(user[0])), config.secret, { expiresIn: config.expires });
        res.json({ success: true, token: token, expires: new Date(Date.now() + config.expires * 1000) });
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
          res.json(rs)
      }
  } catch (error) {
      //console.log(error);
      res.json({ err: error });
  }

});

module.exports = router;
