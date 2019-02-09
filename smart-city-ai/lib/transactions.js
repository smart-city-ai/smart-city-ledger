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
        throw new Error('Office does not exist - check Office id');
    }
    const assetRegistry = await getAssetRegistry('ai.smartcity.Document')
    var  doc = erifyDocument.document;
    const assetExist = await assetRegistry.Exists(doc.docId);
    if (assetExist == false) {
        throw new Error('document does not exist');
    }   
    const url = verifyDocument.office.imageServiceAddress;
    const image = doc.image;
    const sealName = verifyDocument.sealName;
    
    var data = {'name': sealName, "image": image};
    var headers = {'Content-Type': 'application/json'};

    console.log("image addr: " + endpoint + 'seal name:' + sealName);
    var st = "";
    const axios = require('axios');
    axios({
        method: 'post',
        url: url,
        headers: headers,
        data: data
    })
    .done(function( msg ) {
        console.log(msg);
        st = msg;
    });
    var factory = getFactory();
    var newStatus = factory.newConcept(sealName, st)
    doc.status.push(newStatus);
    //get asset registry for Coins and Energy, and update on the ledger
    return getAssetRegistry('ai.smartcity.Document')
        .then(function (assetRegistry) {
            return assetRegistry.updateAll([doc]);
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
