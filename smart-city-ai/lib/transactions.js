/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * VerifyDocument
 * @param {ai.smartcity.VerifyDocument} verifyDocument - verify document
 * @transaction
 */
async function VerifyDocument(verifyDocument) {
    // check if office exists on the network
    const officeRegistry = await  getParticipantRegistry('ai.smartcity.Office');
    const officeExists = await officeRegistry.exists(verifyDocument.office.officeId);
    if (officeExists == false) {
        console.log('no such office ' + verifyDocument.document.office.officeId);        
        throw new Error('Office does not exist - check Office id');
    }
    const office = await officeRegistry.get(verifyDocument.office.officeId);
    console.log('office: ' + office);
    const assetRegistry = await getAssetRegistry('ai.smartcity.Document')
    const  doc = verifyDocument.document;
    const assetExist = await assetRegistry.exists(verifyDocument.document.doc.docId);
    if (assetExist == false) {
        console.log('no such doc ' + verifyDocument.document.doc.docId);
        throw new Error('document does not exist');
    }
    var doc = await assetRegistry.get(verifyDocument.document.doc.docId);
    console.log('doc: ' + doc);
    const url = office.imageServiceAddress;
    const image = doc.image;
    const sealName = verifyDocument.sealName;
    
    const data = {'name': sealName, "image": image};
    const headers = {'Content-Type': 'application/json'};

    console.log("image addr: " + endpoint + 'seal name:' + sealName);

    const axios = require('axios');
    axios({
        method: 'post',
        url: url,
        headers: headers,
        data: data
    })
    .then(msg => {
        console.log('suceeded, msg: ' + msg);
        const factory = getFactory();
        var newStatus = factory.newConcept(sealName, msg)
        doc.status.push(newStatus);
        //get asset registry for Coins and Energy, and update on the ledger
        return getAssetRegistry('ai.smartcity.Document')
            .then(function (assetRegistry) {
                return assetRegistry.updateAll([doc]);
            });        
    })
    .catch(function (error) {
        console.log('failed in verifying doc:' + error);
    });
}

/**
 * setup a demo
 * @param {ai.smartcity.CreateDemo} createDemo - Create a Demo
 * @transaction
 */
async function createDemo(){
    const factory = getFactory();
    const namespace = 'ai.smartcity';
    const officeRegistry = await  getParticipantRegistry(namespace + '.Office');
    
    office1 = factory.newResource(namespace,'Office', 'MyOffice');
    office1.name = "First Office";
    office1.imageServiceAddress = '127.0.0.1:7000';
    await officeRegistry.add(office1);

    const bizRegistry = await  getParticipantRegistry(namespace + '.Business');
    
    biz1 = factory.newResource(namespace,'Business', 'MyBiz');
    biz1.name = "First Biz";
    await bizRegistry.add(biz1);    
    
}
