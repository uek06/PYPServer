'use strict';

var firebase = require('firebase-admin');

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
 * Send a new star notification email to the user with the given UID.
 */
// [START single_value_read]
function sendNotificationToUser(uid, postId) {
  // Fetch the user's email.
  var userRef = firebase.database().ref('/users/' + uid);
  userRef.once('value').then(function(snapshot) {
    var email = snapshot.val().email;
    // Send the email to the user.
    // [START_EXCLUDE]
    if (email) {
      sendNotificationEmail(email).then(function() {
        // Save the date at which we sent that notification.
        // [START write_fan_out]
        var update = {};
        update['/posts/' + postId + '/lastNotificationTimestamp'] =
            firebase.database.ServerValue.TIMESTAMP;
        update['/user-posts/' + uid + '/' + postId + '/lastNotificationTimestamp'] =
            firebase.database.ServerValue.TIMESTAMP;
        firebase.database().ref().update(update);
        // [END write_fan_out]
      });
    }
    // [END_EXCLUDE]
  }).catch(function(error) {
    console.log('Failed to send notification to user:', error);
  });
}
// [END single_value_read]


/**
 * Keep the likes count updated and send email notifications for new likes.
 */
function startListeners() {
  firebase.database().ref('/posts').on('child_added', function(postSnapshot) {
    var postReference = postSnapshot.ref;
    var uid = postSnapshot.val().uid;
    var postId = postSnapshot.key;
    // Update the star count.
    // [START post_value_event_listener]
    postReference.child('stars').on('value', function(dataSnapshot) {
      //updateStarCount(postReference);
    }, function(error) {
      console.log('Failed to add "value" listener at /posts/' + postId + '/stars node:', error);
    });
    // [END post_value_event_listener]
    // Send email to author when a new star is received.
    // [START child_event_listener_recycler]
    postReference.child('stars').on('child_added', function(dataSnapshot) {
      //sendNotificationToUser(uid, postId);
    }, function(error) {
      console.log('Failed to add "child_added" listener at /posts/' + postId + '/stars node:', error);
    });
    // [END child_event_listener_recycler]
  });
  console.log('Server started...');
}

// Start the server.
startListeners();