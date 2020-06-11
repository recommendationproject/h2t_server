const express = require('express');
const router = express.Router();
const dbs = require('../../utils/dbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const privateRouteUser = require('./userPrivate');

privateRouteUser(router);

module.exports = router;
