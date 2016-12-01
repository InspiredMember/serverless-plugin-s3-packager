# Serverless Plugin for Packaging Files from AWS S3
This plugin simply performs an S3 getObject of the specified files to their
respectively defined paths, and then removes the files after the serverless
deployment package is created.

## Installation
`npm i --save serverless-plugin-s3-packager`

## Use (in serverless.yml)
```
plugins:
  - serverless-plugin-s3-packager

custom:
  s3files:
    - Bucket: "bucket-1"
      Key: "path/to/file1"
      Dst: "./file1"
    - Bucket: "bucket-2"
      Key: "path/to/file2"
      Dst: "./file2"
```
