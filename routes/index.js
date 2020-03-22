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

router.get('/listProduct/:type', async function (req, res) {
  let limit = req.query.limit ? parseInt(req.query.limit) : 12;
  let page = req.query.page ? parseInt(req.query.page) : 1;
  let offset = limit * (page - 1);
  // let type = req.params.type==='type' ? 'c.gender_eng':'c.id';
  let cateName = req.params.type==='new' ? 'NEW':'SALE';
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images FROM product p, images i, category c where i.product_id = p.id and p.status=1 and p.category_id = c.id group by i.product_id having min(i.id) order by p.id desc limit ? OFFSET ?`, [limit, offset]);
  let rsAll = await dbs.execute(`SELECT count(*) totalRow FROM product p, category c where p.status=1 and p.category_id = c.id`, []);
  // let cateNameRs =  await dbs.execute(`SELECT distinct ?? name FROM category c where ?? = ? `, [cateName,type, req.params.categoryId]);  
  res.json({data:rs, currentPage:page, totalPage: Math.ceil(rsAll[0].totalRow/limit), cateName: cateName});
});

router.post('/addCart', async function (req, res) {
  // console.log(req.body);
  // res.json('');
  let check = await dbs.execute(`select * from  cart where product_id= ? and customer_id= ?`, [req.body.product_id, req.body.customer_id]);
  let rs = null;
  if(check.length > 0){
   rs = await dbs.execute(`update cart set amount = ? where product_id= ? and customer_id= ?`, [check[0].amount+req.body.amount, req.body.product_id, req.body.customer_id]);
  }else{
  rs = await dbs.execute(`insert into cart(product_id, customer_id, amount) values(?,?,?)`, [req.body.product_id, req.body.customer_id, req.body.amount]);
  }
  res.json(rs);
});

router.get('/cart', async function (req, res) {
  let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images, c.amount FROM product p, images i, cart c where i.product_id = p.id and p.id = c.product_id and p.status=1 and c.customer_id = ? group by i.product_id having min(i.id) order by p.id`, [req.headers.customer_id]);  
  res.json(rs);
});

router.get('/checkout', async function (req, res) {
  let check = await dbs.execute(`select * from  cart where customer_id= ?`, [req.headers.customer_id]);
  if (check.length > 0) {
    const orderid = await dbs.getNextID('orders','id'); 
    let createOrder = await dbs.execute(`insert into orders(id, customer_id) values(?,?)`, [orderid, req.headers.customer_id]);
    if(createOrder.affectedRows>0){
      let createOrderDetail = await dbs.execute(`insert into order_detail(product_id,order_id, amount) select product_id, ?, amount from cart where customer_id= ?`, [orderid, req.headers.customer_id]);
      if(createOrderDetail.affectedRows>0){
        let deleteCart = await dbs.execute(`delete from  cart where customer_id= ?`, [req.headers.customer_id]);
      }
      res.json('deleteCart');
    }
    
  }
  // let rs = await dbs.execute(`SELECT p.id, p.name, p.price, i.images, c.amount FROM product p, images i, cart c where i.product_id = p.id and p.id = c.product_id and p.status=1 and c.customer_id = ? group by i.product_id having min(i.id) order by p.id`, [req.headers.customer_id]);  
  res.json('');
});

router.get('/recommend', async function (req, res) {
  let rs = await dbs.execute(`SELECT o.customer_id, od.product_id, od.rating FROM order_detail od, orders o WHERE o.id = od.order_id`, []); 
  let userToRecommend = await dbs.execute(`SELECT distinct customer_id FROM orders`, []);
  
  var groups = {};  
  for (var i = 0; i < rs.length; i++) {
    var groupName = rs[i].customer_id;
    if (!groups[groupName]) {
      groups[groupName] = {};
    }
    // groups[groupName].push({[rs[i].product_id]: rs[i].rating})
    groups[groupName][rs[i].product_id]  = rs[i].rating
  }
  let recommend = [];
  userToRecommend.forEach(element => {
    item = recommendation_eng(groups, element.customer_id, euclidean_score);
    item[0].forEach(i=> {
      recommend.push([i.items, element.customer_id, Math.round(i.val)])
    })
  });
  await dbs.execute(`delete from recommend_product`, []);
  let rsRecomment = await dbs.execute(`insert into recommend_product(product_id, user_id, val) values ?`, [recommend]);
  res.json(rsRecomment);
});

var euclidean_score = function (dataset, p1, p2) {

  var existp1p2 = {};
  for (var key in dataset[p1]) {
      if (key in dataset[p2]) {
          existp1p2[key] = 1
      }
      if (len(existp1p2) == 0) return 0;//check if it has a data
      var sum_of_euclidean_dist = [];//store the  euclidean distance


      for (item in dataset[p1]) {
          if (item in dataset[p2]) {
              sum_of_euclidean_dist.push(Math.pow(dataset[p1][item] - dataset[p2][item], 2));
          }
      }
      var sum = 0;
      for (var i = 0; i < sum_of_euclidean_dist.length; i++) {
          sum += sum_of_euclidean_dist[i]; 
      }
      var sum_sqrt = 1 / (1 + Math.sqrt(sum));
      return sum_sqrt;
  }
}

var len = function (obj) {
  var len = 0;
  for (var i in obj) {
      len++
  }
  return len;
}

var similar_user = function (dataset, person, num_user, distance) {
  var scores = [];
  for (var others in dataset) {
      if (others != person && typeof (dataset[others]) != "function") {
          var val = distance(dataset, person, others)
          var p = others
          scores.push({ val: val, p: p });
      }
  }
  scores.sort(function (a, b) {
      return b.val < a.val ? -1 : b.val > a.val ? 1 : b.val >= a.val ? 0 : NaN;
  });
  var score = [];
  for (var i = 0; i < num_user; i++) {
      score.push(scores[i]);
  }
  return score;

}

var recommendation_eng = function (dataset, person, distance) {

  var totals = {
      //you can avoid creating a setter function
      //like this in the object you found them
      //since it just check if the object has the property if not create
      //and add the value to it.
      //and  because of this setter that why a function property
      // is created in the dataset, when we transform them.
      setDefault: function (props, value) {
          if (!this[props]) {
              this[props] = 0;
          }
          this[props] += value;
      }
  },
      simsum = {
          setDefault: function (props, value) {
              if (!this[props]) {
                  this[props] = 0;
              }

              this[props] += value;
          }
      },
      rank_lst = [];
  for (var other in dataset) {
      if (other === person) continue;
      var similar = distance(dataset, person, other);

      if (similar <= 0) continue;
      for (var item in dataset[other]) {
          if (!(item in dataset[person]) || (dataset[person][item] == 0)) {
              //the setter help to make this look nice.
              totals.setDefault(item, dataset[other][item] * similar);
              simsum.setDefault(item, similar);


          }

      }


  }

  for (var item in totals) {
      //this what the setter function does
      //so we have to find a way to avoid the function in the object     
      if (typeof totals[item] != "function") {

          var val = totals[item] / simsum[item];
          rank_lst.push({ val: val, items: item });
      }
  }
  rank_lst.sort(function (a, b) {
      return b.val < a.val ? -1 : b.val > a.val ?
          1 : b.val >= a.val ? 0 : NaN;
  });
  var recommend = [];
  for (var i in rank_lst) {
      recommend.push(rank_lst[i].items);
  }
  return [rank_lst, recommend];
}

module.exports = router;
