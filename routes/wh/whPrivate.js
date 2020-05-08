const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
  // auth(router, 'order');

  router.get('/', async (req, res, next) => {
    console.log(req.body);
    
    let rs = await dbs.execute(`SELECT wh.id, wh.product_id, p.name as productname, wh.amount, wh.supp_id, s.name as suppname, wh.date_import, stt.id sttid, stt.status from warehouse_import wh, product p, supp s, status stt where p.id = wh.product_id and wh.supp_id = s.id and wh.status = stt.id`, []);
    res.json(rs);
  });

  router.post('/', async (req, res, next) => {

      let whid = await dbs.getNextID('warehouse_import', 'id');
      let rs = await dbs.execute(`insert into warehouse_import(id, product_id, amount, supp_id, date_import) values(?,?,?,?,now())`, [whid, req.body.product, req.body.amount, req.body.supply]);
      console.log(rs);
      
      if (rs.affectedRows > 0) {
        let rsWh = await dbs.execute('SELECT wh.id, wh.product_id, p.name as productname, wh.amount, wh.supp_id, s.name as suppname, wh.date_import, stt.id sttid, stt.status from warehouse_import wh, product p, supp s, status stt where p.id = wh.product_id and wh.supp_id = s.id and wh.status = stt.id and wh.id = ?', [whid]);
        res.json({ type: 'success', msg: 'Thêm thành công !', wh: rsWh });
      } else {
        res.json({ type: 'error', msg: 'Thêm không thành công !' });
      }
    
  });

  router.put('/', async (req, res, next) => {    

      let rs = await dbs.execute(`update warehouse_import set product_id = ?, amount = ?, supp_id = ?, status = ? where id = ?`, [req.body.product, req.body.amount, req.body.supply, req.body.sttid, req.body.id]);
      if(req.body.sttid ===10){
        await dbs.execute(`update product set amount = amount + ? where id = ?`, [req.body.amount, req.body.product]);
      }
      if (rs.affectedRows > 0) {
        let rsWh = await dbs.execute('SELECT wh.id, wh.product_id, p.name as productname, wh.amount, wh.supp_id, s.name as suppname, wh.date_import, stt.id sttid, stt.status from warehouse_import wh, product p, supp s, status stt where p.id = wh.product_id and wh.supp_id = s.id and wh.status = stt.id and wh.id = ?', [req.body.id]);        
        res.json({ type: 'success', msg: 'Sửa thành công !', wh: rsWh[0] });
      } else {
        res.json({ type: 'error', msg: 'Sửa không thành công !' });
      }
    
  });

  router.delete('/:id', async (req, res, next) => {
    let rs = await dbs.execute(`delete from warehouse_import where id = ?`, [req.params.id]);
    if (rs.affectedRows > 0) {
      res.json({ type: 'success', msg: 'Xóa thành công !', whId: req.params.id });
    } else {
      res.json({ type: 'error', msg: 'Xóa không thành công !' });
    }
  });

};
