const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
  // auth(router, 'order');

  router.get('/', async (req, res, next) => {
    let rs = await dbs.execute(`SELECT id, name, address, phone, email, (select sum(amount) from warehouse_import o where o.supp_id = s.id) as amount from supp s`, []);
    res.json(rs);
  });

  router.post('/', async (req, res, next) => {
    let errMsg = '';
    let chkName = await dbs.execute(`select * from supp where name = ?`, [req.body.name])
    let chkPhone = await dbs.execute(`select * from supp where phone = ?`, [req.body.phone])
    let chkEmail = await dbs.execute(`select * from supp where email = ?`, [req.body.email])
    if (chkName.length) {
      errMsg += 'Tên nhà cung cấp đã tồn tại !\n';
    }
    if (chkPhone.length) {
      errMsg += 'Số điện thoại đã tồn tại !\n';
    }
    if (chkEmail.length) {
      errMsg += 'Email đã tồn tại !\n';
    }
    if (errMsg !== '') {
      res.json({ type: 'error', msg: errMsg });
    } else {
      let suppid = await dbs.getNextID('supp', 'id');
      let rs = await dbs.execute(`insert into supp(id, name, address, phone, email) values(?,?,?,?,?)`, [suppid, req.body.name, req.body.address, req.body.phone, req.body.email]);
      if (rs.affectedRows > 0) {
        let rsSupply = await dbs.execute('SELECT id, name, address, phone, email, (select sum(amount) from order_import o where o.supp_id = s.id) as amount from supp s where id = ?', [suppid]);
        res.json({ type: 'success', msg: 'Thêm nhà cung cấp thành công !', supply: rsSupply });
      } else {
        res.json({ type: 'error', msg: 'Thêm nhà cung cấp không thành công !' });
      }
    }
  });

  router.put('/', async (req, res, next) => {
    let errMsg = '';
    let chkName = await dbs.execute(`select * from supp where name = ? and id != ?`, [req.body.name, req.body.id])
    let chkPhone = await dbs.execute(`select * from supp where phone = ? and id != ?`, [req.body.phone, req.body.id])
    let chkEmail = await dbs.execute(`select * from supp where email = ? and id != ?`, [req.body.email, req.body.id])
    if (chkName.length) {
      errMsg += 'Tên nhà cung cấp đã tồn tại !\n';
    }
    if (chkPhone.length) {
      errMsg += 'Số điện thoại đã tồn tại !\n';
    }
    if (chkEmail.length) {
      errMsg += 'Email đã tồn tại !\n';
    }
    if (errMsg !== '') {
      res.json({ type: 'error', msg: errMsg });
    } else {
      let rs = await dbs.execute(`update supp set name = ?, address = ?, phone = ?, email = ? where id = ?`, [req.body.name, req.body.address, req.body.phone, req.body.email, req.body.id]);
      if (rs.affectedRows > 0) {
        let rsSupply = await dbs.execute('SELECT id, name, address, phone, email, (select sum(amount) from order_import o where o.supp_id = s.id) as amount from supp s where id = ?', [req.body.id]);        
        res.json({ type: 'success', msg: 'Sửa nhà cung cấp thành công !', supply: rsSupply[0] });
      } else {
        res.json({ type: 'error', msg: 'Sửa nhà cung cấp không thành công !' });
      }
    }
  });

  router.delete('/:id', async (req, res, next) => {
    let rs = await dbs.execute(`delete from supp where id = ?`, [req.params.id]);
    if (rs.affectedRows > 0) {
      res.json({ type: 'success', msg: 'Xóa thành công !', supplyId: req.params.id });
    } else {
      res.json({ type: 'error', msg: 'Xóa không thành công !' });
    }
  });

};
