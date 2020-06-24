const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteUser = require('./employeePrivate');


router.post('/signin', async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
  console.log(1);
  
    try {
      let user = await dbs.execute('select * from employee where username = ?',[username]);    
      
      if (user[0]) {
        let rs = bcrypt.compareSync(password, user[0].password);   
        if (rs) {
          delete user[0].password;
          var token = jwt.sign(JSON.parse(JSON.stringify(user[0])), config.secret, { expiresIn: config.expires });
          res.json({ success: true,user:user[0], token: token, expires: new Date(Date.now() + config.expires * 1000)});
        } else {          
          res.json({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
        }
      } else {
        res.json({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
      }
    } catch (error) {   
      res.json({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
    }
  });

privateRouteUser(router);

module.exports = router;
