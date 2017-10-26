/**
 * Copyright (C) 2016 Inspired Member, Inc.
 */
'use strict';

let AWS = require('aws-sdk');
let Class = require('class.extend');
let fs = require('fs');
let path = require('path');

let Promise = require('bluebird');

module.exports = Class.extend({
    init(serverless, opts) {
        this._serverless = serverless;
        this._opts = opts;

        this._cwd = this._serverless.config.servicePath;
        this._s3 = new AWS.S3();

        this._deployedFiles = [];

        this.hooks = {
            'before:deploy:initialize': this._beforeInitialize.bind(this),
            'after:deploy:deploy': this._afterDeploy.bind(this),
        };
    },

    _afterDeploy() {
        let s3ops = this._deployedFiles.map((f) => {
            return this.__delete(f).then(() => {
                null;
            }).catch((error) => {
                throw error;
            });
        });

        return new Promise.all(s3ops).then(() => {
            //this._serverless.cli.log('Removed files: ' + this._deployedFiles.length);
        }).catch((error) => {
            this._serverless.cli.log('Error removing files: ' + error);
        });
    },

    _beforeInitialize() {
        let s3files = this._serverless.service.custom.s3files || [];
        let s3ops = s3files.map((f) => {
            return this.__read({Bucket: f.Bucket, Key: f.Key}).then((data) => {
                return this.__write(f.Dst, data);
            }).catch((error) => {
                throw error;
            });
        });

        return new Promise.all(s3ops).then((results) => {
            //this._serverless.cli.log('Added files: ' + s3files.length);
        }).catch((error) => {
            this._serverless.cli.log('Error adding files: ' + error);
        });
    },

    __delete(filepath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filepath, (error) => {
                if (error) {
                    reject(error);
                }

                this._serverless.cli.log('Removed file: ' + filepath);

                resolve();
            });

        });
    },

    __read(query) {
        return new Promise((resolve, reject) => {
            this._s3.getObject(query, (s3Error, data) => {
                if (s3Error) {
                    reject(s3Error);
                }

                resolve(data);
            });
        });
    },

    __write(filename, data) {
        return new Promise((resolve, reject) => {
            let filepath = path.join(this._cwd, filename);

            fs.writeFile(filepath, data.Body, (fsError) => {
                if (fsError) {
                    reject(fsError);
                }

                this._deployedFiles.push(filepath);
                this._serverless.cli.log('Added file: ' + filepath);

                resolve();
            });
        });
    },
});
