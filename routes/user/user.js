const dbs = require('../../utils/dbs');
const auth = require('../../utils/auth');
/* Authentication */


module.exports = (router) => {
    auth(router, 'user');

    router.get('/', async (req, res) => {
        let rs = await dbs.execute('select * from td_user');
        res.json(rs);
    });
};
