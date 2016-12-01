/**
 * Copyright (C) 2016 Inspired Member, Inc.
 */
'use strict';

let AWS = require('aws-sdk');
let Class = require('class.extend');
let fs = require('fs');
let path = require('path');

const deployedFiles = [];

module.exports = Class.extend({
    init(serverless, opts) {
        this._serverless = serverless;
        this._opts = opts;

        this._cwd = this._serverless.config.servicePath;
        this._s3 = new AWS.S3();

        this.hooks = {
            'before:deploy:initialize': this._beforeInitialize.bind(this),
            'after:deploy:deploy': this._afterDeploy.bind(this),
        };
    },

    _afterDeploy() {
        for (let filepath of deployedFiles) {
            fs.unlink(filepath, (error) => {
                if (error) {
                    throw error;
                }

                this._serverless.cli.log('Removed file: ' + filepath);
            });
        }
    },

    _beforeInitialize() {
        let s3files = this._serverless.service.custom.s3files || [];

        for (let s3file of s3files) {
            let Key = s3file.Key;

            this._s3.getObject({Bucket: s3file.Bucket, Key: Key}, (s3Error, data) => {
                if (s3Error) {
                    throw s3Error;
                }

                let filepath = path.join(this._cwd, s3file.Dst);

                fs.writeFile(filepath, data.Body, (fsError) => {
                    if (fsError) {
                        throw fsError;
                    }

                    deployedFiles.push(filepath);
                    this._serverless.cli.log('Wrote file: ' + filepath);
                });
            });
        }
    },
});
