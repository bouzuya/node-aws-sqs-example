module.exports = process.env.AWS_SQS_EXAMPLE_COV
  ? require('./lib-cov/')
  : require('./lib/');
