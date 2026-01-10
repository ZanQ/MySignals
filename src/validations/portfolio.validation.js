const Joi = require('joi');

const addPosition = {
  body: Joi.object().keys({
    ticker: Joi.string().required().trim().uppercase(),
    entry_price: Joi.number().required().min(0),
    entry_date: Joi.string().required(),
    shares: Joi.number().integer().min(1).default(100),
  }),
};

const closePosition = {
  body: Joi.object().keys({
    ticker: Joi.string().required().trim().uppercase(),
    exit_price: Joi.number().required().min(0),
    exit_date: Joi.string().required(),
    reason: Joi.string().required().trim(),
  }),
};

module.exports = {
  addPosition,
  closePosition,
};
