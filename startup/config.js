const config = require('config');

module.exports = () => {
    if (!config.get('jwtPrivateKey')) {
        throw  new Error(
            'jwtPrivate key is not set ....'
        );
    }
};
