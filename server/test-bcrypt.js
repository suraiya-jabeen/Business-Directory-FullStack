const bcrypt = require('bcryptjs'); // or 'bcrypt' if using native version

const hash = bcrypt.hashSync('test-password', 10);
console.log('Generated hash:', hash);