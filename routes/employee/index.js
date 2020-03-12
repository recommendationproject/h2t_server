const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteUser = require('./employeePrivate');

// Sign in 
router.post('/signin', async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    console.log(username, password);
    
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
          console.log(2);
          
          res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
        }
      } else {
        console.log(1);
        
        res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
      }
    } catch (error) { 
      console.log(error);
         
      res.status(401).send({ success: false, msg: 'Sai Tên Đăng Nhập Hoặc Mật Khẩu !' });
    }
  });

  router.get('/product', async (req, res, next) => {
    let rs =await dbs.execute(`SELECT p.id, p.name, p.price, i.images, c.name cate_name, c.gender FROM product p, images i, category c where i.product_id = p.id and c.id = p.category_id group by i.product_id having min(i.id) order by p.id desc`,[]);
    res.json(rs);
  });

/* Add User */
router.post('/', [
    check('name', 'Username field is required').notEmpty(),
    check('username', 'Username field is required').notEmpty(),
    check('pass', 'Password field is required').notEmpty(),
    check('pass', 'Password field is min 5 character').isLength({ min: 5 }),
    check('phone', 'Password field is min 10 character').isLength({ min: 10 }),
    body('username').custom(async value => {
        let user = await dbs.execute('select * from employee where username = ?', [value])
        if (user[0]) {
            return Promise.reject('Tên đăng nhập đã tồn tại !');
        }
    }),
    body('pass2').custom((value, { req }) => {
        if (value !== req.body.pass) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })  
], async (req, res) => {

    try {
        // Check Errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {            
            res.status(422).json({ errors: errors.array() });
        } else {
            const saltRounds = 10;
            let salt = bcrypt.genSaltSync(saltRounds);
            let pass = bcrypt.hashSync(req.body.pass, salt);
            let sql = `insert into employee(id, name, address, phone, username, password, Position_id) values(?, ?, ?, ?, ?, ?, ?)`;    
            let employee_id = await dbs.getNextID('employee','id');   
            let bind = [employee_id,req.body.name,req.body.address, req.body.phone, req.body.username, pass, req.body.position_id];
            let rs = await dbs.execute(sql, bind);
            res.json(rs)
        }
    } catch (error) {
        //console.log(error);
        res.json({ err: error });
    }

});

/* Edit User */
router.put('/', (req, res) => {

});

privateRouteUser(router);

module.exports = router;
