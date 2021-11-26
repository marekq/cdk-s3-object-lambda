import boto3, sys

s3client = boto3.client('s3')
s3arn = 'arn:aws:s3:eu-west-1:xxx:accesspoint/xxx'

def getFile(fname):

    s3file = s3client.get_object(Bucket = s3arn, Key = fname)
    print(s3file['Body'].read().decode('utf-8'))

getFile(sys.argv[1])