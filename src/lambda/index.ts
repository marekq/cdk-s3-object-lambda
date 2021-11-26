import { S3 } from "aws-sdk";
import axios from "axios";

const s3client = new S3({region: process.env.AWS_REGION});

exports.handler = async function (event: any, context: any) {
    
    console.log(event);

    const inputS3Url = event.getObjectContext?.inputS3Url;
    const requestRoute = event.getObjectContext?.outputRoute;
    const outputToken = event.getObjectContext?.outputToken;
    
    const object = await axios({
        method: "get",
        url: inputS3Url
    });

    await s3client.writeGetObjectResponse({
        Body: JSON.stringify(object),
        RequestRoute: requestRoute,
        RequestToken: outputToken,
      }).promise();

    console.log(object);

    return { 
        status_code: 200 
    };

};