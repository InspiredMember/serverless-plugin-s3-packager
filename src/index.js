/**
 * Copyright (C) 2016 Inspired Member, Inc.
 */
'use strict';

let AWS = require('aws-sdk');
let Class = require('class.extend');
let fs = require('fs');
let path = require('path');

module.exports = Class.extend({
    init(serverless, opts) {
        this._serverless = serverless;
        this._opts = opts;

        this._cwd = this._serverless.config.servicePath;
        this._s3 = new AWS.S3();

        this._deployedFiles = [];

        this.hooks = {
            'before:deploy:function:deploy': this._addFiles.bind(this),
            'after:deploy:function:deploy': this._removeFiles.bind(this),
            'before:deploy:createDeploymentArtifacts': this._addFiles.bind(this),
            'after:deploy:createDeploymentArtifacts': this._removeFiles.bind(this),
        };
    },

    _addFiles() {
        for (let s3file of this._serverless.service.custom.s3files || []) {
            this._s3.getObject({Bucket: s3file.Bucket, Key: s3file.Key}, (s3Error, data) => {
                if (s3Error) {
                    throw s3Error;
                }

                let filepath = path.join(this._cwd, s3file.Dst);

                fs.writeFile(filepath, data.Body, (fsError) => {
                    if (fsError) {
                        throw fsError;
                    }

                    this._deployedFiles.push(filepath);
                    this._serverless.cli.log('Wrote file: ' + filepath);
                });
            });
        }
    },

    _removeFiles() {
        for (let filepath of this._deployedFiles) {
            fs.unlink(filepath, (error) => {
                if (error) {
                    throw error;
                }

                this._serverless.cli.log('Removed file: ' + filepath);
            });
        }
    },
});
