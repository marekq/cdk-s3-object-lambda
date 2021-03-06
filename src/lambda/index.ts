import { S3 } from "aws-sdk";
import axios from "axios";
import YAML from "json-to-pretty-yaml";

// Setup S3 client
const s3client = new S3({region: process.env.AWS_REGION});

exports.handler = async function (event: any, context: any) {
    
    // Print input event
    console.log(event);

    // Retrieve values from input event
    const inputS3Url = event.getObjectContext?.inputS3Url;
    const requestRoute = event.getObjectContext?.outputRoute;
    const outputToken = event.getObjectContext?.outputToken;
    
    // Retrieve signed S3 url from input event
    const object = await axios({
        method: "get",
        url: inputS3Url
    });

    // Convert JSON to YAML
    const convertObject = YAML.stringify(object.data);
    console.log(convertObject);

    // Convert to uppercase, return file to caller
    await s3client.writeGetObjectResponse({
        Body: convertObject,
        RequestRoute: requestRoute,
        RequestToken: outputToken,
      }).promise();

    // Return success
    return { 
        status_code: 200 
    };
};