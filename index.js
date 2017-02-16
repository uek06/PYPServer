'use strict';

var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
app.listen(port);

var firebase = require('firebase-admin');
require("./jDBSCAN.js");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: "pyp-project-2",
    clientEmail: "firebase-adminsdk-9tq30@pyp-project-2.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDaSKaeDuKFqY55\nqXF8q3t6tqyYxmsCiARY15hWBFf8ZQe6kx5oT2cQqG6fxY5+Aupc26Who0/UeBTB\noZxX5HyLaCniqtVbmYP/5XTx1XByWdQMyrHISHJ4c0vBqZsEGuHg51akNFJqE4gT\nZDEBHSVjbRLWqciZfv1yqH2pYNFiMA5UmILSkphZusWtgbSVwxXPLUH1kco0Hh3b\nh2HiuaI8Nq8MSRjYDF7oVrYnBNqqDMG8/92z6Nx1xrikK5eSQ3LFEMOdBf+BW0Bz\nJOuYH4LKl5uG+QBhPwRLm62LqOl51vYRKnwS/ubS+N5jpd6QyJPA2ghoL7flHuWQ\nVxqg3s6DAgMBAAECggEAPa5f3rQIEIsMJpbZ6cevOcra1MTkwi9bQxuRAWVy03Bd\nEby2z/T4A74EnIM/s53xSdILaLR0P267NsgLHM8E3oPNqi5p4dtscGgPdrLAdp+p\niv/P4u+N4Tl7Q7tAgZVzFJFqazYZv73LKueZ7V2mDgVpWF1bwPwgdEDmWXFxWVQD\nE7ID1ner6n5LY0tD9obHZQybymFHIzzXiL1crU7KmjOch6CJT0g2Zu+eWfm8+7Q3\n2vGZgvjbUqEujkiy98gegQ8BDuqFn3fUO4nhXA5Z+yNhgMgYcg89jVnUAo8gqkxT\nTDyUPIOjVz/qH1vc0WhvdcpWokx69lm4CnZodFwl+QKBgQD+YHoRocGtXxQsjqr3\nZTOWZHl8UypJ0EfGK5p5TSgsP//KJuGcQDbFxjyzU+KK5ilHJbOKiWftRcnBdPlg\n4IqVSJlLh4IiL+11Q34qEXvAO+sCRCTnm+d82ICaF+Wkicqy9CIEVR6pZXsEW8Ec\n7WCZeS+uTqE6q3Yzp2c144NU3QKBgQDbrTdYULbJMRzuHSg50Awlhifror+7DOaT\nG2RPtpKU80SAE7ZoH2/jYMAD4YXwatyPL51TOiywYUMv5XUTOt2B+KMthTrQHdxG\nwCX58Ot5/YHVUpC7JCYWWao+EKxKkmSSutTmJltT4PwObrbKVGMAwpaJbFS6+k9D\nsQcv/7BK3wKBgCAkXqhFsSxP/EOZD19NSVRyg6tC8u/6wmb28YDsT+wvdgm8Gfvd\nXU5mOxtJuTFl3cdgqywRKrGfhNvOBQjJtpkgYEZb7ASX28Bac+Gq7eEfcRWLOMKP\nP5PV44IVDO5afuNX18iGXOZ4rS+izGb0U6Vw26aBxvub2Ma0G2WCxwB9AoGALaWW\npIFRGglci5X/b9PtUjbIQMx2rrWFi/fbJj03xD+wcjSmaIhvxX2rKKNKI6Tw48fv\nFwY1lwj+3wr9Atvufz1dGu5eRDSQOxteSMtpAtZMjjkz3c8rIuXK3E62nmBBCcRM\nzO4XeBx+A7m5vd0/HT9R7IhYKuosYlJ8vdqRlV0CgYBeMFgd5PshNowGrsPS7Fo4\nxcINmBW0HQjdLtSrZ6K9sv9fyL7lU1xxJQUx6I188RAnbSsu3iadtrOZE8rlZsvz\nmHN0B+2YIUkpgwdvS0fhuxOq4RY05lwJQEdX4BI+K48OAti1+Vhm8662aGPouTnD\nx2pqBx3FvaROJIwNFa4ztw==\n-----END PRIVATE KEY-----\n"
  }),
  databaseURL: 'https://pyp-project-2.firebaseio.com'
});

/**
 * Listen the firebase database for new data points
 */
function startListeners() {
  firebase.database().ref('/dataPoints').on('child_added', function(postSnapshot) {
    console.log('New data point received ('+dataset.length+')');
    var postReference = postSnapshot.ref;
    var coord = postSnapshot.val();
    var loc = { "latitude" : coord.latitude, "longitude" :  coord.longitude};
    var dataToPush = { "location" : loc };   
    dataset.push(dataToPush);
    // Eps set to 50 meters = 0.05 km
    var dbscanner = jDBSCAN().eps(0.05).minPts(1).distance('HAVERSINE').data(dataset);
    var point_assignment_result = dbscanner();
    var clusters = dbscanner.getClusters();
    var centroids = [];
    clusters.forEach(function(y) 
    { 
      var centroid = { "latitude" : y.location.latitude, "longitude" : y.location.longitude};
      console.log("centroid : "+centroid.latitude+", "+centroid.longitude);
      centroids.push(centroid); 
    });
    var update = {};
    update['/centroids'] = centroids;
    firebase.database().ref().update(update);
  });
  console.log('Server started...');
}
var dataset = [
    
];
    
// Start the server.
startListeners();