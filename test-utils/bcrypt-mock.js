
const bcrypt = {
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue('$2b$10$mockhashedpassword'),
    genSalt: jest.fn().mockResolvedValue('somesalt')
};

module.exports = bcrypt;
