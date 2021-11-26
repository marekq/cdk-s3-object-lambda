import { CfnOutput, Duration, Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CfnAccessPoint as s3ObjectAccessPoint } from 'aws-cdk-lib/aws-s3objectlambda';
import { CfnAccessPoint as s3AccessPoint } from 'aws-cdk-lib/aws-s3';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Tracing } from 'aws-cdk-lib/aws-lambda';

export class CdkS3ObjectLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    const bucket = new Bucket(this, "S3Bucket", {
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Create S3 convertor Lambda
    const convertLambda = new NodejsFunction(this, "S3ObjectLambda", {
      entry: "./src/lambda/index.ts",
      handler: "handler",
      memorySize: 256,
      retryAttempts: 0,
      timeout: Duration.seconds(5),
      tracing: Tracing.ACTIVE,
      architecture: Architecture.ARM_64
    });

    // Create S3 object access point
    const s3AP = new s3AccessPoint(this, "AccessPoint", {
      bucket: bucket.bucketName
    });

    // Create S3 object Lambda access point 
    const objectAP = new s3ObjectAccessPoint(this, 'MyCfnAccessPoint', {
      objectLambdaConfiguration: {
        supportingAccessPoint: s3AP.attrArn,   
        cloudWatchMetricsEnabled: true,
        transformationConfigurations: [{
          actions: ["GetObject"],
          contentTransformation: {
            AwsLambda: {
              FunctionArn: convertLambda.functionArn,
            }
          }    
        }]
      }
    });

    // Allow Lambda to write S3 response
    convertLambda.addToRolePolicy(new PolicyStatement({
      actions: ["s3-object-lambda:WriteGetObjectResponse"],
      resources: ["arn:aws:s3-object-lambda:" + this.region + ":" + this.account + ":accesspoint/*"]
    }));

    // Return S3 Access Point ARN
    new CfnOutput(this, "S3ObjectAccessPointArn", { value: objectAP.attrArn ?? 'error' });
  }
}
