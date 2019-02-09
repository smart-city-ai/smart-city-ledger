'use strict';

const args = require('yargs').argv;
var image = args.image;
var url = args.url;

var fs = require("fs");
var image_data = fs.readFileSync(image).toString('base64')

const axios = require('axios');
const uuidv1 = require('uuid/v1');
var data = {
    '$class': 'ai.smartcity.Seal',
    'sealId':  uuidv1(),
    'ownerID': uuidv1(),
    'name': uuidv1(),
    'image': image_data
};
const json_data = JSON.stringify(data);
var headers = {'Content-Type': 'application/json'};

axios({
        method: 'post',
        url: url,
        headers: headers,
        data: data
    })
    .then(msg => {
        console.log('suceeded');
    })
    .catch(function (error) {
        console.log('failed');
    });
