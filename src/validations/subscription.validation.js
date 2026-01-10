const Joi = require('joi');

const createCheckoutSession = {
  body: Joi.object().keys({
    successUrl: Joi.string().uri().required(),
    cancelUrl: Joi.string().uri().required(),
  }),
};

const createPortalSession = {
  body: Joi.object().keys({
    returnUrl: Joi.string().uri().required(),
  }),
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
};
