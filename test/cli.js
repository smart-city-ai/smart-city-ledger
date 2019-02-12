// usage:
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --image_url=http://192.168.1.5:5000/api/v1/compare_images --blockchain_url=http://localhost:3000/api --setup=participant
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --image_url=http://192.168.1.5:5000/api/v1/compare_images --blockchain_url=http://localhost:3000/api --setup=doc
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --image_url=http://192.168.1.5:5000/api/v1/compare_images --blockchain_url=http://localhost:3000/api --setup=seal
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --image_url=http://192.168.1.5:5000/api/v1/compare_images --blockchain_url=http://localhost:3000/api --setup=verify
// node ./cli.js --seal=seal.jpg --doc=doc.jpg --image_url=http://192.168.1.5:5000/api/v1/compare_images --blockchain_url=http://localhost:3000/api --setup=result
'use strict';

const args = require('yargs').argv;
const seal = args.seal;
const doc = args.doc;
const url = args.blockchain_url;
const image_url = args.image_url;

const fs = require("fs");
const seal_data = fs.readFileSync(seal).toString('base64')
const doc_data = fs.readFileSync(doc).toString('base64')

const axios = require('axios');
const uuidv1 = require('uuid/v1');

const headers = {'Content-Type': 'application/json'};

const seal_name = 'my seal';
const doc_id = "doc1"; 
const office_id = "office1";
const biz_id = "biz1";
const seal_id = biz_id + '-' + seal_name; 

function setup_participants() {
    const o_data = {
        '$class': 'ai.smartcity.Office',
        'officeId': office_id,
        'name': 'my office',
        'imageServiceAddress': image_url
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
    
    const b_data = {
        '$class': 'ai.smartcity.Business',
        'businessId': biz_id,
        'name': 'my biz'
    }


    axios({
        method: 'post',
        url: url + '/Business',
        headers: headers,
        data: b_data
    })
        .then(msg => {
            console.log('suceeded in creating biz');
        })
        .catch(function (error) {
            console.log('failed in creating biz');
        });
    
}

function setup_doc() {
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

}

function add_seal() {
    const p_data = {
        '$class': 'ai.smartcity.AddSeal',
        'owner': 'resource:ai.smartcity.Business#'+biz_id,
        'name': seal_name,
        'image': seal_data
    };

    axios({
        method: 'post',
        url: url + '/AddSeal',
        headers: headers,
        data: p_data
    })
        .then(msg => {
            console.log('suceeded in creating seal');
        })
        .catch(function (error) {
            console.log('failed in creating seal');
        });    
}

function verify() {
    const v_data = {
        '$class': 'ai.smartcity.VerifyDocumentBySeal',
        'office': 'resource:ai.smartcity.Office#'+office_id,
        'document': 'resource:ai.smartcity.Document#'+doc_id,
        'seal': 'resource:ai.smartcity.Seal#'+seal_id,
    };

    console.log(v_data);

    axios({
        method: 'post',
        url: url + '/VerifyDocumentBySeal',
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

function read_doc(){
    axios({
        method: 'get',
        url: url + '/Document/' + doc_id
    })
        .then(response => {
            var data = response.data;
            const status = data.sealStatus;
            var PImage = require('pureimage');
            for (let i = 0; i < status.length; i ++) {
                const st = status[i].status;
                const seal_name = status[i].sealName;
                // console.log("seal name: " + seal_name);
                var st_json = JSON.parse(st);
                const allpts = JSON.parse(st_json);
                PImage.decodeJPEGFromStream(fs.createReadStream(doc))
                    .then((img) => {
                        var ctx = img.getContext('2d');
                        for (let j = 0; j < allpts.length; j ++) {
                            const pts = allpts[j];
                            var x = pts[0][0], y = pts[0][1], w = pts[1][0] - pts[0][0], h = pts[1][1] - pts[0][1];
                            var r = pts[2][0], g = pts[2][1], b = pts[2][2];
                            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b +',1.0)';
                            for(let k = 0; k < 10; k ++) {
                                ctx.strokeRect(x - k, y - k, w + 2*k, h + 2*k);
                                ctx.strokeRect(x + k, y + k ,w - 2*k, h - 2*k);                                
                            }   
                        }
                        var path = seal_name.split(' ').join('-') + '-' + doc;
                        PImage.encodeJPEGToStream(img,fs.createWriteStream(path))
                            .then(() => {
                                console.log("write to " + path);
                            });
                    });
            }
        })
        .catch(function (error) {
            console.log('failed in reading doc:' + error);
        });    
}

switch(args.setup.toLowerCase()){
case "participant":
    setup_participants();
    break;
case "doc":
    setup_doc();
    break;
case "seal":
    add_seal();
    break;
case "verify":
    verify();
    break;
case "result":
    read_doc();
    break;
default:
    console.log("wrong args: " + args.setup);
}
