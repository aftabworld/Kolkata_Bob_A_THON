const logger = require('../utils/logger');

// Placeholder notification service

const sendNotification = async (type, recipient, data) => {
  logger.info(`Notification sent: ${type} to ${recipient}`);
  return { success: true, message: 'Notification sent (placeholder)' };
};

const sendEmail = async (to, subject, body) => {
  logger.info(`Email sent to: ${to}, subject: ${subject}`);
  return { success: true };
};

const sendSMS = async (phone, message) => {
  logger.info(`SMS sent to: ${phone}`);
  return { success: true };
};

module.exports = {
  sendNotification,
  sendEmail,
  sendSMS
};

// Made with Bob