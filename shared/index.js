module.exports = {
  User: require('./models/User'),
  Issue: require('./models/Issue'),
  Notification: require('./models/Notification'),
  priorityRules: require('./config/priorityRules'),
  duplicateRules: require('./config/duplicateRules'),
  priority: require('./services/priority'),
  duplicates: require('./services/duplicates'),
  statusWorkflow: require('./services/statusWorkflow')
};
