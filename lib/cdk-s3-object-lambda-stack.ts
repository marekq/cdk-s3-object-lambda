import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnAccessPoint as s3ObjectAccessPoint } from 'aws-cdk-lib/aws-s3objectlambda';
import { CfnAccessPoint as s3AccessPoint } from 'aws-cdk-lib/aws-s3';

export class CdkS3ObjectLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "S3Bucket", {
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const ConvertLambda = new NodejsFunction(this, "S3ObjectLambda", {
      entry: "./src/lambda/index.ts",
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });

    const accesspoint = new s3AccessPoint(this, "AccessPoint", {
      bucket: bucket.bucketName
    });

    const AccessPoint = new s3ObjectAccessPoint(this, 'MyCfnAccessPoint', {
      objectLambdaConfiguration: {
        supportingAccessPoint: accesspoint.attrArn,   
        cloudWatchMetricsEnabled: true,
        transformationConfigurations: [{
          actions: ["GetObject"],
          contentTransformation: {
            AwsLambda: {
              FunctionArn: ConvertLambda.functionArn,
              FunctionPayload: "{}"
            }
          }    
        }]
      }
    });
  }
}
