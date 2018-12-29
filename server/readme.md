
## Setting up S3

First create a bucket to be the root of your file uploads. You'll need to set up a CORS configuration on the bucket
to allow uploading images. Here is an example CORS configuration:

```
<CORSConfiguration>
 <CORSRule>
   <AllowedOrigin>*</AllowedOrigin>
   <AllowedMethod>GET</AllowedMethod>
   <AllowedMethod>POST</AllowedMethod>
   <AllowedMethod>PUT</AllowedMethod>
   <AllowedHeader>*</AllowedHeader>
 </CORSRule>
</CORSConfiguration>
```

You'll need to adjust the 'Public Access Settings' under the bucket permissions tab. Uncheck 'Block new public ACLs and uploading public objects (Recommended)' and 'Remove public access granted through public ACLs (Recommended)' to allow uploading and reading public objects.

You'll then need to create a new IAM user with programmatic access which will enable access using a key id and secret. You'll 
need to assign a policy to this user that allows uploading images into a specific S3 bucket. This user doesn't need read access
since it will only be used to PUT images. Here is an example policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::pony-upload-test/*"
            ]
        }
    ]
}
```



Next, copy the user's key id and secret and set them up as environment variables for your server.



