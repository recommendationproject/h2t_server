const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
const { check, validationResult, body } = require('express-validator');
const bcrypt = require('bcryptjs');

/* Authentication */


module.exports = (router) => {
    // auth(router, 'employee');

    /* Add Employee */
    router.post('/', [
        check('name', 'Tên không được để trống !').notEmpty(),
        check('username', 'Tên đăng nhập không được để trống !').notEmpty(),
        check('phone', 'Số dt không được để trống !').notEmpty(),
        check('pass', 'Mật khẩu không được để trống !').notEmpty(),
        check('pass', 'Mật khẩu ít nhất 5 ký tự !').isLength({ min: 5 }),
        body('username').custom(async value => {
            let user = await dbs.execute('select * from employee where username = ?', [value])
            if (user[0]) {
                return Promise.reject('Tên đăng nhập đã tồn tại !');
            }
        })
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
                let pass = bcrypt.hashSync(req.body.pass, salt);
                let sql = `insert into employee(id, name, address, phone, username, password, status) values(?, ?, ?, ?, ?, ?, 1)`;
                let employee_id = await dbs.getNextID('employee', 'id');
                let bind = [employee_id, req.body.name, req.body.address, req.body.phone, req.body.username, pass];
                let rs = await dbs.execute(sql, bind);

                if (rs.affectedRows > 0) {
                    let rsAdd = await dbs.execute(`SELECT id, name, address, phone, username, status FROM employee where id = ?`, [employee_id])
                    res.json({ type: 'success', msg: 'Thêm thành công !', employee: rsAdd });
                } else {
                    res.json({ type: 'error', msg: 'Thêm không thành công !' });
                }
            }
        } catch (error) {
            console.log(error);
            res.json({ err: error });
        }

    });

    /* Update Employee */
    router.put('/', [
        check('name', 'Tên không được để trống !').notEmpty(),
        check('phone', 'Số dt không được để trống !').notEmpty(),
        body('pass').custom(async value => {
            if (value.length > 0 && value.length < 5) {
                return Promise.reject('Mật khẩu ít nhất 5 ký tự !');
            }
        })
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

                let sql = `update employee set name=?, address=?, phone=? where id=?`;
                let bind = [req.body.name, req.body.address, req.body.phone, req.body.id];
                if (req.body.pass.length > 0) {
                    sql = `update employee set name=?, address=?, phone=?, password=? where id=?`;
                    const saltRounds = 10;
                    let salt = bcrypt.genSaltSync(saltRounds);
                    let pass = bcrypt.hashSync(req.body.pass, salt);
                    bind = [req.body.name, req.body.address, req.body.phone,pass, req.body.id];
                }
                let rs = await dbs.execute(sql, bind);                
                if (rs.affectedRows > 0) {
                    let rsAdd = await dbs.execute(`SELECT id, name, address, phone, username, status FROM employee where id = ?`, [req.body.id])
                    res.json({ type: 'success', msg: 'Sửa thành công !', employee: rsAdd });
                } else {
                    res.json({ type: 'error', msg: 'Sửa không thành công !' });
                }
            }
        } catch (error) {
            console.log(error);
            res.json({ err: error });
        }

    });

    router.get('/', async (req, res, next) => {
        let rs = await dbs.execute(`SELECT id, name, address, phone, username, status FROM employee`, []);
        res.json(rs);
    });

    router.delete('/', async (req, res, next) => {        
        let rs = await dbs.execute(`update employee set status = ? where id = ?`, [req.body.status, req.body.employeeid]);
        if (rs.affectedRows > 0) {
            res.json({ type: 'success', msg: 'Chuyển trạng thái thành công !', employeeid: req.body.employeeid, status: req.body.status });
        } else {
            res.json({ type: 'error', msg: 'Chuyển trạng thái không thành công !' });
        }
    });

};
