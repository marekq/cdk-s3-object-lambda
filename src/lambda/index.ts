const AWS = require('aws-sdk');

const s3client = new AWS.S3();

exports.handler = async function (event: any, context: any) {
    console.log(event);
};