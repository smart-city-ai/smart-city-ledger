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
    console.log("@debug: verify doc: " + verifyDocument);
    console.log("@debug: verify office id: " +verifyDocument.office.officeId);
    console.log("@debug: verify doc id: " +verifyDocument.document.docId);        
    
    // check if office exists on the network
    const officeRegistry = await  getParticipantRegistry('ai.smartcity.Office');
    const officeExists = await officeRegistry.exists(verifyDocument.office.officeId);
    if (officeExists == false) {
        console.log('@debug: no such office ' + verifyDocument.document.office.officeId);        
        throw new Error('Office does not exist - check Office id');
    }
    const office = await officeRegistry.get(verifyDocument.office.officeId);
    console.log('@debug: office: ' + office);
    const assetRegistry = await getAssetRegistry('ai.smartcity.Document')
    const assetExist = await assetRegistry.exists(verifyDocument.document.docId);
    if (assetExist == false) {
        console.log('@debug: no such doc ' + verifyDocument.document.docId);
        throw new Error('document does not exist');
    }
    var doc = await assetRegistry.get(verifyDocument.document.docId);
    console.log('@debug: doc: ' + doc);
    const url = office.imageServiceAddress;
    const image = doc.image;
    const sealName = verifyDocument.sealName;
    
    const data = {'name': sealName, "image": image};
    const headers = {'Content-Type': 'application/json'};

    console.log("@debug: image addr: " + url + ', seal name:' + sealName);
    const msg = await request.post({ uri: url, json: JSON.stringify(data) });
    console.log("@debug: http response: " + JSON.stringify(msg));
    const strMsg = JSON.stringify(msg);
    const factory = getFactory();
    var newStatus = factory.newConcept('ai.smartcity', 'sealStatus')
    newStatus.sealName = sealName;
    newStatus.status = strMsg;
    if (doc.sealStatus === undefined) {
        doc.sealStatus = new Array();
    }
    doc.sealStatus.push(newStatus);
    //get asset registry for Coins and Energy, and update on the ledger
    return getAssetRegistry('ai.smartcity.Document')
        .then(function (assetRegistry) {
            return assetRegistry.updateAll([doc]);
        });        
}



/**
 * VerifyDocument using a given seal asset
 * @param {ai.smartcity.VerifyDocumentBySeal} verifyDocument - verify document
 * @transaction
 */
async function VerifyDocumentBySeal(verifyDocument) {
    console.log("@debug: verify doc: " + verifyDocument);
    console.log("@debug: verify office id: " +verifyDocument.office.officeId);
    console.log("@debug: verify doc id: " +verifyDocument.document.docId);        
    console.log("@debug: verify seal id: " +verifyDocument.seal.sealId);
    
    // check if office exists on the network
    const officeRegistry = await  getParticipantRegistry('ai.smartcity.Office');
    const officeExists = await officeRegistry.exists(verifyDocument.office.officeId);
    if (officeExists == false) {
        console.log('@debug: no such office ' + verifyDocument.document.office.officeId);        
        throw new Error('Office does not exist - check Office id');
    }
    const office = await officeRegistry.get(verifyDocument.office.officeId);
    console.log('@debug: office: ' + office);

    const assetRegistry = await getAssetRegistry('ai.smartcity.Document')
    const assetExist = await assetRegistry.exists(verifyDocument.document.docId);
    if (assetExist == false) {
        console.log('@debug: no such doc ' + verifyDocument.document.docId);
        throw new Error('document does not exist');
    }
    var doc = await assetRegistry.get(verifyDocument.document.docId);
    console.log('@debug: doc: ' + doc);

    const sealRegistry = await getAssetRegistry('ai.smartcity.Seal')
    const sealExist = await sealRegistry.exists(verifyDocument.seal.sealId);
    if (sealExist == false) {
        console.log('@debug: no such seal ' + verifyDocument.seal.sealId);
        throw new Error('seal does not exist');
    }
    var seal = await sealRegistry.get(verifyDocument.seal.sealId);
    console.log('@debug: seal: ' + seal);
    
    const url = office.imageServiceAddress;
    const doc_image = doc.image;
    const seal_image = seal.image;
    
    const data = {'truth_image': seal_image, "verify_image": doc_image};
    const headers = {'Content-Type': 'application/json'};

    console.log("@debug: image addr: " + url + ', seal name:' + seal.name);
    const msg = await request.post({ uri: url, json: JSON.stringify(data) });
    console.log("@debug: http response: " + JSON.stringify(msg));
    const strMsg = JSON.stringify(msg);
    const factory = getFactory();
    var newStatus = factory.newConcept('ai.smartcity', 'sealStatus')
    newStatus.sealName = seal.name;
    newStatus.status = strMsg;
    if (doc.sealStatus === undefined) {
        doc.sealStatus = new Array();
    }
    doc.sealStatus.push(newStatus);
    //get asset registry for Coins and Energy, and update on the ledger
    return getAssetRegistry('ai.smartcity.Document')
        .then(function (assetRegistry) {
            return assetRegistry.updateAll([doc]);
        });        
}


/**
 * add a seal
 * @param {ai.smartcity.AddSeal} addSeal - add a seal
 * @transaction
 */
async function AddSeal(addSeal) {
    const factory = getFactory();
    const namespace = 'ai.smartcity';
    
    const bizRegistry = await  getParticipantRegistry(namespace + '.Business');
    const bizExists = await bizRegistry.exists(addSeal.owner.businessId);
    if (bizExists == false) {
        console.log('@debug: no such biz ' + addSeal.owner.businessId);        
        throw new Error('business does not exist - check business id');
    }
    console.log("@debug: to add seal");
    return getAssetRegistry('ai.smartcity.Seal')
        .then(function (assetRegistry) {
            const sealId = addSeal.owner.businessId + "-" + addSeal.name;
            var seal = factory.newResource(namespace,'Seal', sealId);
            seal.name = addSeal.name;
            seal.image = addSeal.image;
            seal.owner = addSeal.owner;
            console.log("@debug: adding seal " + seal);
            return assetRegistry.add(seal);
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
