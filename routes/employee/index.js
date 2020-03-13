const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteUser = require('./employeePrivate');


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

privateRouteUser(router);

module.exports = router;
