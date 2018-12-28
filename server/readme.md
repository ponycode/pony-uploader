
## Setting up S3

You'll first need to create a new IAM user with programmatic access which will enable access using a key id and secret. You'll 
need to assign a policy to this user that allows uploading images into a specific S3 bucket. This user doesn't need read access
since it will only be used to PUT images. Here is an example policy:

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": ["arn:aws:s3:::pony-upload-test/*"]
    }
  ]
}
```

Next, copy the user's key id and secret and set them up as environment variables for your server.



