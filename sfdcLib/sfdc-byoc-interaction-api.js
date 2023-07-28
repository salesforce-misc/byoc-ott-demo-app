const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const getAccessToken = require('./sfdc-auth');

// Import dotenv that loads the config metadata from .env
require('dotenv').config();

// Get config metadata from .env
const {
  SF_SCRT_INSTANCE_URL,
} = process.env;

/**
 * Sends a SF inbound message to Salesforce via the BYOC REST API.
 *
 * @param {string} orgId: The organization id for the login user
 * @param {string} authorizationContext: The AuthorizationContext which is ConversationChannelDefinition developer name for request authorization
 * @param {string} conversationAddressIdentifier: The conversation address identifier used for the inbound/outbound messaging
 * @param {string} endUserClientIdentifier: The end user client identifier used for the inbound/outbound messaging  
 * @param {string} message: The inbound message sent from a end user client to Salesforce
 * @param {object} attachment: The attachment
 * @returns {object} result object from interaction service with successful status or error code
 */
async function sendSFInboundMessageInteraction(orgId, authorizationContext, conversationAddressIdentifier, endUserClientIdentifier, req) {
  let message = req.body.message;
  let attachment = req.file;
  let timestamp = req.body.timestamp;
  console.log(`\n====== Start sendSFInboundMessageInteraction().\nmessage="${message}"\nattachment=${attachment}\ntimestamp=${timestamp}`);

  // Send 'TypingStoppedIndicator' request before send the message in order to remove typing indicator if any
  sendSFInboundTypingIndicatorInteraction(orgId, authorizationContext, conversationAddressIdentifier, endUserClientIdentifier, 'TypingStoppedIndicator');

  const accessToken = await getAccessToken();
  let jsonData = {};
  let formData = new FormData();
  let interactionType;
  const entryId = uuidv4();

  if (attachment === undefined) {
    jsonData = getSFInboundTextMessageFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, message);
    interactionType = 'EntryInteraction';
  } else {
    formData.append('attachments', fs.createReadStream(__dirname + '/../' + attachment.path), attachment.originalname);
    jsonData = getSFInboundAttachmentMessageFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, message, attachment.size);
    interactionType = 'AttachmentInteraction';
  }

  formData.append('json', JSON.stringify(jsonData), {contentType: 'application/json'});

  const requestHeader = getInboundMessageRequestHeader(accessToken, orgId, authorizationContext);

  const responseData = await axios.post(
    SF_SCRT_INSTANCE_URL + '/api/v1/interactions',
    formData,
    requestHeader
  ).then(function (response) {
    if (attachment) {
      let fileName = attachment.originalname;
      let parts = fileName.split('.');
      let length = parts.length;
      if ( length > 1) {
        let extension = parts.pop();
        fileName = parts.join('.') + timestamp + '.' + extension;
      } else {
        fileName = fileName + timestamp;
      }

      let oldName = __dirname + '/../' + attachment.path;
      let newName = __dirname + '/../uploads/' + fileName;
      fs.rename(oldName, newName, () => {
        console.log(`\n====== File rename success from "${oldName}" to "${newName}"`);
      });
    }

    fs.recipientUserName
    console.log(`\n====== sendSFInboundMessageInteraction() success for interactionType "${interactionType}": `, response.data);
    return response.data;
  })
  .catch(function (error) {
    // Remove the uploaded temp file
    if (attachment) {
      deleteUploadedTempFile(__dirname + '/../' + attachment.path);
    }

    let responseData = error.response.data;
    sendSFInboundMessageDeliveryFailedInteraction(entryId, interactionType, orgId, authorizationContext, conversationAddressIdentifier, endUserClientIdentifier, responseData.code);

    console.log(`\n====== sendSFInboundMessageInteraction() error for interactionType "${interactionType}": `, responseData);
    return error;
  });

  return responseData;
}

/**
 * Sends a SF inbound TypingStartedIndicator to Salesforce via the BYOC REST API.
 *
 * @param {string} orgId: The organization id for the login user
 * @param {string} authorizationContext: The AuthorizationContext which is ConversationChannelDefinition developer name for request authorization
 * @param {string} conversationAddressIdentifier: The conversation address identifier used for the inbound/outbound messaging
 * @param {string} endUserClientIdentifier: The end user client identifier used for the inbound/outbound messaging  
 * @returns {object} result object from interaction service with successful status or error code
 */
async function sendSFInboundTypingIndicatorInteraction(orgId, authorizationContext, conversationAddressIdentifier, endUserClientIdentifier, entryType) {
  console.log(`\n====== Start sendSFInboundTypingIndicatorInteraction() with entryType: ${entryType}.`);
  const accessToken = await getAccessToken();
  let jsonData = getSFInboundTypingIndicatorFormData(conversationAddressIdentifier, endUserClientIdentifier, entryType);

  const requestHeader = getInboundMessageRequestHeader(accessToken, orgId, authorizationContext);

  const formData = new FormData();
  formData.append('json', JSON.stringify(jsonData), {contentType: 'application/json'});

  const responseData = await axios.post(
    SF_SCRT_INSTANCE_URL + '/api/v1/interactions',
    formData,
    requestHeader
  ).then(function (response) {
    if(response && response.data) {
      console.log('\n====== sendSFInboundTypingIndicatorInteraction() success: ', response.data);
    }

    return response;
  })
  .catch(function (error) {
    if (error && error.response && error.response.data) {
      let responseData = error.response.data;
      console.log('\n====== sendSFInboundTypingIndicatorInteraction() error: ', responseData);
    }

    return error;
  });

  return responseData;
}

/**
 * Sends a SF inbound MessageDeliveryFailed to Salesforce via the BYOC REST API.
 *
 * @param {string} entryId: The entryId for the failed message delivery
 * @param {string} orgId: The organization id for the login user
 * @param {string} authorizationContext: The AuthorizationContext which is ConversationChannelDefinition developer name for request authorization
 * @param {string} conversationAddressIdentifier: The conversation address identifier used for the inbound/outbound messaging
 * @param {string} endUserClientIdentifier: The end user client identifier used for the inbound/outbound messaging  
 * @returns {object} result object from interaction service with successful status or error code
 */
async function sendSFInboundMessageDeliveryFailedInteraction(entryId, interactionType, orgId, authorizationContext, conversationAddressIdentifier, endUserClientIdentifier, errorCode) {
  console.log(`\n====== Start sendSFInboundMessageDeliveryFailedInteraction() for interactionType: "${interactionType}" and entryId: "${entryId}".`);
  const accessToken = await getAccessToken();
  let jsonData = getSFInboundMessageDeliveryFailedFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, errorCode);

  const requestHeader = getInboundMessageRequestHeader(accessToken, orgId, authorizationContext);

  const formData = new FormData();
  formData.append('json', JSON.stringify(jsonData), {contentType: 'application/json'});

  const responseData = await axios.post(
    SF_SCRT_INSTANCE_URL + '/api/v1/interactions',
    formData,
    requestHeader
  ).then(function (response) {
    console.log('\n====== sendSFInboundMessageDeliveryFailedInteraction() success: ', response.data);
    return response.data;
  })
  .catch(function (error) {
    if (error && error.response && error.response.data) {
      console.log('\n====== sendSFInboundMessageDeliveryFailedInteraction() error: ', error.response.data);
    }
    
    return error;
  });

  return responseData;
}

function getSFInboundTextMessageFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, message) {
  return {
    "to": conversationAddressIdentifier,
    "from": endUserClientIdentifier,
    "interactions": [{
      "timestamp": 1688190840000,
      "interactionType": "EntryInteraction",
      "payload": {
        "id": entryId,
        "entryType": "Message",
        "abstractMessage": {
          "messageType": "StaticContentMessage",
          "id": entryId,
          "staticContent": {
            "formatType": "Text",
            "text": message
          }
        }
      }
    }]
  };
}

function getSFInboundAttachmentMessageFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, message, contentLength) {
  return {
    "to": conversationAddressIdentifier,
    "from": endUserClientIdentifier,
    "interactions": [{
      "timestamp": 1688190840000,
      "interactionType": "AttachmentInteraction",
      "id": entryId,
      "attachmentIndex": 0,
      "contentLength": contentLength,
      "text": message
    }]
  };
}

function getSFInboundTypingIndicatorFormData(conversationAddressIdentifier, endUserClientIdentifier, entryType) {
  const uuid = uuidv4();
  return {
    "to": conversationAddressIdentifier,
    "from": endUserClientIdentifier,
    "interactions": [{
      "timestamp": 1688190840000,
      "interactionType": "EntryInteraction",
      "payload": {
        "id": uuid,
        "entryType": entryType,
        "timestamp": 1688190840000
      }
    }]
  };
}

function getSFInboundMessageDeliveryFailedFormData(entryId, conversationAddressIdentifier, endUserClientIdentifier, errorCode) {
  const uuid = uuidv4();
  return {
    "to": conversationAddressIdentifier,
    "from": endUserClientIdentifier,
    "interactions": [{
      "timestamp": 1688190840000,
      "interactionType": "EntryInteraction",
      "payload": {
        "id": uuid,
        "failedConversationEntryIdentifier": entryId,
        "entryType": "MessageDeliveryFailed",
        "recipient": {
           "appType": "11",
           "subject": endUserClientIdentifier,
           "role": "4"
        },
        "errorCode": ""+errorCode
      }
    }]
  };
}

function getInboundMessageRequestHeader(accessToken, orgId, authorizationContext) {
  return {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
      "Accept": "application/json",
      "OrgId": orgId,
      "AuthorizationContext": authorizationContext,
      "RequestId": "f8f81c06-c06a-4784-b96c-ca95d3321bd9"
    }
  };
}

function append_object_to_FormData(formData, obj, key) {
  var i, k;
  for(i in obj) {
    k = key ? key + '[' + i + ']' : i;
    if(typeof obj[i] == 'object')
      append_object_to_FormData(formData, obj[i], k);
    else
      formData.append(k, obj[i]);
  }
}

function deleteUploadedTempFile(filePath) {
  fs.unlink(filePath, function(err) {
    if(err) {
      console.log('\n====== File delete error: ', err);
    } else {
      console.log('\n====== The file was deleted successfully');
    }
  });
}

module.exports = {
  sendSFInboundMessageInteraction,
  sendSFInboundTypingIndicatorInteraction
};
