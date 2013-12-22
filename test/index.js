var util = require('util');
var async = require('async');
var expect = require('expect.js');
var aws = require('aws-sdk');

describe('', function() {
  var queueName = 'aws-sqs-test';
  var sqs = new aws.SQS();

  describe('listQueues', function() {
    it('works', function(done) {
      sqs.listQueues({
      }, function(err, data) {
        if (err) return done(err);
        // properties
        expect(data).to.have.property('QueueUrls');
        // properties type
        expect(data.QueueUrls).to.be.an(Array);
        done();
      });
    });
  });

  describe('getQueueUrl', function() {
    it('works', function(done) {
      sqs.getQueueUrl({
        QueueName: queueName 
      }, function(err, data) {
        if (err) return done(err);
        // properties
        expect(data).to.have.property('QueueUrl');
        // properties type
        expect(data.QueueUrl).to.be.a('string');
        done();
      });
    });
  });

  describe('getQueueAttributes', function() {
    var url;

    before(function(done) {
      sqs.getQueueUrl({
        QueueName: queueName
      }, function(err, data) {
        if (err) return done(err);
        url = data.QueueUrl;
        done();
      });
    });

    it('works', function(done) {
      sqs.getQueueAttributes({
        QueueUrl: url,
        AttributeNames: ['All']
      }, function(err, data) {
        if (err) return done(err);
        expect(data).to.have.property('Attributes');
        var a = data.Attributes;
        expect(a).to.have.property('ApproximateNumberOfMessages');
        expect(a).to.have.property('ApproximateNumberOfMessagesNotVisible');
        expect(a).to.have.property('ApproximateNumberOfMessagesDelayed');
        expect(a).to.have.property('QueueArn');
        expect(a).to.have.property('CreatedTimestamp');
        expect(a).to.have.property('LastModifiedTimestamp');
        expect(a).to.have.property('VisibilityTimeout');
        expect(a).to.have.property('MaximumMessageSize');
        expect(a).to.have.property('MessageRetentionPeriod');
        expect(a).to.have.property('DelaySeconds');
        expect(a).to.have.property('ReceiveMessageWaitTimeSeconds');
        done();
      });
    });
  });

  describe('send/receive/deleteMessage', function() {
    var url;

    before(function(done) {
      sqs.getQueueUrl({
        QueueName: queueName
      }, function(err, data) {
        if (err) return done(err);
        url = data.QueueUrl;
        done();
      });
    });

    beforeEach(function(done) {
      sqs.getQueueAttributes({
        QueueUrl: url,
        AttributeNames: ['All']
      }, function(err, data) {
        if (err) return done(err);
        var n = data.Attributes.ApproximateNumberOfMessages;
        if (n == 0) return done();
        async.times(n, function(i, next) {
          sqs.receiveMessage({
            QueueUrl: url,
            MaxNumberOfMessages: 1
          }, function(err, data) {
            if (err) return done(err);
            if (data.Messages.length == 0) return next();
            sqs.deleteMessage({
              QueueUrl: url,
              ReceiptHandle: data.Messages[0].ReceiptHandle
            }, function(err, data) {
              next(err);
            });
          });
        }, function(err) {
          if (err) return done(err);
          done();
        });
      });
    });

    describe('send+receive', function() {
      it('works', function(done) {
        var body = 'Hello';
        sqs.sendMessage({
          QueueUrl: url, 
          MessageBody: body
        }, function(err, data) {
          if (err) return done(err);
          // properties
          expect(data).to.have.property('MessageId');
          expect(data).to.have.property('MD5OfMessageBody');
          // properties type
          expect(data.MessageId).to.be.a('string');
          expect(data.MD5OfMessageBody).to.be.a('string');

          var md5OfBody = data.MD5OfMessageBody;

          sqs.receiveMessage({
            QueueUrl: url,
            MaxNumberOfMessages: 1
          }, function(err, data) {
            if (err) return done(err);
            // properties
            expect(data).to.have.property('Messages');
            var m = data.Messages[0];
            expect(m).to.have.property('Body');
            expect(m).to.have.property('MD5OfBody');
            expect(m).to.have.property('ReceiptHandle');
            expect(m).to.have.property('MessageId');
            // properties type
            expect(data.Messages).to.be.a('array');
            expect(m.Body).to.be.a('string');
            expect(m.MD5OfBody).to.be.a('string');
            expect(m.ReceiptHandle).to.be.a('string');
            expect(m.MessageId).to.be.a('string');
            // check value
            expect(m.Body).to.be(body);
            expect(m.MD5OfBody).to.be(md5OfBody);

            async.each(data.Messages, function(i, next) {
              sqs.deleteMessage({
                QueueUrl: url,
                ReceiptHandle: i.ReceiptHandle
              }, function(err, data) {
                next(err);
              });
            }, function(err) {
              if (err) return done(err);
              done();
            });
          });
        });
      });
    });
  });
});
