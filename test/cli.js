// usage:
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --url=http://localhost:3000/api --setup=1
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --url=http://localhost:3000/api --setup=0

'use strict';

const args = require('yargs').argv;
const seal = args.seal;
const doc = args.doc;
const url = args.url;
const need_setup = args.setup;

const fs = require("fs");
const seal_data = fs.readFileSync(seal).toString('base64')
const doc_data = fs.readFileSync(doc).toString('base64')

const axios = require('axios');
const uuidv1 = require('uuid/v1');

const headers = {'Content-Type': 'application/json'};

const seal_name = 'test3';
const seal_id = "seal3"; //uuidv1();
const doc_id = "doc3"; //uuidv1();
const office_id = "office3"; //uuidv1();

function setup() {
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
        'officeId': office_id,
        'name': 'my office',
        'imageServiceAddress': 'http://192.168.1.5:5000/api/v1/compare'
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
}

if (need_setup == 1) {
    setup();
} else {
    const v_data = {
        '$class': 'ai.smartcity.VerifyDocument',
        'office': 'resource:ai.smartcity.Office#'+office_id,
        'document': 'resource:ai.smartcity.Document#'+doc_id,
        'sealName': seal_name,
        'transactionId': '',
        'timestamp': '2020-01-11T00:00:00.00Z'
    };

    console.log(v_data);

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
}
