#!/bin/bash
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# REMOVE EXISTING REST SERVER, PLAYGROUND ETC
docker rm -f $(docker ps -a | grep hyperledger/* | awk '{ print $1 }')
docker rm -f $(docker ps -a | grep smart-city-ai | awk '{ print $1 }')
docker rm -f $(docker ps -a |grep verititude/composer | awk '{print $1}')
docker rmi $(docker images |grep smart-city-ai |awk '{print $1}')

docker pull hyperledger/composer-playground:latest
docker pull hyperledger/composer-cli:latest
docker pull hyperledger/composer-rest-server:latest

uid=$(stat -c "%u:%g" .)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# GET AND SETUP FABRIC
rm -rf $DIR/fabric-tools
mkdir $DIR/fabric-tools
chmod 777 $DIR/fabric-tools
cd $DIR/fabric-tools

curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
tar -xvf $DIR/fabric-tools/fabric-dev-servers.tar.gz
$DIR/fabric-tools/startFabric.sh

cd $DIR

# CREATE LOCATION FOR LOCAL CARD STORE
rm -rf $(pwd)/.loc-card-store
mkdir $(pwd)/.loc-card-store
chmod 777 $(pwd)/.loc-card-store

# CREATE CONNECTION PROFILE
rm -fr $(pwd)/loc-stage
mkdir $(pwd)/loc-stage
chmod 777 $(pwd)/loc-stage
echo '{
	"name": "hlfv1",
	"version": "1.0.0",
	"client": {
		"organization": "Org1",
		"connection": {
			"timeout": {
				"peer": {
					"endorser": "300",
					"eventHub": "300",
					"eventReg": "300"
				},
				"orderer": "300"
			}
		}
	},
	"orderers": {
		"orderer.example.com": {
			"url": "grpc://orderer.example.com:7050",
			"grpcOptions": {}
		}
	},
	"peers": {
		"peer0.org1.example.com": {
			"url": "grpc://peer0.org1.example.com:7051",
			"eventUrl": "grpc://peer0.org1.example.com:7053",
			"grpcOptions": {},
			"endorsingPeer": true,
			"chaincodeQuery": true,
			"ledgerQuery": true,
			"eventSource": true
		}
	},
	"channels": {
		"composerchannel": {
			"orderers": ["orderer.example.com"],
			"peers": {
				"peer0.org1.example.com": {}
			}
		}
	},
	"certificateAuthorities": {
		"ca.org1.example.com": {
			"url": "http://ca.org1.example.com:7054",
			"caName": "ca.org1.example.com"
		}
	},
	"organizations": {
		"Org1": {
			"mspid": "Org1MSP",
			"peers": ["peer0.org1.example.com"],
			"certificateAuthorities": ["ca.org1.example.com"]
		}
	},
	"x-type": "hlfv1",
	"x-commitTimeout": 100
}' > $(pwd)/loc-stage/connection.json

set -e
# CREATE PEER ADMIN CARD AND IMPORT
docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/fabric-tools/fabric-scripts/hlfv1/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp:/home/composer/PeerAdmin \
  hyperledger/composer-cli:latest \
  card create -p loc-stage/connection.json -u PeerAdmin -r PeerAdmin -r ChannelAdmin -f /home/composer/loc-stage/PeerAdmin.card -c PeerAdmin/signcerts/Admin@org1.example.com-cert.pem -k PeerAdmin/keystore/114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457_sk

docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/fabric-tools/fabric-scripts/hlfv1/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp:/home/composer/PeerAdmin \
  hyperledger/composer-cli:latest \
  card import -f /home/composer/loc-stage/PeerAdmin.card


# GET THE BNA

rm -rf smart-city-ai*bna

docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd):/home/composer/network \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  hyperledger/composer-cli:latest \
  archive create -t dir -n /home/composer/network -a /home/composer/network/smart-city-ai.bna


# INSTALL THE BNA
docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/smart-city-ai.bna:/home/composer/smart-city-ai.bna \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  hyperledger/composer-cli:latest \
  network install -c PeerAdmin@hlfv1 -a smart-city-ai.bna

NETWORK_VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\.[0-9]\.[0-9]')

# START THE BNA
# this could time out due to iptable on linux. If so, flush iptables via iptables -F
docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/smart-city-ai.bna:/home/composer/smart-city-ai.bna \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  hyperledger/composer-cli:latest \
  network start -n smart-city-ai -V $NETWORK_VERSION -c PeerAdmin@hlfv1 -A admin -S adminpw -f /home/composer/loc-stage/bnaadmin.card

docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/loc-stage:/home/composer/loc-stage \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  hyperledger/composer-cli:latest \
  card import -f /home/composer/loc-stage/bnaadmin.card

# CREATE THE NEEDED PARTICIPANTS
docker run --user ${uid} \
  --rm \
  --network composer_default \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  hyperledger/composer-cli:latest \
  transaction submit -c admin@smart-city-ai -d '{"$class": "ai.smartcity.CreateDemo"}'


# START THE REST SERVER
docker run --user ${uid} \
  -d \
  --network composer_default \
  --name rest \
  -v $(pwd)/.loc-card-store:/home/composer/.composer \
  -e COMPOSER_CARD=admin@smart-city-ai \
  -e COMPOSER_NAMESPACES=never \
  -p 3000:3000 \
   verititude/composer:latest
#  hyperledger/composer-rest-server:latest

#WAIT FOR REST SERVER TO WAKE UP
sleep 10

# START IMAGE SERVICE
docker run -d \
       --network composer_default \
       --name image_service \
       -p 5000:5000 --privileged \
       verititude/image

exit 0
