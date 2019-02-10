// usage: node ./cli.js --seal=seal.jpg --doc=doc.jpg --url=http://localhost:3000/api

'use strict';

const args = require('yargs').argv;
const seal = args.seal;
const doc = args.doc;
const url = args.url;

const fs = require("fs");
const seal_data = fs.readFileSync(seal).toString('base64')
const doc_data = fs.readFileSync(doc).toString('base64')

const axios = require('axios');
const uuidv1 = require('uuid/v1');

const headers = {'Content-Type': 'application/json'};

const seal_name = 'test-seal';
const seal_id = uuidv1();
const doc_id = uuidv1();
const office_id = uuidv1();

const p_data = {
    '$class': 'ai.smartcity.Seal',
    'sealId':  seal_id,
    'ownerID': uuidv1(),
    'name': seal_name,
    'image': seal_data
};

axios({
        method: 'post',
        url: url + '/Seal',
        headers: headers,
        data: p_data
    })
    .then(msg => {
        console.log('suceeded in creating seal');
    })
    .catch(function (error) {
        console.log('failed in creating seal');
    });


const d_data = {
    '$class': 'ai.smartcity.Document',
    'docId': doc_id,
    'sealStatus': [],
    'image': doc_data
}

axios({
        method: 'post',
        url: url + '/Document',
        headers: headers,
        data: d_data
    })
    .then(msg => {
        console.log('suceeded in creating doc');
    })
    .catch(function (error) {
        console.log('failed in creating doc');
    });

const o_data = {
    '$class': 'ai.smartcity.Office',
    'OfficeId': office_id,
    'name': 'my office',
    'imageServiceAddress': 'http://127.0.0.1/'
}


axios({
        method: 'post',
        url: url + '/Office',
        headers: headers,
        data: o_data
    })
    .then(msg => {
        console.log('suceeded in creating office');
    })
    .catch(function (error) {
        console.log('failed in creating office');
    });


const v_data = {
    '$class': 'ai.smartcity.VerifyDocument',
    'office': 'resource:ai.smartcity.Office#'+office_id,
    'document': 'resource:ai.smartcity.Document#'+doc_id,
    'sealName': seal_name,
};


axios({
        method: 'post',
        url: url + '/VerifyDocument',
        headers: headers,
        data: v_data
    })
    .then(msg => {
        console.log('suceeded in transacting verify doc');
    })
    .catch(function (error) {
        console.log('failed in transacting verify doc:' + error);
    });
