const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcryptjs');

/* Authentication */


module.exports = (router) => {
    // auth(router, 'employee');

    /* Edit User */
    router.put('/', [
        check('name', 'Tên không được để trống !').notEmpty(),
        check('email', 'Email không hợp lệ !').isEmail(),
        check('phone', 'Dộ dài số điện thoại không hợp lệ !').isLength({ min: 10 }),
        body().custom(async value => {            
            let user = await dbs.execute('select * from customer where email = ? and id != ?', [value.email, value.id])
            if (user[0]) {
                return Promise.reject('Địa chỉ email đã tồn tại !');
            }
        }),
        body().custom(async value => {
            let user = await dbs.execute('select * from customer where phone = ?  and id != ?', [value.phone, value.id])
            if (user[0]) {
                return Promise.reject('Số dt đã tồn tại !');
            }
        }),
    ], async (req, res) => {

        try {
            // Check Errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let msg = errors.array().map((e, i) => {
                    return e.msg + '\n'
                })
                res.json({ type: 'error', msg: msg });
            } else {

                let sql = `update customer set name=?, address=?, email=?, phone=? where id=?`;
                let bind = [req.body.name, req.body.address, req.body.email, req.body.phone, req.body.id];
                let rs = await dbs.execute(sql, bind);                
                if (rs.affectedRows > 0) {
                    res.json({ type: 'success', msg: 'Sửa thành công !'});
                } else {
                    res.json({ type: 'error', msg: 'Sửa không thành công !' });
                }
            }
        } catch (error) {
            console.log(error);
            res.json({ err: error });
        }

    });

     /* Change Pass */
     router.post('/changepass', [
        check('oldPass', 'Tên không được để trống !').notEmpty(),
        check('newPass', 'Tên không được để trống !').notEmpty(),
        check('rePass', 'Tên không được để trống !').notEmpty(),
        check('newPass', 'Dộ dài mật khẩu mới !').isLength({ min: 5 }),
        body().custom(async value => {            
            let user = await dbs.execute('select * from customer where id = ?', [value.id])
            let rs = bcrypt.compareSync(value.oldPass, user[0].password);
            if(!rs){
                return Promise.reject('Mật khẩu cũ không chính xác !');
            }
            
        }),
        body().custom(async value => {
            if (value.newPass!==value.rePass) {
                return Promise.reject('Mật khẩu nhắc lại không khớp !');
            }
        }),
    ], async (req, res) => {

        try {
            // Check Errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let msg = errors.array().map((e, i) => {
                    return e.msg + '\n'
                })
                res.json({ type: 'error', msg: msg });
            } else {
                const saltRounds = 10;
                let salt = bcrypt.genSaltSync(saltRounds);
                let pass = bcrypt.hashSync(req.body.newPass, salt);
                let sql = `update customer set password =? where id=?`;
                let bind = [pass, req.body.id];
                let rs = await dbs.execute(sql, bind);                
                if (rs.affectedRows > 0) {
                    res.json({ type: 'success', msg: 'Sửa thành công !'});
                } else {
                    res.json({ type: 'error', msg: 'Sửa không thành công !' });
                }
            }
        } catch (error) {
            console.log(error);
            res.json({ err: error });
        }

    });

    // router.get('/', async (req, res, next) => {
    //     let rs = await dbs.execute(`SELECT id, name, address, phone, username, status FROM employee`, []);
    //     res.json(rs);
    // });

    // router.delete('/', async (req, res, next) => {        
    //     let rs = await dbs.execute(`update employee set status = ? where id = ?`, [req.body.status, req.body.employeeid]);
    //     if (rs.affectedRows > 0) {
    //         res.json({ type: 'success', msg: 'Chuyển trạng thái thành công !', employeeid: req.body.employeeid, status: req.body.status });
    //     } else {
    //         res.json({ type: 'error', msg: 'Chuyển trạng thái không thành công !' });
    //     }
    // });

};
