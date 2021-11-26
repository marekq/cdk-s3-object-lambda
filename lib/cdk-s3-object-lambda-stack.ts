import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnAccessPoint as s3ObjectAccessPoint } from 'aws-cdk-lib/aws-s3objectlambda';
import { CfnAccessPoint as s3AccessPoint } from 'aws-cdk-lib/aws-s3';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Tracing } from 'aws-cdk-lib/aws-lambda';

export class CdkS3ObjectLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "S3Bucket", {
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const convertLambda = new NodejsFunction(this, "S3ObjectLambda", {
      entry: "./src/lambda/index.ts",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      timeout: Duration.seconds(5),
      tracing: Tracing.ACTIVE
    });

    convertLambda.addToRolePolicy(new PolicyStatement({
      actions: ["s3-object-lambda:WriteGetObjectResponse"],
      resources: ["*"]
    }));
    
    const s3AP = new s3AccessPoint(this, "AccessPoint", {
      bucket: bucket.bucketName
    });

    const objectAP = new s3ObjectAccessPoint(this, 'MyCfnAccessPoint', {
      objectLambdaConfiguration: {
        supportingAccessPoint: s3AP.attrArn,   
        cloudWatchMetricsEnabled: true,
        transformationConfigurations: [{
          actions: ["GetObject"],
          contentTransformation: {
            AwsLambda: {
              FunctionArn: convertLambda.functionArn,
              FunctionPayload: "{}"
            }
          }    
        }]
      }
    });
  }
}
